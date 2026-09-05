const express = require('express');
const router = express.Router();

// 1. Import your controller functions (Ensure these exist in your controller file!)
const { getJobPositions, createJobPosition, updateJobPosition, deleteJobPosition } = require('../controllers/jobPositionController');

// 2. Import your working default authentication middleware
const authMiddleware = require('../middleware/authMiddleware');

// 3. Define routes using the working authMiddleware function
router.get('/', authMiddleware, getJobPositions);
router.post('/', authMiddleware, createJobPosition);
router.put('/:id', authMiddleware, updateJobPosition);
router.delete('/:id', authMiddleware, deleteJobPosition);

// 4. CRITICAL: Only export the router instance!
module.exports = router;
