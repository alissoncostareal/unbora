-- CreateEnum
CREATE TYPE "AppUserRole" AS ENUM ('user', 'merchant');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "AppUserRole" NOT NULL DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN "business_name" TEXT;

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Fortaleza',
    "region" TEXT NOT NULL DEFAULT 'Grande Fortaleza',
    "venue" TEXT NOT NULL DEFAULT '',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "merchant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_city_region_idx" ON "events"("city", "region");
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");
CREATE INDEX "events_merchant_id_idx" ON "events"("merchant_id");
CREATE INDEX "events_active_idx" ON "events"("active");
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
