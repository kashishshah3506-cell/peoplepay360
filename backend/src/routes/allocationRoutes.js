const express = require('express');
const router = express.Router();
const { getAllocations, createAllocation, updateAllocationStatus, deleteAllocation } = require('../controllers/allocationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getAllocations);
router.post('/', protect, authorize('Admin', 'HR Manager'), createAllocation);
router.put('/:id/status', protect, authorize('Admin', 'HR Manager'), updateAllocationStatus);
router.delete('/:id', protect, authorize('Admin', 'HR Manager'), deleteAllocation);

module.exports = router;