-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ConvocationStatut" AS ENUM ('ENVOYEE', 'VUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "nom_officiel" TEXT;
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "sigle" TEXT;
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "adresse" TEXT;
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "montant_mensuel" INTEGER;
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "montant_annuel" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ecole_cycles" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "famille" "FamilleCycle" NOT NULL,

    CONSTRAINT "ecole_cycles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "grilles_horaires" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "famille" "FamilleCycle" NOT NULL,
    "heure_debut" TEXT NOT NULL,
    "heure_fin" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grilles_horaires_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "professeur_matieres" (
    "id" TEXT NOT NULL,
    "professeur_id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,

    CONSTRAINT "professeur_matieres_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "convocations" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "classe_id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "date_convocation" TIMESTAMP(3) NOT NULL,
    "motif" TEXT NOT NULL,
    "nom_tuteur" TEXT,
    "telephone_tuteur" TEXT,
    "email_tuteur" TEXT,
    "statut" "ConvocationStatut" NOT NULL DEFAULT 'ENVOYEE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convocations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ecole_cycles_ecole_id_famille_key" ON "ecole_cycles"("ecole_id", "famille");
CREATE UNIQUE INDEX IF NOT EXISTS "grilles_horaires_ecole_id_famille_heure_debut_heure_fin_key" ON "grilles_horaires"("ecole_id", "famille", "heure_debut", "heure_fin");
CREATE INDEX IF NOT EXISTS "grilles_horaires_ecole_id_famille_idx" ON "grilles_horaires"("ecole_id", "famille");
CREATE UNIQUE INDEX IF NOT EXISTS "professeur_matieres_professeur_id_matiere_id_key" ON "professeur_matieres"("professeur_id", "matiere_id");
CREATE INDEX IF NOT EXISTS "convocations_ecole_id_date_convocation_idx" ON "convocations"("ecole_id", "date_convocation");
CREATE INDEX IF NOT EXISTS "convocations_eleve_id_idx" ON "convocations"("eleve_id");

DO $$ BEGIN
    ALTER TABLE "ecole_cycles" ADD CONSTRAINT "ecole_cycles_ecole_id_fkey" FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "grilles_horaires" ADD CONSTRAINT "grilles_horaires_ecole_id_fkey" FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "professeur_matieres" ADD CONSTRAINT "professeur_matieres_professeur_id_fkey" FOREIGN KEY ("professeur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "professeur_matieres" ADD CONSTRAINT "professeur_matieres_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "convocations" ADD CONSTRAINT "convocations_ecole_id_fkey" FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "convocations" ADD CONSTRAINT "convocations_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "convocations" ADD CONSTRAINT "convocations_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "convocations" ADD CONSTRAINT "convocations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

INSERT INTO "ecole_cycles" ("id", "ecole_id", "famille")
SELECT gen_random_uuid()::text, e."id", f.famille
FROM "ecoles" e
CROSS JOIN (VALUES ('PRIMAIRE'::"FamilleCycle"), ('COLLEGE'::"FamilleCycle"), ('SECONDAIRE'::"FamilleCycle")) AS f(famille)
ON CONFLICT ("ecole_id", "famille") DO NOTHING;
