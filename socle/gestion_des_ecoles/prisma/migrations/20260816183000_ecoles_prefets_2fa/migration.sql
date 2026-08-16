-- Multi-écoles, préfets, type professeur, 2FA direction

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PREFET';

DO $$ BEGIN
  CREATE TYPE "TypeProfesseur" AS ENUM ('MATIERE', 'PRIMAIRE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FamilleCycle" AS ENUM ('PRIMAIRE', 'COLLEGE', 'SECONDAIRE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ecoles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ecoles_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ecoles" ("id", "nom", "ville", "actif", "createdAt", "updatedAt")
VALUES
  ('ecole-dakar', 'École Primaire Cheikh Anta Diop', 'Dakar', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ecole-thies', 'Groupe Scolaire NOVA Thiès', 'Thiès', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "cycles" ADD COLUMN IF NOT EXISTS "famille" "FamilleCycle" NOT NULL DEFAULT 'PRIMAIRE';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ecole_id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "type_professeur" "TypeProfesseur";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "famille_cycle" "FamilleCycle";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "users" SET "ecole_id" = 'ecole-dakar' WHERE "ecole_id" IS NULL AND "role" <> 'ADMIN';

CREATE INDEX IF NOT EXISTS "users_ecole_id_idx" ON "users"("ecole_id");

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "ecole_id" TEXT;
UPDATE "classes" SET "ecole_id" = 'ecole-dakar' WHERE "ecole_id" IS NULL;
ALTER TABLE "classes" ALTER COLUMN "ecole_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "classes_ecole_id_idx" ON "classes"("ecole_id");

DO $$ BEGIN
  ALTER TABLE "classes" ADD CONSTRAINT "classes_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "eleves" ADD COLUMN IF NOT EXISTS "ecole_id" TEXT;
UPDATE "eleves" SET "ecole_id" = 'ecole-dakar' WHERE "ecole_id" IS NULL;
ALTER TABLE "eleves" ALTER COLUMN "ecole_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "eleves_ecole_id_idx" ON "eleves"("ecole_id");

DO $$ BEGIN
  ALTER TABLE "eleves" ADD CONSTRAINT "eleves_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "two_factor_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "two_factor_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "two_factor_challenges_user_id_idx" ON "two_factor_challenges"("user_id");

DO $$ BEGIN
  ALTER TABLE "two_factor_challenges" ADD CONSTRAINT "two_factor_challenges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
