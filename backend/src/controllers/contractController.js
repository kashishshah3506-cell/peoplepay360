const pool = require('../config/db');

const getContracts = async (req, res) => {
  const { employee_id } = req.query;
  try {
    let query = `
      SELECT c.*, e.name AS employee_name, d.name AS department_name,
             jp.title AS job_position_title, ss.name AS salary_structure_name
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN job_positions jp ON c.job_position_id = jp.id
      LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
    `;
    const params = [];
    if (employee_id) {
      query += ' WHERE c.employee_id = $1';
      params.push(employee_id);
    }
    query += ' ORDER BY c.start_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getContractById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT c.*, e.name AS employee_name, d.name AS department_name,
             jp.title AS job_position_title, ss.name AS salary_structure_name
      FROM contracts c
      LEFT JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN job_positions jp ON c.job_position_id = jp.id
      LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
      WHERE c.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Contract not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: find contract active for a given employee + period (used later by Payroll)
const getActiveContractForPeriod = async (employeeId, periodStart, periodEnd) => {
  const result = await pool.query(`
    SELECT * FROM contracts
    WHERE employee_id = $1
      AND status = 'Running'
      AND start_date <= $3
      AND (end_date IS NULL OR end_date >= $2)
    ORDER BY start_date DESC
    LIMIT 1
  `, [employeeId, periodStart, periodEnd]);
  return result.rows[0] || null;
};

const createContract = async (req, res) => {
  const { employee_id, department_id, job_position_id, salary_structure_id, wage, start_date, end_date, status } = req.body;

  if (!employee_id || !wage || !start_date) {
    return res.status(400).json({ message: 'employee_id, wage, and start_date are required' });
  }

  try {
    // Check for overlapping running contracts for the same employee
    const overlap = await pool.query(`
      SELECT id FROM contracts
      WHERE employee_id = $1
        AND status = 'Running'
        AND start_date <= $3
        AND (end_date IS NULL OR end_date >= $2)
    `, [employee_id, start_date, end_date || '9999-12-31']);

    if (overlap.rows.length > 0) {
      return res.status(409).json({ message: 'An overlapping running contract already exists for this employee' });
    }

    const result = await pool.query(`
      INSERT INTO contracts (employee_id, department_id, job_position_id, salary_structure_id, wage, start_date, end_date, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [employee_id, department_id || null, job_position_id || null, salary_structure_id || null, wage, start_date, end_date || null, status || 'Running']);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateContract = async (req, res) => {
  const { id } = req.params;
  const { department_id, job_position_id, salary_structure_id, wage, start_date, end_date, status } = req.body;

  try {
    const result = await pool.query(`
      UPDATE contracts SET
        department_id = $1, job_position_id = $2, salary_structure_id = $3,
        wage = $4, start_date = $5, end_date = $6, status = $7
      WHERE id = $8
      RETURNING *
    `, [department_id || null, job_position_id || null, salary_structure_id || null, wage, start_date, end_date || null, status, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Contract not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteContract = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM contracts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Contract not found' });
    res.json({ message: 'Contract deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getContracts, getContractById, createContract, updateContract, deleteContract, getActiveContractForPeriod };