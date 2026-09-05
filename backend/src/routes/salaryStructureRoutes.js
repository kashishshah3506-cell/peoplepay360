const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Matches: GET http://localhost:5000/api/salary-structures
router.get('/', authMiddleware, (req, res) => {
    res.json({ message: "Get all salary structures route is live!" });
});

// Matches: POST http://localhost:5000/api/salary-structures
router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), (req, res) => {
    res.json({ message: "Create salary structure route is live!", data: req.body });
});

// FIXES YOUR CURRENT REQUEST: GET http://localhost:5000/api/salary-structures/1
router.get('/:id', authMiddleware, (req, res) => {
    res.json({ 
        message: "Get single salary structure route is live!", 
        idReceived: req.params.id 
    });
});

module.exports = router;
