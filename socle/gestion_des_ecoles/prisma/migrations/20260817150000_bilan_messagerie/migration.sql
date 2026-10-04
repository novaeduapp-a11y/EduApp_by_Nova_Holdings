-- Bilan du jour direction + messagerie parent ↔ professeur

DO $$ BEGIN
  CREATE TYPE "TypeEvenementJour" AS ENUM ('ABSENCE_PERSONNEL', 'RETARD_PERSONNEL', 'PERTURBATION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "evenements_jour" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TypeEvenementJour" NOT NULL,
    "titre" TEXT,
    "detail" TEXT,
    "user_id" TEXT,
    "auteur_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evenements_jour_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "evenements_jour_ecole_id_date_idx" ON "evenements_jour"("ecole_id", "date");

DO $$ BEGIN
  ALTER TABLE "evenements_jour" ADD CONSTRAINT "evenements_jour_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "evenements_jour" ADD CONSTRAINT "evenements_jour_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "evenements_jour" ADD CONSTRAINT "evenements_jour_auteur_id_fkey"
    FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "notes_agenda" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notes_agenda_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notes_agenda_ecole_id_date_idx" ON "notes_agenda"("ecole_id", "date");

DO $$ BEGIN
  ALTER TABLE "notes_agenda" ADD CONSTRAINT "notes_agenda_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "notes_agenda" ADD CONSTRAINT "notes_agenda_auteur_id_fkey"
    FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "fils_messages" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "professeur_id" TEXT NOT NULL,
    "matiere_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fils_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fils_messages_ecole_id_idx" ON "fils_messages"("ecole_id");

DO $$ BEGIN
  ALTER TABLE "fils_messages" ADD CONSTRAINT "fils_messages_eleve_parent_prof_key"
    UNIQUE ("eleve_id", "parent_id", "professeur_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fils_messages" ADD CONSTRAINT "fils_messages_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fils_messages" ADD CONSTRAINT "fils_messages_eleve_id_fkey"
    FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fils_messages" ADD CONSTRAINT "fils_messages_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fils_messages" ADD CONSTRAINT "fils_messages_professeur_id_fkey"
    FOREIGN KEY ("professeur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fils_messages" ADD CONSTRAINT "fils_messages_matiere_id_fkey"
    FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "fil_id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "lu_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "messages_fil_id_createdAt_idx" ON "messages"("fil_id", "createdAt");

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_fil_id_fkey"
    FOREIGN KEY ("fil_id") REFERENCES "fils_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_auteur_id_fkey"
    FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
