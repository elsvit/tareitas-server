require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database()');

    res.json({
      status: 'ok',
      database: result.rows[0].current_database,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Tareitas server running on http://localhost:${PORT}`);
});
