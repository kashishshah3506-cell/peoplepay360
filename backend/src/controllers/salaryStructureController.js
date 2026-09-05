const pool = require('../config/db');

const getStructures = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ss.*,
        (SELECT COUNT(*) FROM salary_rules sr WHERE sr.structure_id = ss.id) AS rule_count,
        (SELECT COUNT(*) FROM contracts c WHERE c.salary_structure_id = ss.id AND c.status = 'Running') AS employee_count
      FROM salary_structures ss
      ORDER BY ss.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStructureById = async (req, res) => {
  const { id } = req.params;
  try {
    const structure = await pool.query('SELECT * FROM salary_structures WHERE id = $1', [id]);
    if (structure.rows.length === 0) {
      return res.status(404).json({ message: 'Salary structure not found' });
    }

    const rules = await pool.query(
      'SELECT * FROM salary_rules WHERE structure_id = $1 ORDER BY sequence ASC',
      [id]
    );

    res.json({ ...structure.rows[0], rules: rules.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createStructure = async (req, res) => {
  const { name, description, is_active } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO salary_structures (name, description, is_active) VALUES ($1,$2,$3) RETURNING *',
      [name, description || null, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateStructure = async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE salary_structures SET name = $1, description = $2, is_active = $3 WHERE id = $4 RETURNING *',
      [name, description, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Salary structure not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteStructure = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM salary_structures WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Salary structure not found' });
    res.json({ message: 'Salary structure deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStructures, getStructureById, createStructure, updateStructure, deleteStructure };