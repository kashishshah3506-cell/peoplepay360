const pool = require('../config/db');

const getAttendance = async (req, res) => {
  const { employee_id } = req.query;
  try {
    let query = `
      SELECT a.*, e.name AS employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
    `;
    const params = [];
    if (employee_id) {
      query += ' WHERE a.employee_id = $1';
      params.push(employee_id);
    }
    query += ' ORDER BY a.check_in DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAttendanceById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.*, e.name AS employee_name
      FROM attendance a JOIN employees e ON a.employee_id = e.id
      WHERE a.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Attendance record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check-in: creates a new attendance record with no check_out yet
const checkIn = async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id) return res.status(400).json({ message: 'employee_id is required' });

  try {
    // Prevent double check-in without checkout
    const open = await pool.query(
      'SELECT id FROM attendance WHERE employee_id = $1 AND check_out IS NULL',
      [employee_id]
    );
    if (open.rows.length > 0) {
      return res.status(409).json({ message: 'Employee already checked in, must check out first' });
    }

    const result = await pool.query(
      `INSERT INTO attendance (employee_id, check_in, status) VALUES ($1, NOW(), 'Present') RETURNING *`,
      [employee_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check-out: finds the open record, sets check_out and computes worked_hours
const checkOut = async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id) return res.status(400).json({ message: 'employee_id is required' });

  try {
    const open = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND check_out IS NULL ORDER BY check_in DESC LIMIT 1',
      [employee_id]
    );
    if (open.rows.length === 0) {
      return res.status(404).json({ message: 'No open check-in found for this employee' });
    }

    const record = open.rows[0];
    const result = await pool.query(`
      UPDATE attendance
      SET check_out = NOW(),
          worked_hours = ROUND(EXTRACT(EPOCH FROM (NOW() - check_in)) / 3600.0, 2),
          status = CASE
            WHEN EXTRACT(EPOCH FROM (NOW() - check_in)) / 3600.0 > 9 THEN 'Overtime'
            ELSE 'Present'
          END
      WHERE id = $1
      RETURNING *
    `, [record.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Manual correction — restricted to HR roles via route middleware
const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { check_in, check_out, status } = req.body;

  try {
    let worked_hours = null;
    if (check_in && check_out) {
      const inTime = new Date(check_in);
      const outTime = new Date(check_out);
      worked_hours = ((outTime - inTime) / (1000 * 60 * 60)).toFixed(2);
    }

    const result = await pool.query(`
      UPDATE attendance
      SET check_in = COALESCE($1, check_in),
          check_out = COALESCE($2, check_out),
          worked_hours = COALESCE($3, worked_hours),
          status = COALESCE($4, status),
          is_manual_edit = true
      WHERE id = $5
      RETURNING *
    `, [check_in || null, check_out || null, worked_hours, status || null, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Attendance record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAttendance = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM attendance WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Attendance record not found' });
    res.json({ message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAttendance, getAttendanceById, checkIn, checkOut, updateAttendance, deleteAttendance };