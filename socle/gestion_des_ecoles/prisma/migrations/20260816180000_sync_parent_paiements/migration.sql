-- Alignement schéma Prisma (PARENT/ELEVE, lien compte élève, parent_eleves, paiements)

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PARENT';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ELEVE';

ALTER TABLE "eleves" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "eleves_user_id_key" ON "eleves"("user_id");

DO $$ BEGIN
  ALTER TABLE "eleves" ADD CONSTRAINT "eleves_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "parent_eleves" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'parent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parent_eleves_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "parent_eleves_parent_id_eleve_id_key" ON "parent_eleves"("parent_id", "eleve_id");

DO $$ BEGIN
  ALTER TABLE "parent_eleves" ADD CONSTRAINT "parent_eleves_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "parent_eleves" ADD CONSTRAINT "parent_eleves_eleve_id_fkey"
    FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutPaiement" AS ENUM ('PAYE', 'PARTIEL', 'NON_PAYE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeFrais" AS ENUM ('INSCRIPTION', 'SCOLARITE', 'CANTINE', 'TRANSPORT', 'AUTRE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "paiements" (
    "id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "type_frais" "TypeFrais" NOT NULL,
    "montant_total" DECIMAL(10,2) NOT NULL,
    "montant_paye" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'NON_PAYE',
    "annee_scolaire" TEXT NOT NULL,
    "echeance" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "versements_paiements" (
    "id" TEXT NOT NULL,
    "paiement_id" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "date_paiement" TIMESTAMP(3) NOT NULL,
    "mode_paiement" TEXT NOT NULL,
    "reference" TEXT,
    "recu_par" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "versements_paiements_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "paiements" ADD CONSTRAINT "paiements_eleve_id_fkey"
    FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "versements_paiements" ADD CONSTRAINT "versements_paiements_paiement_id_fkey"
    FOREIGN KEY ("paiement_id") REFERENCES "paiements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
