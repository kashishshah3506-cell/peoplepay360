const express = require('express');
const router = express.Router();

// 1. Import your controller functions
const { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } = require('../controllers/employeeController');

// 2. Import your working default authentication middleware
const authMiddleware = require('../middleware/authMiddleware');

// 3. Define routes using the working authMiddleware function
router.get('/', authMiddleware, getEmployees);
router.get('/:id', authMiddleware, getEmployeeById);
router.post('/', authMiddleware, createEmployee);
router.put('/:id', authMiddleware, updateEmployee);
router.delete('/:id', authMiddleware, deleteEmployee);

// 4. Export the router instance cleanly
module.exports = router;
