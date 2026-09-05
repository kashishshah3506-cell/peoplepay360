const pool = require('../config/db');

const getRules = async (req, res) => {
  const { structure_id } = req.query;
  try {
    let query = 'SELECT * FROM salary_rules';
    const params = [];
    if (structure_id) {
      query += ' WHERE structure_id = $1';
      params.push(structure_id);
    }
    query += ' ORDER BY sequence ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRuleById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM salary_rules WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Salary rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const validateRuleBody = (body) => {
  const { name, code, category, computation_method } = body;
  if (!name || !code || !category || !computation_method) {
    return 'name, code, category, and computation_method are required';
  }
  if (!['Basic', 'Allowance', 'Deduction', 'Gross', 'Net'].includes(category)) {
    return 'Invalid category';
  }
  if (!['Fixed', 'Percentage', 'Formula'].includes(computation_method)) {
    return 'Invalid computation_method';
  }
  if (computation_method === 'Fixed' && (body.amount === undefined || body.amount === null)) {
    return 'amount is required for Fixed computation method';
  }
  if (computation_method === 'Percentage' && (body.percentage === undefined || !body.percentage_base_code)) {
    return 'percentage and percentage_base_code are required for Percentage computation method';
  }
  if (computation_method === 'Formula' && !body.formula) {
    return 'formula is required for Formula computation method';
  }
  return null;
};

const createRule = async (req, res) => {
  const { structure_id, name, code, category, sequence, computation_method, amount, percentage, percentage_base_code, formula } = req.body;

  if (!structure_id) return res.status(400).json({ message: 'structure_id is required' });

  const validationError = validateRuleBody(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const result = await pool.query(`
      INSERT INTO salary_rules
        (structure_id, name, code, category, sequence, computation_method, amount, percentage, percentage_base_code, formula)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      structure_id, name, code, category, sequence || 10, computation_method,
      amount ?? null, percentage ?? null, percentage_base_code || null, formula || null
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRule = async (req, res) => {
  const { id } = req.params;
  const { name, code, category, sequence, computation_method, amount, percentage, percentage_base_code, formula } = req.body;

  const validationError = validateRuleBody(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const result = await pool.query(`
      UPDATE salary_rules SET
        name = $1, code = $2, category = $3, sequence = $4, computation_method = $5,
        amount = $6, percentage = $7, percentage_base_code = $8, formula = $9
      WHERE id = $10
      RETURNING *
    `, [
      name, code, category, sequence || 10, computation_method,
      amount ?? null, percentage ?? null, percentage_base_code || null, formula || null, id
    ]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Salary rule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRule = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM salary_rules WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Salary rule not found' });
    res.json({ message: 'Salary rule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRules, getRuleById, createRule, updateRule, deleteRule };