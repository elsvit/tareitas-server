import { v5 as uuidv5 } from 'uuid';

/**
 * Shared with RN app — deterministic UUID v5 for a task instance.
 * Same assignment + date always yields the same id on every device.
 */
export const TASK_ID_NAMESPACE =
  'f47ac10b-58cc-4372-a567-0e02b2c3d479';

export function createTaskId(
  assignmentId: string,
  date: string | Date,
): string {
  const dateKey =
    typeof date === 'string'
      ? date.slice(0, 10)
      : date.toISOString().slice(0, 10);

  return uuidv5(
    `${assignmentId}:${dateKey}`,
    TASK_ID_NAMESPACE,
  );
}
