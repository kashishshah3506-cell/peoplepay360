const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

// --- 1. ROUTE IMPORTS (All grouped here at the top) ---
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const jobPositionRoutes = require('./routes/jobPositionRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const contractRoutes = require('./routes/contractRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const timeOffTypeRoutes = require('./routes/timeOffTypeRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const timeOffRequestRoutes = require('./routes/timeOffRequestRoutes');
const app = express();
const salaryStructureRoutes = require('./routes/salaryStructureRoutes');
const salaryRuleRoutes = require('./routes/salaryRuleRoutes');

// --- 2. GLOBAL MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 3. HEALTH CHECK ENDPOINT ---
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// --- 4. MOUNT ROUTE ENDPOINTS ---
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/job-positions', jobPositionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/time-off-types', timeOffTypeRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/time-off-requests', timeOffRequestRoutes);
app.use('/api/salary-structures', salaryStructureRoutes);
app.use('/api/salary-rules', salaryRuleRoutes);

// --- 5. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running smoothly on port ${PORT}`));
