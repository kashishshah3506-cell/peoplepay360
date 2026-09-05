const express = require('express');
const router = express.Router();

// 1. Import your employee controller functions
const { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');

// 2. Destructure the authMiddleware cleanly from the object
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// 3. Define the routes using the working authMiddleware function
router.get('/', authMiddleware, getEmployees);
router.get('/:id', authMiddleware, getEmployeeById);
router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), createEmployee);
router.put('/:id', authMiddleware, authorize('Admin', 'HR Manager'), updateEmployee);
router.delete('/:id', authMiddleware, authorize('Admin', 'HR Manager'), deleteEmployee);

module.exports = router;
