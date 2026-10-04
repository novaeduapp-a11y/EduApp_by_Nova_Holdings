-- AlterTable
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "salle" TEXT;
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "professeur_principal_id" TEXT;

ALTER TABLE "eleves" ADD COLUMN IF NOT EXISTS "telephone_secours" TEXT;
ALTER TABLE "eleves" ADD COLUMN IF NOT EXISTS "lien_tuteur" TEXT;

CREATE INDEX IF NOT EXISTS "classes_professeur_principal_id_idx" ON "classes"("professeur_principal_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_professeur_principal_id_fkey'
  ) THEN
    ALTER TABLE "classes"
      ADD CONSTRAINT "classes_professeur_principal_id_fkey"
      FOREIGN KEY ("professeur_principal_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
