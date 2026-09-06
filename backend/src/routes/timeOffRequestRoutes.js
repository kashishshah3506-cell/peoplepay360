const express = require('express');
const router = express.Router();
const {
  getRequests,
  createRequest,
  updateRequestStatus,
  deleteRequest,
} = require('../controllers/timeOffRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const HR_ROLES = ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'];

// Employees submit their own requests; listing supports ?employee_id= filter for HR views
router.get('/', protect, getRequests);
router.post('/', protect, createRequest);

// Approve/refuse is HR-tier only — this runs the real balance-deduction transaction
router.put('/:id/status', protect, authorize(...HR_ROLES), updateRequestStatus);

router.delete('/:id', protect, authorize(...HR_ROLES), deleteRequest);

module.exports = router;