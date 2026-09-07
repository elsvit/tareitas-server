#!/usr/bin/env tsx
/**
 * Wipes ALL application data from PostgreSQL, S3 bucket, and local uploads/.
 * Keeps _prisma_migrations so schema/history remain intact.
 *
 * Usage:
 *   npm run wipe-all-data -- --confirm
 */

import 'dotenv/config';

import { wipeAllDatabaseTables } from './lib/wipe-database';
import {
  createPrisma,
  requireConfirmFlag,
  wipeObjectStorageAndDisk,
} from './lib/wipe-storage';

const USAGE = [
  'Refusing to run without --confirm.',
  '',
  'This deletes EVERYTHING:',
  '  • all rows in every public DB table (except _prisma_migrations)',
  '  • every object in the S3 bucket (when configured)',
  '  • local uploads/ directory',
  '',
  'Table structure is kept. For DB-only reset use wipe-db-data.',
  '',
  'Run: npm run wipe-all-data -- --confirm',
].join('\n');

async function main() {
  requireConfirmFlag(process.argv.slice(2), USAGE);

  const prisma = createPrisma();
  await prisma.$connect();

  try {
    console.log('Truncating all application database tables…');
    const truncatedTables = await wipeAllDatabaseTables(prisma);
    console.log(
      `Database: truncated ${truncatedTables.length} table(s)`,
    );
    console.log(truncatedTables.map(name => `  • ${name}`).join('\n'));

    await wipeObjectStorageAndDisk();

    console.log('Done. Full data wipe complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
