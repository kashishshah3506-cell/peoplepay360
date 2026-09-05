const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

// Destructure both tools cleanly inside curly braces
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getDepartments);
router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), createDepartment);
router.put('/:id', authMiddleware, authorize('Admin', 'HR Manager'), updateDepartment);
router.delete('/:id', authMiddleware, authorize('Admin', 'HR Manager'), deleteDepartment);

module.exports = router;
