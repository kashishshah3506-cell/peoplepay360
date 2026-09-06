const express = require('express');
const router = express.Router();
const { getRules, getRuleById, createRule, updateRule, deleteRule } = require('../controllers/salaryRuleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Per spec: HR Payroll User has read-only access; only Admin / HR Payroll Manager can write.
const WRITE_ROLES = ['Admin', 'HR Payroll Manager'];

router.get('/', protect, getRules);           // supports ?structure_id= filter
router.get('/:id', protect, getRuleById);
router.post('/', protect, authorize(...WRITE_ROLES), createRule);
router.put('/:id', protect, authorize(...WRITE_ROLES), updateRule);
router.delete('/:id', protect, authorize(...WRITE_ROLES), deleteRule);

module.exports = router;