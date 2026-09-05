const express = require('express');
const router = express.Router();

// 1. Import your controller functions (Ensure these are exported in your controller!)
const { getSchedules, getScheduleById, createSchedule } = require('../controllers/scheduleController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Matches: GET http://localhost:5000/api/schedules
router.get('/', authMiddleware, getSchedules);

// MATCHES YOUR CURRENT TEST: GET http://localhost:5000/api/schedules/1
router.get('/:id', authMiddleware, getScheduleById);

// Matches: POST http://localhost:5000/api/schedules
router.post('/', authMiddleware, createSchedule);

module.exports = router;
