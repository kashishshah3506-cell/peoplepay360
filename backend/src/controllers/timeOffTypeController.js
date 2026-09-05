const pool = require('../config/db');

const getTimeOffTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM time_off_types ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTimeOffType = async (req, res) => {
  const { name, unit, requires_allocation, requires_approval, affects_payroll } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const result = await pool.query(`
      INSERT INTO time_off_types (name, unit, requires_allocation, requires_approval, affects_payroll)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [name, unit || 'Days', requires_allocation !== false, requires_approval !== false, affects_payroll !== false]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTimeOffType = async (req, res) => {
  const { id } = req.params;
  const { name, unit, requires_allocation, requires_approval, affects_payroll } = req.body;
  try {
    const result = await pool.query(`
      UPDATE time_off_types SET name=$1, unit=$2, requires_allocation=$3, requires_approval=$4, affects_payroll=$5
      WHERE id=$6 RETURNING *
    `, [name, unit, requires_allocation, requires_approval, affects_payroll, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Time off type not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTimeOffType = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM time_off_types WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Time off type not found' });
    res.json({ message: 'Time off type deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTimeOffTypes, createTimeOffType, updateTimeOffType, deleteTimeOffType };