#!/usr/bin/env tsx
/**
 * Empties all application data from PostgreSQL.
 * Tables and migrations stay — only rows are removed.
 *
 * Usage:
 *   npm run wipe-db-data -- --confirm
 */

import 'dotenv/config';

import { wipeAllDatabaseTables } from './lib/wipe-database';
import { createPrisma, requireConfirmFlag } from './lib/wipe-storage';

const USAGE = [
  'Refusing to run without --confirm.',
  '',
  'This deletes all rows from every public DB table',
  '(except _prisma_migrations). Table structure is kept.',
  '',
  'Does NOT touch S3 bucket or local uploads/.',
  '',
  'Run: npm run wipe-db-data -- --confirm',
].join('\n');

async function main() {
  requireConfirmFlag(process.argv.slice(2), USAGE);

  const prisma = createPrisma();
  await prisma.$connect();

  try {
    console.log('Truncating all application database tables…');
    const truncatedTables = await wipeAllDatabaseTables(prisma);
    console.log(
      `Done. Truncated ${truncatedTables.length} table(s):`,
    );
    console.log(truncatedTables.map(name => `  • ${name}`).join('\n'));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
