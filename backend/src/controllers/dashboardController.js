const pool = require('../config/db');

// KPI Cards: Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, Attendance Health
const getKpis = async (req, res) => {
    const { period_start, period_end, department_id, employee_type } = req.query;  try {
    const params = [];
    let payslipFilter = '';
    if (period_start && period_end) {
      params.push(period_start, period_end);
      payslipFilter += ` AND p.period_start >= $${params.length - 1} AND p.period_end <= $${params.length}`;
    }
    if (department_id) {
      params.push(department_id);
      payslipFilter += ` AND c.department_id = $${params.length}`;
    }
    if (employee_type) {
      params.push(employee_type);
      payslipFilter += ` AND e.employee_type = $${params.length}`;
    }

    const salaryResult = await pool.query(`
      SELECT
        COALESCE(SUM(ps.net_salary), 0) AS total_net_paid,
        COUNT(ps.id) AS payslip_count,
        COALESCE(AVG(ps.net_salary), 0) AS avg_salary
      FROM payslips ps
      JOIN payruns p ON ps.payrun_id = p.id
      LEFT JOIN contracts c ON ps.contract_id = c.id
      LEFT JOIN employees e ON ps.employee_id = e.id
      WHERE ps.status IN ('Validated', 'Paid') ${payslipFilter}
    `, params);

    const timeOffResult = await pool.query(`
      SELECT COALESCE(SUM(duration), 0) AS approved_days
      FROM time_off_requests
      WHERE status = 'Approved'
      ${period_start && period_end ? `AND start_date >= $1 AND end_date <= $2` : ''}
    `, period_start && period_end ? [period_start, period_end] : []);

    const attendanceResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('Present','Overtime')) AS present_count,
        COUNT(*) AS total_count
      FROM attendance
      ${period_start && period_end ? `WHERE check_in::date >= $1 AND check_in::date <= $2` : ''}
    `, period_start && period_end ? [period_start, period_end] : []);

    const present = parseInt(attendanceResult.rows[0].present_count) || 0;
    const total = parseInt(attendanceResult.rows[0].total_count) || 0;
    const attendanceHealth = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

    res.json({
      total_net_salary_paid: parseFloat(salaryResult.rows[0].total_net_paid),
      payslips_generated: parseInt(salaryResult.rows[0].payslip_count),
      average_salary: parseFloat(salaryResult.rows[0].avg_salary).toFixed(2),
      approved_time_off_days: parseFloat(timeOffResult.rows[0].approved_days),
      attendance_health_percent: attendanceHealth,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Salary Cost by Department (bar chart data)
const getSalaryByDepartment = async (req, res) => {
  const { period_start, period_end, employee_type } = req.query;
  try {
    const params = [];
    let filter = '';
    if (period_start && period_end) {
      params.push(period_start, period_end);
      filter += ` AND p.period_start >= $${params.length - 1} AND p.period_end <= $${params.length}`;
    }
    if (employee_type) {
      params.push(employee_type);
      filter += ` AND e.employee_type = $${params.length}`;
    }

    const result = await pool.query(`
      SELECT d.name AS department, COALESCE(SUM(ps.net_salary), 0) AS total_salary
      FROM payslips ps
      JOIN payruns p ON ps.payrun_id = p.id
      LEFT JOIN contracts c ON ps.contract_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN employees e ON ps.employee_id = e.id
      WHERE ps.status IN ('Validated', 'Paid') ${filter}
      GROUP BY d.name
      ORDER BY total_salary DESC
    `, params);

    res.json(result.rows.map(r => ({ department: r.department || 'Unassigned', total_salary: parseFloat(r.total_salary) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Monthly Net Salary Trend (line chart data)
const getMonthlySalaryTrend = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(p.period_start, 'YYYY-MM') AS month, COALESCE(SUM(ps.net_salary), 0) AS total_salary
      FROM payslips ps
      JOIN payruns p ON ps.payrun_id = p.id
      WHERE ps.status IN ('Validated', 'Paid')
      GROUP BY month
      ORDER BY month ASC
    `);
    res.json(result.rows.map(r => ({ month: r.month, total_salary: parseFloat(r.total_salary) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Payslip Status & Payroll Alerts (donut + alert list)
const getPayrollAlerts = async (req, res) => {
  try {
    const statusCounts = await pool.query(`
      SELECT status, COUNT(*) AS count FROM payslips GROUP BY status
    `);

    const duplicates = await pool.query(`
      SELECT payrun_id, employee_id, COUNT(*) AS count
      FROM payslips GROUP BY payrun_id, employee_id HAVING COUNT(*) > 1
    `);

    const warnings = await pool.query(`
      SELECT ps.id, e.name AS employee_name, ps.warning_message
      FROM payslips ps JOIN employees e ON ps.employee_id = e.id
      WHERE ps.has_warning = true
    `);

    const missingContracts = await pool.query(`
      SELECT ps.id, e.name AS employee_name
      FROM payslips ps JOIN employees e ON ps.employee_id = e.id
      WHERE ps.contract_id IS NULL
    `);

    res.json({
      status_breakdown: statusCounts.rows,
      alerts: {
        duplicate_payslips: duplicates.rows.length,
        payslips_with_warnings: warnings.rows,
        missing_contracts: missingContracts.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Attendance Overview
const getAttendanceOverview = async (req, res) => {
  const { period_start, period_end } = req.query;
  try {
    const params = [];
    let filter = '';
    if (period_start && period_end) {
      params.push(period_start, period_end);
      filter = `WHERE check_in::date >= $1 AND check_in::date <= $2`;
    }

    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Present') AS present,
        COUNT(*) FILTER (WHERE status = 'Overtime') AS overtime,
        COUNT(*) FILTER (WHERE status = 'Late') AS late,
        COUNT(*) FILTER (WHERE status = 'Absent') AS absent,
        COUNT(*) FILTER (WHERE check_out IS NULL) AS missing_checkouts,
        COUNT(*) FILTER (WHERE is_manual_edit = true) AS manual_edits,
        COUNT(*) AS total
      FROM attendance
      ${filter}
    `, params);

    const row = result.rows[0];
    const total = parseInt(row.total) || 1;

    res.json({
      present: parseInt(row.present),
      overtime: parseInt(row.overtime),
      late: parseInt(row.late),
      absent: parseInt(row.absent),
      missing_checkouts: parseInt(row.missing_checkouts),
      manual_edits: parseInt(row.manual_edits),
      total_records: parseInt(row.total),
      coverage_percent: (((parseInt(row.present) + parseInt(row.overtime)) / total) * 100).toFixed(1),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Time Off Overview
const getTimeOffOverview = async (req, res) => {
  try {
    const requestStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'Refused') AS refused,
        COALESCE(SUM(duration) FILTER (WHERE status = 'Approved'), 0) AS total_approved_days
      FROM time_off_requests
    `);

    const balanceStats = await pool.query(`
      SELECT
        COALESCE(SUM(allocated_amount), 0) AS total_allocated,
        COALESCE(SUM(taken_amount), 0) AS total_taken,
        COALESCE(SUM(allocated_amount - taken_amount), 0) AS total_remaining
      FROM time_off_allocations
      WHERE status = 'Approved'
    `);

    res.json({
      requests: requestStats.rows[0],
      balances: balanceStats.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Department Overview (headcount + salary combined)
const getDepartmentOverview = async (req, res) => {
  const { employee_type } = req.query;
  try {
    const params = [];
    let filter = '';
    if (employee_type) {
      params.push(employee_type);
      filter = `WHERE e.employee_type = $${params.length}`;
    }

    const result = await pool.query(`
      SELECT
        d.name AS department,
        COUNT(DISTINCT e.id) AS headcount,
        COALESCE(SUM(ps.net_salary) FILTER (WHERE ps.status IN ('Validated','Paid')), 0) AS total_salary_expenditure
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      LEFT JOIN contracts c ON c.employee_id = e.id AND c.status = 'Running'
      LEFT JOIN payslips ps ON ps.contract_id = c.id
      ${filter}
      GROUP BY d.name
      ORDER BY d.name
    `, params);

    res.json(result.rows.map(r => ({
      department: r.department,
      headcount: parseInt(r.headcount),
      total_salary_expenditure: parseFloat(r.total_salary_expenditure),
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Full dashboard summary in one call (combines everything above, useful for initial page load)
const getDashboardSummary = async (req, res) => {
  try {
    const [kpis, salaryByDept, trend, alerts, attendance, timeOff, deptOverview] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(net_salary),0) AS total_net_paid, COUNT(*) AS payslip_count, COALESCE(AVG(net_salary),0) AS avg_salary
        FROM payslips WHERE status IN ('Validated','Paid')
      `),
      pool.query(`
        SELECT d.name AS department, COALESCE(SUM(ps.net_salary),0) AS total_salary
        FROM payslips ps
        LEFT JOIN contracts c ON ps.contract_id = c.id
        LEFT JOIN departments d ON c.department_id = d.id
        WHERE ps.status IN ('Validated','Paid')
        GROUP BY d.name ORDER BY total_salary DESC
      `),
      pool.query(`
        SELECT TO_CHAR(p.period_start,'YYYY-MM') AS month, COALESCE(SUM(ps.net_salary),0) AS total_salary
        FROM payslips ps JOIN payruns p ON ps.payrun_id = p.id
        WHERE ps.status IN ('Validated','Paid') GROUP BY month ORDER BY month
      `),
      pool.query(`SELECT status, COUNT(*) AS count FROM payslips GROUP BY status`),
      pool.query(`
        SELECT COUNT(*) FILTER (WHERE status IN ('Present','Overtime')) AS present_count, COUNT(*) AS total_count
        FROM attendance
      `),
      pool.query(`
        SELECT COUNT(*) FILTER (WHERE status='Approved') AS approved, COUNT(*) FILTER (WHERE status='Pending') AS pending
        FROM time_off_requests
      `),
      pool.query(`
        SELECT d.name AS department, COUNT(DISTINCT e.id) AS headcount
        FROM departments d LEFT JOIN employees e ON e.department_id = d.id
        GROUP BY d.name ORDER BY d.name
      `),
    ]);

    const present = parseInt(attendance.rows[0].present_count) || 0;
    const total = parseInt(attendance.rows[0].total_count) || 0;

    res.json({
      kpis: {
        total_net_salary_paid: parseFloat(kpis.rows[0].total_net_paid),
        payslips_generated: parseInt(kpis.rows[0].payslip_count),
        average_salary: parseFloat(kpis.rows[0].avg_salary).toFixed(2),
        attendance_health_percent: total > 0 ? ((present / total) * 100).toFixed(1) : '0.0',
      },
      salary_by_department: salaryByDept.rows.map(r => ({ department: r.department || 'Unassigned', total_salary: parseFloat(r.total_salary) })),
      monthly_trend: trend.rows.map(r => ({ month: r.month, total_salary: parseFloat(r.total_salary) })),
      payslip_status_breakdown: alerts.rows,
      time_off_summary: timeOff.rows[0],
      department_headcount: deptOverview.rows.map(r => ({ department: r.department, headcount: parseInt(r.headcount) })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getKpis, getSalaryByDepartment, getMonthlySalaryTrend, getPayrollAlerts,
  getAttendanceOverview, getTimeOffOverview, getDepartmentOverview, getDashboardSummary,
};