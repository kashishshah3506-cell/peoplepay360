const { Pool } = require('pg');
const path = require('path');

// Force dotenv to look directly in your backend root folder
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'peoplepay360',
  password: process.env.DB_PASSWORD || 'your_postgres_password_here', // <-- Change this to your real pgAdmin password
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

module.exports = pool;
    