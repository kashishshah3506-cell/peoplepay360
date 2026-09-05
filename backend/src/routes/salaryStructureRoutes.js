const express = require('express');
const router = express.Router();
const {
  getStructures, getStructureById, createStructure, updateStructure, deleteStructure
} = require('../controllers/salaryStructureController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getStructures);
router.get('/:id', protect, getStructureById);
router.post('/', protect, authorize('Admin', 'HR Payroll Manager'), createStructure);
router.put('/:id', protect, authorize('Admin', 'HR Payroll Manager'), updateStructure);
router.delete('/:id', protect, authorize('Admin', 'HR Payroll Manager'), deleteStructure);

module.exports = router;