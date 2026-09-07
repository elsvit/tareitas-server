#!/usr/bin/env tsx
/**
 * Wipes all family media from DB refs, family_images, S3 bucket, and local uploads/.
 *
 * Usage:
 *   npm run wipe-media -- --confirm
 *
 * Requires DATABASE_URL. S3 vars are optional but needed to empty the bucket.
 */

import 'dotenv/config';

import { isCustomUploadPath } from '../src/modules/uploads/media-path.utils';
import {
  createPrisma,
  requireConfirmFlag,
  wipeObjectStorageAndDisk,
} from './lib/wipe-storage';

const CUSTOM_PATH_SQL = `(
  avatar LIKE '/uploads/%'
  OR avatar LIKE 'photos/%'
  OR avatar LIKE 'voice/%'
)`;

const CUSTOM_PICTURE_SQL = `(
  picture LIKE '/uploads/%'
  OR picture LIKE 'photos/%'
  OR picture LIKE 'voice/%'
)`;

const USAGE = [
  'Refusing to run without --confirm.',
  '',
  'This deletes ALL family media:',
  '  • family_images rows',
  '  • custom picture/avatar/audio refs in DB',
  '  • every object in the S3 bucket (when configured)',
  '  • local uploads/ directory',
  '',
  'Run: npm run wipe-media -- --confirm',
].join('\n');

async function clearAssignmentChangeMedia(
  prisma: ReturnType<typeof createPrisma>,
): Promise<number> {
  const assignments = await prisma.taskAssignment.findMany({
    select: { id: true, changes: true },
  });

  let updated = 0;

  for (const assignment of assignments) {
    if (
      !assignment.changes ||
      typeof assignment.changes !== 'object' ||
      Array.isArray(assignment.changes)
    ) {
      continue;
    }

    let modified = false;
    const nextChanges: Record<string, unknown> = {};

    for (const [date, change] of Object.entries(
      assignment.changes as Record<string, unknown>,
    )) {
      if (
        !change ||
        typeof change !== 'object' ||
        Array.isArray(change)
      ) {
        nextChanges[date] = change;
        continue;
      }

      const record = {
        ...(change as Record<string, unknown>),
      };

      if (
        typeof record.audioRecord === 'string' &&
        isCustomUploadPath(record.audioRecord)
      ) {
        delete record.audioRecord;
        modified = true;
      }

      if (
        typeof record.picture === 'string' &&
        isCustomUploadPath(record.picture)
      ) {
        delete record.picture;
        modified = true;
      }

      nextChanges[date] = record;
    }

    if (modified) {
      await prisma.taskAssignment.update({
        where: { id: assignment.id },
        data: { changes: nextChanges },
      });
      updated += 1;
    }
  }

  return updated;
}

async function wipeDatabaseMedia(
  prisma: ReturnType<typeof createPrisma>,
): Promise<{
  familyImages: number;
  parentAvatars: number;
  childAvatars: number;
  taskPictures: number;
  rewardPictures: number;
  taskBasePictures: number;
  rewardBasePictures: number;
  assignmentChanges: number;
}> {
  const [
    familyImages,
    parentAvatars,
    childAvatars,
    taskPictures,
    rewardPictures,
    taskBasePictures,
    rewardBasePictures,
  ] = await prisma.$transaction([
    prisma.familyImage.deleteMany(),
    prisma.$executeRawUnsafe(
      `UPDATE parent_profiles SET avatar = NULL WHERE ${CUSTOM_PATH_SQL}`,
    ),
    prisma.$executeRawUnsafe(
      `UPDATE child_profiles SET avatar = NULL WHERE ${CUSTOM_PATH_SQL}`,
    ),
    prisma.$executeRawUnsafe(
      `UPDATE task_assignments SET picture = NULL WHERE ${CUSTOM_PICTURE_SQL}`,
    ),
    prisma.$executeRawUnsafe(
      `UPDATE rewards SET picture = NULL WHERE ${CUSTOM_PICTURE_SQL}`,
    ),
    prisma.$executeRawUnsafe(
      `UPDATE task_base_items SET picture = NULL WHERE ${CUSTOM_PICTURE_SQL}`,
    ),
    prisma.$executeRawUnsafe(
      `UPDATE reward_base_items SET picture = NULL WHERE ${CUSTOM_PICTURE_SQL}`,
    ),
  ]);

  const assignmentChanges =
    await clearAssignmentChangeMedia(prisma);

  return {
    familyImages: familyImages.count,
    parentAvatars,
    childAvatars,
    taskPictures,
    rewardPictures,
    taskBasePictures,
    rewardBasePictures,
    assignmentChanges,
  };
}

async function main() {
  requireConfirmFlag(process.argv.slice(2), USAGE);

  const prisma = createPrisma();
  await prisma.$connect();

  try {
    console.log('Clearing media references in the database…');
    const dbStats = await wipeDatabaseMedia(prisma);
    console.log('Database:', dbStats);

    await wipeObjectStorageAndDisk();

    console.log('Done. Media wipe complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
