-- Samedi dans l'emploi du temps.
ALTER TYPE "JourSemaine" ADD VALUE IF NOT EXISTS 'SAMEDI';

-- Convocation : message distinct du motif + confirmation parent.
ALTER TYPE "ConvocationStatut" ADD VALUE IF NOT EXISTS 'CONFIRMEE';
ALTER TABLE "convocations" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "convocations" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3);
