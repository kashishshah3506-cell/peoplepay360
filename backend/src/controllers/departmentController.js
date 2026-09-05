const pool = require('../config/db');

const getDepartments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createDepartment = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Department already exists' });
    res.status(500).json({ message: err.message });
  }
};

const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE departments SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Department not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };