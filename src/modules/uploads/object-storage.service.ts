import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_PRESIGN_EXPIRY_SECONDS = 900;

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string | null;
  private readonly presignExpirySeconds: number;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const endpoint =
      this.configService.get<string>('S3_ENDPOINT');
    const accessKey =
      this.configService.get<string>('S3_ACCESS_KEY') ??
      this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretKey =
      this.configService.get<string>('S3_SECRET_KEY') ??
      this.configService.get<string>('S3_SECRET_ACCESS_KEY');
    this.bucket =
      this.configService.get<string>('S3_BUCKET') ?? '';
    const region =
      this.configService.get<string>('S3_REGION') ??
      'eu-central';

    if (
      endpoint &&
      accessKey &&
      secretKey &&
      this.bucket
    ) {
      this.client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true,
      });
    } else {
      this.client = null;
    }

    const cdnBaseUrl =
      this.configService.get<string>(
        'MEDIA_CDN_BASE_URL',
      );

    this.cdnBaseUrl = cdnBaseUrl?.replace(/\/$/, '') ?? null;
    this.presignExpirySeconds = Number(
      this.configService.get<string>(
        'S3_PRESIGN_EXPIRY_SECONDS',
      ) || DEFAULT_PRESIGN_EXPIRY_SECONDS,
    );
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getPresignExpirySeconds(): number {
    return this.presignExpirySeconds;
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    contentLength: number,
  ): Promise<string> {
    this.assertEnabled();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    return getSignedUrl(this.client!, command, {
      expiresIn: this.presignExpirySeconds,
    });
  }

  async createPresignedReadUrl(
    key: string,
  ): Promise<string> {
    this.assertEnabled();

    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client!, command, {
      expiresIn: this.presignExpirySeconds,
    });
  }

  async objectExists(key: string): Promise<boolean> {
    this.assertEnabled();

    try {
      await this.client!.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return true;
    } catch {
      return false;
    }
  }

  async deleteObject(key: string): Promise<void> {
    this.assertEnabled();

    await this.client!.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private assertEnabled(): void {
    if (!this.client) {
      throw new Error('Object storage is not configured');
    }
  }
}
