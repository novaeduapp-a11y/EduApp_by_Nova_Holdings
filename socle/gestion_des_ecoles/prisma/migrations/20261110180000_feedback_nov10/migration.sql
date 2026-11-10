-- Fil staff: préfet optionnel + fil directeur↔professeur
ALTER TABLE "fils_staff" ALTER COLUMN "prefet_id" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "fils_staff_directeur_id_professeur_id_key"
  ON "fils_staff"("directeur_id", "professeur_id");

-- Bulletins: publication séparée de la génération
ALTER TABLE "bulletins" ADD COLUMN IF NOT EXISTS "publie_at" TIMESTAMP(3);

-- Les bulletins déjà générés restent visibles aux parents (comportement historique).
UPDATE "bulletins" SET "publie_at" = "createdAt" WHERE "publie_at" IS NULL AND "deletedAt" IS NULL;

-- Annonces NOVA ciblées par école (null = toutes)
ALTER TABLE "annonces_nova" ADD COLUMN IF NOT EXISTS "ecole_id" TEXT;

CREATE INDEX IF NOT EXISTS "annonces_nova_ecole_id_idx" ON "annonces_nova"("ecole_id");

DO $$ BEGIN
  ALTER TABLE "annonces_nova" ADD CONSTRAINT "annonces_nova_ecole_id_fkey"
    FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
