const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

// Import your working default auth middleware
const authMiddleware = require('../middleware/authMiddleware');

// Updated routes to use your actual 'authMiddleware' function
router.get('/', authMiddleware, getDepartments);
router.post('/', authMiddleware, createDepartment);
router.put('/:id', authMiddleware, updateDepartment);
router.delete('/:id', authMiddleware, deleteDepartment);

// CRITICAL: Only export the router instance! Remove the object export block.
module.exports = router;
