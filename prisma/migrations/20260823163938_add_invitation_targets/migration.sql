-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_family_fk";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_invited_by_fk";

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "invited_user_id" UUID,
ADD COLUMN     "invited_username" VARCHAR(50),
ADD COLUMN     "rejected_at" TIMESTAMPTZ(6),
ALTER COLUMN "invited_email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "invitations_invited_username_idx" ON "invitations"("invited_username");

-- CreateIndex
CREATE INDEX "invitations_invited_user_id_idx" ON "invitations"("invited_user_id");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
