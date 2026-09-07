import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { getObjectStorageEnv } from '../../src/config/object-storage.config';
import { PrismaClient } from '../../src/generated/prisma/client';

export function requireConfirmFlag(
  argv: string[],
  usage: string,
): void {
  if (argv.includes('--confirm')) {
    return;
  }

  console.error(usage);
  process.exit(1);
}

export function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

export function createS3Client() {
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

export async function wipeBucketObjects(
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

export async function wipeLocalUploads(): Promise<void> {
  await rm(join(process.cwd(), 'uploads'), {
    recursive: true,
    force: true,
  });
}

export async function wipeObjectStorageAndDisk(): Promise<{
  bucketDeleted: number | null;
}> {
  const s3 = createS3Client();
  let bucketDeleted: number | null = null;

  if (s3) {
    console.log(
      `Deleting objects from bucket "${s3.bucket}"…`,
    );
    bucketDeleted = await wipeBucketObjects(
      s3.client,
      s3.bucket,
    );
    console.log(
      `Bucket: deleted ${bucketDeleted} object(s)`,
    );
  } else {
    console.warn(
      'S3 not configured — skipped bucket cleanup (set S3_* in .env to wipe bucket)',
    );
  }

  console.log('Removing local uploads/ directory…');
  await wipeLocalUploads();
  console.log('Local uploads/: removed');

  return { bucketDeleted };
}
