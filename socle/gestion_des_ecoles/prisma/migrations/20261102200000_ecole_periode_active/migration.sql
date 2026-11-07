-- Période active choisie par chaque école (Direction).
ALTER TABLE "ecoles" ADD COLUMN IF NOT EXISTS "periode_active_id" TEXT;

-- Repli : propager la période globalement active vers les écoles déjà présentes.
UPDATE "ecoles" e
SET "periode_active_id" = p.id
FROM "periodes" p
WHERE p.actif = true
  AND e.periode_active_id IS NULL;

CREATE INDEX IF NOT EXISTS "ecoles_periode_active_id_idx" ON "ecoles"("periode_active_id");

ALTER TABLE "ecoles"
  DROP CONSTRAINT IF EXISTS "ecoles_periode_active_id_fkey";

ALTER TABLE "ecoles"
  ADD CONSTRAINT "ecoles_periode_active_id_fkey"
  FOREIGN KEY ("periode_active_id") REFERENCES "periodes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
