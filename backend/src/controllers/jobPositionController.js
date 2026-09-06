const pool = require('../config/db');

const getJobPositions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT jp.*, d.name AS department_name
      FROM job_positions jp
      LEFT JOIN departments d ON jp.department_id = d.id
      ORDER BY jp.title
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createJobPosition = async (req, res) => {
  // Debug checking when : Log incoming data to backend terminal 
  console.log("Incoming Payload:", req.body);

  if (!req.body) {
    return res.status(400).json({ message: "No request body provided" });
  }

  // Convert single object to array so the same logic handles both options smoothly
  const items = Array.isArray(req.body) ? req.body : [req.body];

  // Validate that every single item has a title before proceeding
  for (const item of items) {
    if (!item.title) {
      return res.status(400).json({ message: 'Title is required' });
    }
  }

  try {
    const insertedPositions = [];

    // Loop through the entries and insert them safely into PostgreSQL
    for (const item of items) {
      const { title, department_id } = item;
      const result = await pool.query(
        'INSERT INTO job_positions (title, department_id) VALUES ($1, $2) RETURNING *',
        [title, department_id || null]
      );
      insertedPositions.push(result.rows[0]);
    }

    // Return an array if multiple were sent, otherwise return just the single object
    res.status(201).json(Array.isArray(req.body) ? insertedPositions : insertedPositions[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateJobPosition = async (req, res) => {
  const { id } = req.params;
  const { title, department_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE job_positions SET title = $1, department_id = $2 WHERE id = $3 RETURNING *',
      [title, department_id || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Job position not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteJobPosition = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM job_positions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Job position not found' });
    res.json({ message: 'Job position deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getJobPositions, createJobPosition, updateJobPosition, deleteJobPosition };
