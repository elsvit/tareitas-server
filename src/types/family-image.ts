export type EFamilyImageKind = 'task' | 'reward' | 'user';

export interface IFamilyImage {
  id: string;
  familyId: string;
  path: string;
  kind: EFamilyImageKind;
  uploadedByUserId: string;
  createdAt: string;
}

export const FAMILY_IMAGE_KINDS: EFamilyImageKind[] = [
  'task',
  'reward',
  'user',
];

export function isFamilyImageKind(
  value: string,
): value is EFamilyImageKind {
  return FAMILY_IMAGE_KINDS.includes(
    value as EFamilyImageKind,
  );
}
