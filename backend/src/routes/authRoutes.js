const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Protected Route 
// If it crashes here, one of the two variables above is missing/misspelled!
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
