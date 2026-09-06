const pool = require('../config/db');
const { generatePayslipPDF } = require('../utils/pdfGenerator');
const { sendPayslipEmail } = require('../utils/mailer');
const fs = require('fs');

const getPayslips = async (req, res) => {
  const { employee_id, payrun_id } = req.query;
  try {
    let query = `
      SELECT ps.*, e.name AS employee_name, p.name AS payrun_name, p.period_start, p.period_end
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN payruns p ON ps.payrun_id = p.id
    `;
    const conditions = [];
    const params = [];
    if (employee_id) { params.push(employee_id); conditions.push(`ps.employee_id = $${params.length}`); }
    if (payrun_id) { params.push(payrun_id); conditions.push(`ps.payrun_id = $${params.length}`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY ps.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFullPayslipData = async (id) => {
  const payslip = await pool.query(`
    SELECT ps.*, e.name AS employee_name, e.email AS employee_email,
           p.name AS payrun_name, p.period_start, p.period_end,
           c.wage AS contract_wage
    FROM payslips ps
    JOIN employees e ON ps.employee_id = e.id
    JOIN payruns p ON ps.payrun_id = p.id
    LEFT JOIN contracts c ON ps.contract_id = c.id
    WHERE ps.id = $1
  `, [id]);

  if (payslip.rows.length === 0) return null;

  const lines = await pool.query(
    'SELECT * FROM payslip_lines WHERE payslip_id = $1 ORDER BY sequence ASC',
    [id]
  );

  return {
    ...payslip.rows[0],
    lines: lines.rows.map(l => ({ ...l, amount: parseFloat(l.amount) })),
  };
};

const getPayslipById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getFullPayslipData(id);
    if (!data) return res.status(404).json({ message: 'Payslip not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const printPayslip = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getFullPayslipData(id);
    if (!data) return res.status(404).json({ message: 'Payslip not found' });

    const filePath = await generatePayslipPDF(data);
    res.download(filePath, `payslip_${data.employee_name.replace(/\s+/g, '_')}.pdf`, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const emailPayslip = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getFullPayslipData(id);
    if (!data) return res.status(404).json({ message: 'Payslip not found' });

    const filePath = await generatePayslipPDF(data);
    const info = await sendPayslipEmail(data.employee_email, data.employee_name, data.payrun_name, filePath);

    fs.unlink(filePath, () => {});

    res.json({ message: 'Payslip emailed successfully', previewUrl: require('nodemailer').getTestMessageUrl?.(info) || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPayslips, getPayslipById, printPayslip, emailPayslip };