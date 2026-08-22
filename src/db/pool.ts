import { Pool } from 'pg';

import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

// export const pool = new Pool({
//   host: process.env.DATABASE_HOST,
//   port: Number(process.env.DATABASE_PORT),
//   database: process.env.DATABASE_NAME,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
// });
