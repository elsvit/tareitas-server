-- AlterTable
ALTER TABLE "public"."rewards"
ADD COLUMN "child_user_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
