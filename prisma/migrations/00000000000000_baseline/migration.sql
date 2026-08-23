-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."child_profiles" (
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "birthday" DATE,
    "color" VARCHAR(50),
    "avatar" TEXT,
    "reward" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."families" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "family_role" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "invited_email" VARCHAR(255) NOT NULL,
    "invited_by_user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "family_role" VARCHAR(30),
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."parent_profiles" (
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(50),
    "avatar" TEXT,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50),
    "email" VARCHAR(255),
    "password_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_members_family_id_idx" ON "public"."family_members"("family_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "family_members_unique" ON "public"."family_members"("family_id" ASC, "user_id" ASC);

-- CreateIndex
CREATE INDEX "family_members_user_id_idx" ON "public"."family_members"("user_id" ASC);

-- CreateIndex
CREATE INDEX "invitations_family_id_idx" ON "public"."invitations"("family_id" ASC);

-- CreateIndex
CREATE INDEX "invitations_invited_email_idx" ON "public"."invitations"("invited_email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "public"."invitations"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_unique" ON "public"."users"("username" ASC);

-- AddForeignKey
ALTER TABLE "public"."child_profiles" ADD CONSTRAINT "child_profiles_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_family_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."family_members" ADD CONSTRAINT "family_members_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_family_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_invited_by_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."parent_profiles" ADD CONSTRAINT "parent_profiles_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

