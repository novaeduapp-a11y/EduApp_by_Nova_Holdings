-- EDT hebdo + communiqués (préfet → EduParent)

DO $$ BEGIN
  CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DestinataireCommunique" AS ENUM ('PARENTS', 'PROFESSEURS', 'TOUS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "creneaux_edt" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "classe_id" TEXT NOT NULL,
    "jour" "JourSemaine" NOT NULL,
    "heure_debut" TEXT NOT NULL,
    "heure_fin" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "professeur_id" TEXT,
    "salle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "creneaux_edt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "creneaux_edt_ecole_id_idx" ON "creneaux_edt"("ecole_id");
CREATE INDEX IF NOT EXISTS "creneaux_edt_classe_id_jour_idx" ON "creneaux_edt"("classe_id", "jour");

DO $$ BEGIN
  ALTER TABLE "creneaux_edt" ADD CONSTRAINT "creneaux_edt_classe_jour_heures_key"
    UNIQUE ("classe_id", "jour", "heure_debut", "heure_fin");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "creneaux_edt" ADD CONSTRAINT "creneaux_edt_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "creneaux_edt" ADD CONSTRAINT "creneaux_edt_classe_id_fkey"
    FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "creneaux_edt" ADD CONSTRAINT "creneaux_edt_matiere_id_fkey"
    FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "creneaux_edt" ADD CONSTRAINT "creneaux_edt_professeur_id_fkey"
    FOREIGN KEY ("professeur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "communiques" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "destinataires" "DestinataireCommunique" NOT NULL,
    "famille_cycle" "FamilleCycle",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communiques_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "communiques_ecole_id_createdAt_idx" ON "communiques"("ecole_id", "createdAt");

DO $$ BEGIN
  ALTER TABLE "communiques" ADD CONSTRAINT "communiques_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "communiques" ADD CONSTRAINT "communiques_auteur_id_fkey"
    FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
