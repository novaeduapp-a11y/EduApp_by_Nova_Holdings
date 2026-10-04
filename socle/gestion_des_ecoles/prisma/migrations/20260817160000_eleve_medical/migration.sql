-- AlterTable
ALTER TABLE "eleves" ADD COLUMN IF NOT EXISTS "groupe_sanguin" TEXT;
ALTER TABLE "eleves" ADD COLUMN IF NOT EXISTS "allergies" TEXT;
