/**
 * Shared PostgreSQL truncate helper — keeps tables, removes all rows.
 */

import { createPrisma } from './wipe-storage';

export async function wipeAllDatabaseTables(
  prisma: ReturnType<typeof createPrisma>,
): Promise<string[]> {
  const tables = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename
  `;

  if (tables.length === 0) {
    return [];
  }

  const quoted = tables
    .map(({ tablename }) => `"${tablename}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`,
  );

  return tables.map(({ tablename }) => tablename);
}
