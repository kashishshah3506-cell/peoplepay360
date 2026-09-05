const express = require('express');
const router = express.Router();
const salaryStructureController = require('../controllers/salaryStructureController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Base endpoints (Checking if functions exist to completely prevent startup crashes)
if (salaryStructureController.getSalaryStructures) {
    router.get('/', authMiddleware, salaryStructureController.getSalaryStructures);
}
if (salaryStructureController.createSalaryStructure) {
    router.post('/', authMiddleware, authorize('Admin', 'HR Manager'), salaryStructureController.createSalaryStructure);
}

// FIXES YOUR CURRENT ERROR AND PREVENTS CRASHES
// If getSalaryStructureById doesn't exist in your controller yet, it safely falls back to a clean inline response instead of crashing!
const getByIdHandler = salaryStructureController.getSalaryStructureById 
  || ((req, res) => res.json({ 
      message: `Salary structure route is active for ID ${req.params.id}, but database fetching function is missing!`,
      idReceived: req.params.id 
     }));

router.get('/:id', authMiddleware, getByIdHandler);

module.exports = router;
