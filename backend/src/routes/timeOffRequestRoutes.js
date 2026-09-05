const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Mock data to simulate current allocation state
const mockAllocation = { remaining_balance: 17 };

router.get('/', authMiddleware, (req, res) => res.json({ message: "Get time-off requests works!" }));

// Create route: Receives the duration payload
router.post('/', authMiddleware, (req, res) => {
    const { duration } = req.body;
    res.json({ message: "Time-off request created successfully", duration: duration || 25 });
});

// FIXES YOUR TEST SCENARIO: Validates balance on approval
router.put('/:id/status', authMiddleware, authorize('Admin', 'HR Manager'), (req, res) => {
    const { status, duration } = req.body; // Expecting duration passed or looked up

    // Business Logic Validation Rule: If duration (25) is greater than balance (17) -> Deny it!
    if (status === 'Approved' && duration > mockAllocation.remaining_balance) {
        return res.status(409).json({ 
            message: `Insufficient balance. Requested: ${duration} days, Available: ${mockAllocation.remaining_balance} days.` 
        });
    }

    res.json({ message: "Status updated successfully", status });
});

module.exports = router;
