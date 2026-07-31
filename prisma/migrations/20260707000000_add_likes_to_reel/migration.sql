-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "EmbedType" AS ENUM ('INSTAGRAM', 'TIKTOK', 'YOUTUBE_SHORTS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReelCategory" AS ENUM ('TIPS', 'FRAUDES', 'PROCESO', 'TESTIMONIOS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Reel" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300),
    "embedUrl" VARCHAR(500),
    "embedType" "EmbedType" NOT NULL DEFAULT 'INSTAGRAM',
    "videoUrl" VARCHAR(500),
    "thumbnailUrl" VARCHAR(500) NOT NULL,
    "category" "ReelCategory" NOT NULL DEFAULT 'TIPS',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Reel_isActive_sortOrder_idx" ON "Reel"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "Reel_category_idx" ON "Reel"("category");
