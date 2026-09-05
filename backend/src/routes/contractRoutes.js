const express = require('express');
const router = express.Router();

// 1. Import your contract controller functions
const { getContracts, createContract, updateContract, deleteContract } = require('../controllers/contractController');

// 2. THIS IS THE LINE TO CHANGE - Add curly braces around the middleware imports
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// 3. Apply the updated middleware variables to your routes
router.get('/', authMiddleware, getContracts);
router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), createContract);
router.put('/:id', authMiddleware, authorize('Admin', 'HR Manager'), updateContract);
router.delete('/:id', authMiddleware, authorize('Admin', 'HR Manager'), deleteContract);

// 4. Export the router cleanly
module.exports = router;
