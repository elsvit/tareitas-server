import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { Pool } from 'pg';

dotenv.config();

const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<{ current_database: string }>(
      'SELECT current_database()'
    );

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
