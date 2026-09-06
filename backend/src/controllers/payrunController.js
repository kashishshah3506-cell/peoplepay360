const pool = require('../config/db');
const { computePayslipLines } = require('../utils/payrollEngine');

const getPayruns = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, ss.name AS structure_name,
        (SELECT COUNT(*) FROM payslips ps WHERE ps.payrun_id = p.id) AS payslip_count
      FROM payruns p
      LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
      ORDER BY p.period_start DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPayrunById = async (req, res) => {
  const { id } = req.params;
  try {
    const payrun = await pool.query(`
      SELECT p.*, ss.name AS structure_name
      FROM payruns p LEFT JOIN salary_structures ss ON p.salary_structure_id = ss.id
      WHERE p.id = $1
    `, [id]);
    if (payrun.rows.length === 0) return res.status(404).json({ message: 'Payrun not found' });

    const payslips = await pool.query(`
      SELECT ps.*, e.name AS employee_name
      FROM payslips ps JOIN employees e ON ps.employee_id = e.id
      WHERE ps.payrun_id = $1
      ORDER BY e.name
    `, [id]);

    res.json({ ...payrun.rows[0], payslips: payslips.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Step 2 of wizard: given scope (structure_id, period_start, period_end), return eligible employees
// i.e. employees with a Running contract overlapping the period
const getEligibleEmployees = async (req, res) => {
  const { period_start, period_end } = req.query;
  if (!period_start || !period_end) {
    return res.status(400).json({ message: 'period_start and period_end are required' });
  }
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (e.id) e.id AS employee_id, e.name, ws.total_weekly_hours,
             c.id AS contract_id, c.wage, c.start_date, c.end_date
      FROM employees e
      JOIN contracts c ON c.employee_id = e.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      WHERE c.status = 'Running'
        AND c.start_date <= $2
        AND (c.end_date IS NULL OR c.end_date >= $1)
        AND e.status = 'Active'
      ORDER BY e.id, c.start_date DESC
    `, [period_start, period_end]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Final wizard step: create the Payrun and its (empty, Draft) Payslips for selected employees
const createPayrun = async (req, res) => {
  const { name, salary_structure_id, period_start, period_end, employee_ids } = req.body;

  if (!name || !salary_structure_id || !period_start || !period_end || !Array.isArray(employee_ids) || employee_ids.length === 0) {
    return res.status(400).json({ message: 'name, salary_structure_id, period_start, period_end, and at least one employee_id are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const payrunResult = await client.query(`
      INSERT INTO payruns (name, salary_structure_id, period_start, period_end, status)
      VALUES ($1,$2,$3,$4,'Draft') RETURNING *
    `, [name, salary_structure_id, period_start, period_end]);
    const payrun = payrunResult.rows[0];

    for (const employeeId of employee_ids) {
      // find active contract for this employee & period
      const contractResult = await client.query(`
        SELECT * FROM contracts
        WHERE employee_id = $1 AND status = 'Running'
          AND start_date <= $3 AND (end_date IS NULL OR end_date >= $2)
        ORDER BY start_date DESC LIMIT 1
      `, [employeeId, period_start, period_end]);

      const contract = contractResult.rows[0] || null;

      await client.query(`
        INSERT INTO payslips (payrun_id, employee_id, contract_id, status, has_warning, warning_message)
        VALUES ($1,$2,$3,'Draft',$4,$5)
      `, [
        payrun.id, employeeId, contract ? contract.id : null,
        contract ? false : true,
        contract ? null : 'No active contract found for this period'
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json(payrun);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

// Compute: run the salary rule engine for every payslip in this payrun
const computePayrun = async (req, res) => {
  const { id } = req.params;

  try {
    const payrunResult = await pool.query('SELECT * FROM payruns WHERE id = $1', [id]);
    if (payrunResult.rows.length === 0) return res.status(404).json({ message: 'Payrun not found' });
    const payrun = payrunResult.rows[0];

    const payslipsResult = await pool.query('SELECT * FROM payslips WHERE payrun_id = $1', [id]);

    for (const payslip of payslipsResult.rows) {
      if (!payslip.contract_id) {
        continue; // already flagged with warning at creation time
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

                const contractResult = await client.query('SELECT * FROM contracts WHERE id = $1', [payslip.contract_id]);
        const contract = contractResult.rows[0];

        // Check for missing bank details — surfaced as a payslip warning per spec
        const employeeResult = await client.query(
          'SELECT bank_account_number FROM employees WHERE id = $1',
          [payslip.employee_id]
        );
        const missingBankDetails = !employeeResult.rows[0]?.bank_account_number;

        // Worked days ratio: (attendance-based in a fuller version); for now assume full period worked = 1.0
        // A more advanced version could pull actual attendance/time-off days here.
        const periodDays = Math.round(
          (new Date(payrun.period_end) - new Date(payrun.period_start)) / (1000 * 60 * 60 * 24)) + 1;

        // Worked days ratio: real count of Present/Late/Overtime attendance days in this period
        const presentResult = await client.query(`
          SELECT COUNT(DISTINCT check_in::date) AS days_present
          FROM attendance
          WHERE employee_id = $1
            AND check_in::date BETWEEN $2 AND $3
            AND status IN ('Present','Late','Overtime')
        `, [payslip.employee_id, payrun.period_start, payrun.period_end]);

        const daysPresent = parseInt(presentResult.rows[0].days_present) || 0;
        const workedDaysRatio = periodDays > 0 ? daysPresent / periodDays : 0;

        const { lines, gross_salary, total_deductions, net_salary } = await computePayslipLines(
          payrun.salary_structure_id, contract, workedDaysRatio
        );

        await client.query('DELETE FROM payslip_lines WHERE payslip_id = $1', [payslip.id]);
        for (const line of lines) {
          await client.query(`
            INSERT INTO payslip_lines (payslip_id, salary_rule_id, name, code, category, amount, sequence)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
          `, [payslip.id, line.salary_rule_id, line.name, line.code, line.category, line.amount, line.sequence]);
        }

        await client.query(`
          UPDATE payslips SET
            worked_days = $1, gross_salary = $2, total_deductions = $3, net_salary = $4,
            status = 'Computed', has_warning = $5, warning_message = $6
          WHERE id = $7
        `, [
          periodDays, gross_salary, total_deductions, net_salary,
          missingBankDetails,
          missingBankDetails ? 'Missing bank details' : null,
          payslip.id
        ]);

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        await pool.query(
          'UPDATE payslips SET has_warning = true, warning_message = $1 WHERE id = $2',
          [err.message, payslip.id]
        );
      } finally {
        client.release();
      }
    }

    await pool.query('UPDATE payruns SET status = $1 WHERE id = $2', ['Computed', id]);
    res.json({ message: 'Payrun computed', payrun_id: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Validate: check for warnings (duplicate payslips per employee, missing contracts) before allowing Mark Paid
const validatePayrun = async (req, res) => {
  const { id } = req.params;
  try {
    const duplicates = await pool.query(`
      SELECT employee_id, COUNT(*) FROM payslips WHERE payrun_id = $1
      GROUP BY employee_id HAVING COUNT(*) > 1
    `, [id]);

    const warnings = await pool.query(
      'SELECT * FROM payslips WHERE payrun_id = $1 AND has_warning = true',
      [id]
    );

    if (duplicates.rows.length > 0 || warnings.rows.length > 0) {
      return res.status(409).json({
        message: 'Payrun has unresolved warnings',
        duplicate_employees: duplicates.rows,
        payslips_with_warnings: warnings.rows,
      });
    }

    await pool.query('UPDATE payruns SET status = $1 WHERE id = $2', ['Validated', id]);
    await pool.query(`UPDATE payslips SET status = 'Validated' WHERE payrun_id = $1`, [id]);

    res.json({ message: 'Payrun validated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark Paid: final state, historical record
const markPayrunPaid = async (req, res) => {
  const { id } = req.params;
  try {
    const payrun = await pool.query('SELECT * FROM payruns WHERE id = $1', [id]);
    if (payrun.rows.length === 0) return res.status(404).json({ message: 'Payrun not found' });
    if (payrun.rows[0].status !== 'Validated') {
      return res.status(409).json({ message: 'Payrun must be Validated before it can be marked Paid' });
    }

    await pool.query('UPDATE payruns SET status = $1 WHERE id = $2', ['Paid', id]);
    await pool.query(`UPDATE payslips SET status = 'Paid' WHERE payrun_id = $1`, [id]);

    res.json({ message: 'Payrun marked as Paid' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const { generatePayslipPDF } = require('../utils/pdfGenerator');
const { sendPayslipEmail } = require('../utils/mailer');
const fs = require('fs');

const sendAllPayslips = async (req, res) => {
  const { id } = req.params;
  try {
    const payslips = await pool.query(`
      SELECT ps.*, e.name AS employee_name, e.email AS employee_email,
             p.name AS payrun_name, p.period_start, p.period_end
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN payruns p ON ps.payrun_id = p.id
      WHERE ps.payrun_id = $1
    `, [id]);

    const results = [];
    for (const payslip of payslips.rows) {
      try {
        const linesResult = await pool.query(
          'SELECT * FROM payslip_lines WHERE payslip_id = $1 ORDER BY sequence ASC',
          [payslip.id]
        );
        const data = { ...payslip, lines: linesResult.rows.map(l => ({ ...l, amount: parseFloat(l.amount) })) };

        const filePath = await generatePayslipPDF(data);
        await sendPayslipEmail(data.employee_email, data.employee_name, data.payrun_name, filePath);
        fs.unlink(filePath, () => {});

        results.push({ employee: data.employee_name, status: 'sent' });
      } catch (err) {
        results.push({ employee: payslip.employee_name, status: 'failed', error: err.message });
      }
    }

    res.json({ message: 'Bulk payslip send complete', results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPayruns, getPayrunById, getEligibleEmployees, createPayrun,
  computePayrun, validatePayrun, markPayrunPaid, sendAllPayslips,
};