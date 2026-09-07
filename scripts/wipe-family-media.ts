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

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { getObjectStorageEnv } from '../src/config/object-storage.config';
import { PrismaClient } from '../src/generated/prisma/client';
import { isCustomUploadPath } from '../src/modules/uploads/media-path.utils';

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

function parseArgs(argv: string[]): { confirm: boolean } {
  return {
    confirm: argv.includes('--confirm'),
  };
}

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

function createS3Client() {
  const config = getObjectStorageEnv();

  if (!config) {
    return null;
  }

  return {
    client: new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    }),
    bucket: config.bucket,
  };
}

async function wipeBucketObjects(
  client: S3Client,
  bucket: string,
): Promise<number> {
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const listing = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }),
    );

    const keys =
      listing.Contents?.map(item => item.Key).filter(
        (key): key is string => Boolean(key),
      ) ?? [];

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map(Key => ({ Key })),
            Quiet: true,
          },
        }),
      );

      deleted += keys.length;
    }

    continuationToken = listing.IsTruncated
      ? listing.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return deleted;
}

async function clearAssignmentChangeMedia(
  prisma: PrismaClient,
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
  prisma: PrismaClient,
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

async function wipeLocalUploads(): Promise<void> {
  await rm(join(process.cwd(), 'uploads'), {
    recursive: true,
    force: true,
  });
}

async function main() {
  const { confirm } = parseArgs(process.argv.slice(2));

  if (!confirm) {
    console.error(
      [
        'Refusing to run without --confirm.',
        '',
        'This deletes ALL family media:',
        '  • family_images rows',
        '  • custom picture/avatar/audio refs in DB',
        '  • every object in the S3 bucket (when configured)',
        '  • local uploads/ directory',
        '',
        'Run: npm run wipe-media -- --confirm',
      ].join('\n'),
    );
    process.exit(1);
  }

  const prisma = createPrisma();
  await prisma.$connect();

  try {
    console.log('Clearing media references in the database…');
    const dbStats = await wipeDatabaseMedia(prisma);
    console.log('Database:', dbStats);

    const s3 = createS3Client();

    if (s3) {
      console.log(
        `Deleting objects from bucket "${s3.bucket}"…`,
      );
      const deletedObjects = await wipeBucketObjects(
        s3.client,
        s3.bucket,
      );
      console.log(`Bucket: deleted ${deletedObjects} object(s)`);
    } else {
      console.warn(
        'S3 not configured — skipped bucket cleanup (set S3_* in .env to wipe bucket)',
      );
    }

    console.log('Removing local uploads/ directory…');
    await wipeLocalUploads();
    console.log('Local uploads/: removed');

    console.log('Done. Media wipe complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
