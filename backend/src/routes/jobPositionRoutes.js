const express = require('express');
const router = express.Router();

// 1. Import your job position controller functions
const { getJobPositions, createJobPosition, updateJobPosition, deleteJobPosition } = require('../controllers/jobPositionController');

// 2. CORRECT FIXED IMPORT: Destructure both middleware functions inside curly braces
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// 3. Mount routes using the working variables
router.get('/', authMiddleware, getJobPositions);
router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), createJobPosition);
router.put('/:id', authMiddleware, authorize('Admin', 'HR Manager'), updateJobPosition);
router.delete('/:id', authMiddleware, authorize('Admin', 'HR Manager'), deleteJobPosition);

// 4. Export the router instance cleanly
module.exports = router;
