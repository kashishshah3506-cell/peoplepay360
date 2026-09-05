const pool = require('../config/db');

const getAllocations = async (req, res) => {
  const { employee_id } = req.query;
  try {
    let query = `
      SELECT a.*, e.name AS employee_name, t.name AS time_off_type_name, t.unit,
             (a.allocated_amount - a.taken_amount) AS remaining
      FROM time_off_allocations a
      JOIN employees e ON a.employee_id = e.id
      JOIN time_off_types t ON a.time_off_type_id = t.id
    `;
    const params = [];
    if (employee_id) {
      query += ' WHERE a.employee_id = $1';
      params.push(employee_id);
    }
    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createAllocation = async (req, res) => {
  const { employee_id, time_off_type_id, allocated_amount, valid_from, valid_to, status } = req.body;
  if (!employee_id || !time_off_type_id || !allocated_amount) {
    return res.status(400).json({ message: 'employee_id, time_off_type_id, and allocated_amount are required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated_amount, valid_from, valid_to, status)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [employee_id, time_off_type_id, allocated_amount, valid_from || null, valid_to || null, status || 'Pending']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve/refuse an allocation (only Approved allocations count toward balance)
const updateAllocationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['Approved', 'Refused', 'Pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const result = await pool.query(
      'UPDATE time_off_allocations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Allocation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAllocation = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM time_off_allocations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Allocation not found' });
    res.json({ message: 'Allocation deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllocations, createAllocation, updateAllocationStatus, deleteAllocation };