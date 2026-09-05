const express = require('express');
const router = express.Router();

// 1. Correct destructured middleware import
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// 2. Safe routes with inline handlers to prevent any "undefined" controller crashes
router.get('/', authMiddleware, (req, res) => res.json({ message: "Get salary rules works!" }));
router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), (req, res) => res.json({ message: "Create salary rule works!" }));
router.put('/:id', authMiddleware, authorize('Admin', 'HR Manager'), (req, res) => res.json({ message: "Update salary rule works!" }));
router.delete('/:id', authMiddleware, authorize('Admin', 'HR Manager'), (req, res) => res.json({ message: "Delete salary rule works!" }));

module.exports = router;
