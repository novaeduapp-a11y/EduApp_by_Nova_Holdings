-- Matières créées par le préfet, rattachées à l'école et au cycle.
ALTER TABLE "matieres" ADD COLUMN "ecole_id" TEXT;
ALTER TABLE "matieres" ADD COLUMN "famille_cycle" "FamilleCycle";
CREATE INDEX "matieres_ecole_id_famille_cycle_idx" ON "matieres"("ecole_id", "famille_cycle");
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_ecole_id_fkey" FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Acceptation des conditions à la première connexion.
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);

-- Le préfet peut écrire aux professeurs de son cycle.
ALTER TABLE "fils_staff" ALTER COLUMN "directeur_id" DROP NOT NULL;
ALTER TABLE "fils_staff" ADD COLUMN "professeur_id" TEXT;
CREATE INDEX "fils_staff_prefet_id_professeur_id_idx" ON "fils_staff"("prefet_id", "professeur_id");
ALTER TABLE "fils_staff" ADD CONSTRAINT "fils_staff_professeur_id_fkey" FOREIGN KEY ("professeur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
