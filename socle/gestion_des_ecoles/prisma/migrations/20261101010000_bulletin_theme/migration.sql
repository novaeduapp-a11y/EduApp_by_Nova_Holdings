-- Thème de bulletin personnalisable par école.
CREATE TYPE "BulletinLayout" AS ENUM ('CLASSIQUE');

CREATE TABLE "bulletin_themes" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "couleur_primaire" TEXT NOT NULL DEFAULT '#1e40af',
    "couleur_secondaire" TEXT NOT NULL DEFAULT '#f0f9ff',
    "lignes_entete" JSONB NOT NULL DEFAULT '[]',
    "lignes_pied" JSONB NOT NULL DEFAULT '[]',
    "labels_signatures" JSONB NOT NULL DEFAULT '["Le Directeur","Le Maître/La Maîtresse","Le Parent"]',
    "afficher_photo" BOOLEAN NOT NULL DEFAULT false,
    "afficher_absences" BOOLEAN NOT NULL DEFAULT true,
    "afficher_observation_conseil" BOOLEAN NOT NULL DEFAULT true,
    "layout" "BulletinLayout" NOT NULL DEFAULT 'CLASSIQUE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulletin_themes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bulletin_themes_ecole_id_key" ON "bulletin_themes"("ecole_id");

ALTER TABLE "bulletin_themes" ADD CONSTRAINT "bulletin_themes_ecole_id_fkey" FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
