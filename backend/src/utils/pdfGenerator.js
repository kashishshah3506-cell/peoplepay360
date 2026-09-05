const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePayslipPDF = (payslipData) => {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.join(__dirname, '..', '..', 'generated_pdfs');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const fileName = `payslip_${payslipData.id}_${Date.now()}.pdf`;
      const filePath = path.join(dir, fileName);

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('PeoplePay360', { align: 'left' });
      doc.fontSize(14).text('Payslip', { align: 'left' });
      doc.moveDown();

      // Employee & period info
      doc.fontSize(10);
      doc.text(`Employee: ${payslipData.employee_name}`);
      doc.text(`Email: ${payslipData.employee_email}`);
      doc.text(`Pay Run: ${payslipData.payrun_name}`);
      doc.text(`Period: ${new Date(payslipData.period_start).toLocaleDateString()} - ${new Date(payslipData.period_end).toLocaleDateString()}`);
      doc.text(`Worked Days: ${payslipData.worked_days}`);
      doc.text(`Status: ${payslipData.status}`);
      doc.moveDown();

      // Table header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Component', 50, tableTop);
      doc.text('Category', 250, tableTop);
      doc.text('Amount', 450, tableTop, { align: 'right' });
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      // Table rows
      for (const line of payslipData.lines) {
        const rowY = doc.y;
        doc.text(line.name, 50, rowY);
        doc.text(line.category, 250, rowY);
        doc.text(line.amount.toFixed(2), 450, rowY, { align: 'right' });
        doc.moveDown(0.5);
      }

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Totals
      doc.font('Helvetica-Bold');
      doc.text(`Gross Salary: ${payslipData.gross_salary}`, { align: 'right' });
      doc.text(`Total Deductions: ${payslipData.total_deductions}`, { align: 'right' });
      doc.fontSize(12).text(`Net Salary: ${payslipData.net_salary}`, { align: 'right' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePayslipPDF };