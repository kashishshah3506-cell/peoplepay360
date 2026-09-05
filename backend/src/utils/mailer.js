const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendPayslipEmail = async (toEmail, employeeName, payrunName, pdfFilePath) => {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `Your Payslip - ${payrunName}`,
    text: `Dear ${employeeName},\n\nPlease find attached your payslip for ${payrunName}.\n\nRegards,\nPeoplePay360 Payroll Team`,
    attachments: [
      {
        filename: 'payslip.pdf',
        path: pdfFilePath,
      },
    ],
  });

  return info;
};

module.exports = { sendPayslipEmail };