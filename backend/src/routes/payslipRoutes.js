const express = require('express');
const router = express.Router();
const { getPayslips, getPayslipById, printPayslip, emailPayslip } = require('../controllers/payslipController');
const { protect, authorize } = require('../middleware/authMiddleware');

const payrollRoles = ['Admin', 'HR Payroll User', 'HR Payroll Manager'];

router.get('/', protect, authorize(...payrollRoles), getPayslips);
router.get('/:id', protect, authorize(...payrollRoles), getPayslipById);
router.get('/:id/print', protect, authorize(...payrollRoles), printPayslip);
router.post('/:id/email', protect, authorize(...payrollRoles), emailPayslip);

module.exports = router;