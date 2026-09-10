-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "completed_audio_records" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "tasks" ADD COLUMN "completed_photos" JSONB NOT NULL DEFAULT '[]';
