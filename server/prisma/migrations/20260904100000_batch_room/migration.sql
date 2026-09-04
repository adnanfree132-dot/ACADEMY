-- Additive: persist classroom/room on batches (was submitted by UI, never stored)
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "room" TEXT;
