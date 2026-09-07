/**
 * When a child's reward period is approved, task audio records and custom
 * uploaded task photos (per-date assignment changes) older than this many
 * months are removed from storage and unlinked from tasks.
 *
 * Example: approve May (2026-05) → cutoff February (2026-02) → February
 * and earlier are cleaned for that child.
 */
export const APPROVED_PERIOD_MEDIA_RETENTION_MONTHS = 3;
