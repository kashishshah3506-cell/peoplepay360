const express = require('express');
const router = express.Router();
const { getPayslips, getPayslipById, printPayslip, emailPayslip } = require('../controllers/payslipController');
const { protect, authorize } = require('../middleware/authMiddleware');

const payrollRoles = ['Admin', 'admin', 'HR Payroll User', 'hr', 'HR Payroll Manager', 'payroll_manager'];

router.get('/', protect, authorize(...payrollRoles), getPayslips);
router.get('/:id', protect, authorize(...payrollRoles), getPayslipById);
router.get('/:id/print', protect, authorize(...payrollRoles), printPayslip);
router.post('/:id/email', protect, authorize(...payrollRoles), emailPayslip);

// 👇 ADD THIS ROUTE TO FIX THE "Cannot POST /api/payslips/1/send-payslips" ERROR
router.post('/:id/send-payslips', protect, authorize(...payrollRoles), emailPayslip);

module.exports = router;
