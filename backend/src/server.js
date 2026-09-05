const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const jobPositionRoutes = require('./routes/jobPositionRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const contractRoutes = require('./routes/contractRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/job-positions', jobPositionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));