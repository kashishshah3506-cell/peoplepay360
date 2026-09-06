const pool = require('../config/db');

const getEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, d.name AS department_name, jp.title AS job_position_title,
             m.name AS manager_name, ws.name AS schedule_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      ORDER BY e.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await pool.query(`
      SELECT e.*, d.name AS department_name, jp.title AS job_position_title,
             m.name AS manager_name, ws.name AS schedule_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN job_positions jp ON e.job_position_id = jp.id
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN working_schedules ws ON e.working_schedule_id = ws.id
      WHERE e.id = $1
    `, [id]);

    if (employee.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });

    // Related record counts for smart buttons
    const [contracts, attendance, timeOff, allocations] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM contracts WHERE employee_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM attendance WHERE employee_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM time_off_requests WHERE employee_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM time_off_allocations WHERE employee_id = $1', [id]),
    ]);

    res.json({
      ...employee.rows[0],
      counts: {
        contracts: parseInt(contracts.rows[0].count),
        attendance: parseInt(attendance.rows[0].count),
        time_off_requests: parseInt(timeOff.rows[0].count),
        allocations: parseInt(allocations.rows[0].count),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createEmployee = async (req, res) => {
 const { name, email, phone, department_id, job_position_id, manager_id, working_schedule_id, employee_type, bank_account_number, bank_ifsc, bank_name, status, date_joined, user_id } = req.body;

  if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

  try {
    const result = await pool.query(`
      INSERT INTO employees (name, email, phone, department_id, job_position_id, manager_id, working_schedule_id, status, date_joined, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [name, email, phone || null, department_id || null, job_position_id || null, manager_id || null, working_schedule_id || null, status || 'Active', date_joined || new Date(), user_id || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, department_id, job_position_id, manager_id, working_schedule_id, status, date_joined } = req.body;

  try {
    const result = await pool.query(`
      UPDATE employees SET
        name = $1, email = $2, phone = $3, department_id = $4,
        job_position_id = $5, manager_id = $6, working_schedule_id = $7,
        status = $8, date_joined = $9
      WHERE id = $10
      RETURNING *
    `, [name, email, phone, department_id || null, job_position_id || null, manager_id || null, working_schedule_id || null, status, date_joined, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };