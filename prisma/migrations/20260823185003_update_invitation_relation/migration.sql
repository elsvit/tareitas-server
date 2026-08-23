-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_invited_user_id_fkey";

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
