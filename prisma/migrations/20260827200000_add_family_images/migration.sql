-- CreateTable
CREATE TABLE "family_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_images_family_path_unique" ON "family_images"("family_id", "path");

-- CreateIndex
CREATE INDEX "family_images_family_id_idx" ON "family_images"("family_id");

-- AddForeignKey
ALTER TABLE "family_images" ADD CONSTRAINT "family_images_family_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "family_images" ADD CONSTRAINT "family_images_uploaded_by_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
