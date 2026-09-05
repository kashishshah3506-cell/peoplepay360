const express = require('express');
const router = express.Router();

// Update this path to match your contract controller's actual file and functions
const { getContracts, createContract, updateContract, deleteContract } = require('../controllers/contractController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getContracts);
router.post('/', authMiddleware, createContract);
router.put('/:id', authMiddleware, updateContract);
router.delete('/:id', authMiddleware, deleteContract);

module.exports = router;
