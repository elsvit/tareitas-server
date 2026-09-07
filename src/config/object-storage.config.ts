export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getObjectStorageEnv(): {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
} | null {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKey =
    process.env.S3_ACCESS_KEY?.trim() ??
    process.env.S3_ACCESS_KEY_ID?.trim();
  const secretKey =
    process.env.S3_SECRET_KEY?.trim() ??
    process.env.S3_SECRET_ACCESS_KEY?.trim();
  const region =
    process.env.S3_REGION?.trim() ?? 'eu-central';

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    return null;
  }

  return {
    endpoint,
    bucket,
    accessKey,
    secretKey,
    region,
  };
}

export function isObjectStorageConfigured(): boolean {
  return getObjectStorageEnv() !== null;
}

export function validateProductionObjectStorage(): void {
  if (!isProduction()) {
    return;
  }

  if (isObjectStorageConfigured()) {
    return;
  }

  console.error(
    [
      'FATAL: Production requires Hetzner object storage (S3).',
      'Set S3_ENDPOINT, S3_BUCKET, and access credentials in .env',
      'before starting the server.',
    ].join('\n'),
  );
  process.exit(1);
}
