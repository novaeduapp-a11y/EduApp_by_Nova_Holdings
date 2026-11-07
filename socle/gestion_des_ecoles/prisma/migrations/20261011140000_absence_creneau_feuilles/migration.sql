-- AlterTable
ALTER TABLE "absences" ADD COLUMN "heure_debut" TEXT;
ALTER TABLE "absences" ADD COLUMN "heure_fin" TEXT;

-- CreateIndex
CREATE INDEX "absences_eleve_id_date_absence_idx" ON "absences"("eleve_id", "date_absence");

-- CreateIndex
CREATE INDEX "absences_date_absence_heure_debut_heure_fin_idx" ON "absences"("date_absence", "heure_debut", "heure_fin");

-- CreateTable
CREATE TABLE "feuilles_presence" (
    "id" TEXT NOT NULL,
    "classe_id" TEXT NOT NULL,
    "date_appel" TIMESTAMP(3) NOT NULL,
    "heure_debut" TEXT NOT NULL,
    "heure_fin" TEXT NOT NULL,
    "matiere_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feuilles_presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feuilles_presence_classe_id_date_appel_idx" ON "feuilles_presence"("classe_id", "date_appel");

-- CreateIndex
CREATE UNIQUE INDEX "feuilles_presence_classe_id_date_appel_heure_debut_heure_fin_key" ON "feuilles_presence"("classe_id", "date_appel", "heure_debut", "heure_fin");

-- AddForeignKey
ALTER TABLE "feuilles_presence" ADD CONSTRAINT "feuilles_presence_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
