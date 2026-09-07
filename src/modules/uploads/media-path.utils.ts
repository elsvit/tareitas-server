import { randomUUID } from 'node:crypto';

import { EFamilyImageKind } from '../../types/family-image';

export const OBJECT_STORAGE_PHOTOS_PREFIX = 'photos/';
export const OBJECT_STORAGE_VOICE_PREFIX = 'voice/';

const IMAGE_MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const AUDIO_MIME_EXTENSION: Record<string, string> = {
  'audio/m4a': '.m4a',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/x-m4a': '.m4a',
  'audio/3gpp': '.3gp',
  'audio/amr': '.amr',
  'audio/mpeg': '.mp3',
};

export function isLegacyUploadPath(
  path: string,
): boolean {
  return path.startsWith('/uploads/');
}

export function isObjectStoragePath(
  path: string,
): boolean {
  return (
    path.startsWith(OBJECT_STORAGE_PHOTOS_PREFIX) ||
    path.startsWith(OBJECT_STORAGE_VOICE_PREFIX)
  );
}

export function isCustomUploadPath(
  value?: string | null,
): value is string {
  if (!value) {
    return false;
  }

  return (
    isLegacyUploadPath(value) ||
    isObjectStoragePath(value)
  );
}

export function objectStoragePrefixForKind(
  kind: EFamilyImageKind,
): string {
  return kind === 'task_record'
    ? OBJECT_STORAGE_VOICE_PREFIX
    : OBJECT_STORAGE_PHOTOS_PREFIX;
}

export function extensionForContentType(
  contentType: string,
  kind: EFamilyImageKind,
): string | undefined {
  if (kind === 'task_record') {
    return AUDIO_MIME_EXTENSION[contentType];
  }

  return IMAGE_MIME_EXTENSION[contentType];
}

export function buildObjectStorageKey(
  familyId: string,
  kind: EFamilyImageKind,
  extension: string,
): string {
  const prefix = objectStoragePrefixForKind(kind);

  return `${prefix}${familyId}/${randomUUID()}${extension}`;
}

export function assertObjectStoragePathForFamily(
  familyId: string,
  path: string,
  kind: EFamilyImageKind,
): void {
  const expectedPrefix = objectStoragePrefixForKind(kind);

  if (!path.startsWith(`${expectedPrefix}${familyId}/`)) {
    throw new Error(
      `Invalid object storage path for family ${familyId}`,
    );
  }
}

export function isFamilyMediaPath(
  familyId: string,
  path: string,
): boolean {
  return (
    path.startsWith(`/uploads/${familyId}/`) ||
    path.startsWith(`photos/${familyId}/`) ||
    path.startsWith(`voice/${familyId}/`)
  );
}
