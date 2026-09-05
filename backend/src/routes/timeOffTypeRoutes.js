const express = require('express');
const router = express.Router();

// 1. Import all functions from your controller cleanly
const { 
  getTimeOffTypes, 
  createTimeOffType, 
  updateTimeOffType, 
  deleteTimeOffType 
} = require('../controllers/timeOffTypeController');

// 2. Import your working authentication tools
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Matches: GET http://localhost:5000/api/time-off-types
router.get('/', authMiddleware, getTimeOffTypes);

// FIXES YOUR CURRENT REQUEST: POST http://localhost:5000/api/time-off-types
router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), createTimeOffType);

// Matches: PUT http://localhost:5000/api/time-off-types/1
router.put('/:id', authMiddleware, authorize('Admin', 'HR Manager'), updateTimeOffType);

// Matches: DELETE http://localhost:5000/api/time-off-types/1
router.delete('/:id', authMiddleware, authorize('Admin', 'HR Manager'), deleteTimeOffType);

module.exports = router;
