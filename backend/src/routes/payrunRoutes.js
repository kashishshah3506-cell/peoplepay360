const express = require('express');
const router = express.Router();
const {
  getPayruns, getPayrunById, getEligibleEmployees, createPayrun,
  computePayrun, validatePayrun, markPayrunPaid, sendAllPayslips,
} = require('../controllers/payrunController');
const { protect, authorize } = require('../middleware/authMiddleware');

const payrollRoles = ['Admin', 'HR Payroll User', 'HR Payroll Manager'];

router.get('/', protect, authorize(...payrollRoles), getPayruns);
router.get('/eligible-employees', protect, authorize(...payrollRoles), getEligibleEmployees);
router.get('/:id', protect, authorize(...payrollRoles), getPayrunById);
router.post('/', protect, authorize(...payrollRoles), createPayrun);
router.post('/:id/compute', protect, authorize(...payrollRoles), computePayrun);
router.post('/:id/validate', protect, authorize(...payrollRoles), validatePayrun);
router.post('/:id/mark-paid', protect, authorize(...payrollRoles), markPayrunPaid);
router.post('/:id/send-payslips', protect, authorize(...payrollRoles), sendAllPayslips);

module.exports = router;