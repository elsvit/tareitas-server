import express, { Request, Response } from 'express';

import { env } from './config/env';
import { pool } from './db/pool';

const app = express();

app.use(express.json());

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

app.listen(env.port, () => {
  console.log(`Tareitas server running on http://localhost:${env.port}`);
});