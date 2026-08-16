-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DIRECTEUR', 'PROFESSEUR');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "TypeEvaluation" AS ENUM ('DEVOIR', 'COMPOSITION', 'INTERROGATION', 'TP');

-- CreateEnum
CREATE TYPE "PeriodeJournee" AS ENUM ('MATIN', 'APRES_MIDI', 'JOURNEE');

-- CreateEnum
CREATE TYPE "TypeAppreciation" AS ENUM ('MATIERE', 'GENERALE', 'CONSEIL_CLASSE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PROFESSEUR',
    "telephone" TEXT,
    "adresse" TEXT,
    "photo" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "cycles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "effectif_max" INTEGER NOT NULL DEFAULT 40,
    "cycle_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleves" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3) NOT NULL,
    "lieu_naissance" TEXT,
    "sexe" "Sexe" NOT NULL,
    "nom_pere" TEXT,
    "telephone_pere" TEXT,
    "nom_mere" TEXT,
    "telephone_mere" TEXT,
    "nom_tuteur" TEXT,
    "telephone_tuteur" TEXT,
    "email_parent" TEXT,
    "classe_id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "adresse" TEXT,
    "photo" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domaines_apprentissage" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "domaines_apprentissage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "coefficient" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    "couleur" TEXT,
    "domaine_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classe_matieres" (
    "id" TEXT NOT NULL,
    "classe_id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "professeur_id" TEXT,
    "coefficient" DECIMAL(3,2) NOT NULL DEFAULT 1.00,

    CONSTRAINT "classe_matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "periodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "TypeEvaluation" NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "classe_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "professeur_id" TEXT NOT NULL,
    "date_evaluation" TIMESTAMP(3) NOT NULL,
    "note_sur" DECIMAL(4,2) NOT NULL DEFAULT 20.00,
    "coefficient" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "note" DECIMAL(4,2),
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saisi_par" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "date_absence" TIMESTAMP(3) NOT NULL,
    "periode" "PeriodeJournee" NOT NULL DEFAULT 'JOURNEE',
    "duree_heures" DECIMAL(4,2),
    "matiere_id" TEXT,
    "justifiee" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "document" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moyennes_matieres" (
    "id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "matiere_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "moyenne" DECIMAL(4,2),
    "nombre_notes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moyennes_matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moyennes_generales" (
    "id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "moyenne_generale" DECIMAL(4,2),
    "rang_classe" INTEGER,
    "total_points" DECIMAL(8,2),
    "total_coefficients" DECIMAL(6,2),
    "mention" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moyennes_generales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appreciations" (
    "id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "matiere_id" TEXT,
    "periode_id" TEXT NOT NULL,
    "type" "TypeAppreciation" NOT NULL,
    "appreciation" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appreciations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulletins" (
    "id" TEXT NOT NULL,
    "eleve_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "token_qr" TEXT NOT NULL,
    "fichier_pdf" TEXT,
    "hash_verification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "genere_par" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bulletins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_activite" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "table" TEXT,
    "record_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_matricule_key" ON "eleves"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "domaines_apprentissage_code_key" ON "domaines_apprentissage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "matieres_code_key" ON "matieres"("code");

-- CreateIndex
CREATE UNIQUE INDEX "classe_matieres_classe_id_matiere_id_key" ON "classe_matieres"("classe_id", "matiere_id");

-- CreateIndex
CREATE UNIQUE INDEX "notes_eleve_id_evaluation_id_key" ON "notes"("eleve_id", "evaluation_id");

-- CreateIndex
CREATE UNIQUE INDEX "moyennes_matieres_eleve_id_matiere_id_periode_id_key" ON "moyennes_matieres"("eleve_id", "matiere_id", "periode_id");

-- CreateIndex
CREATE UNIQUE INDEX "moyennes_generales_eleve_id_periode_id_key" ON "moyennes_generales"("eleve_id", "periode_id");

-- CreateIndex
CREATE UNIQUE INDEX "bulletins_token_qr_key" ON "bulletins"("token_qr");

-- CreateIndex
CREATE UNIQUE INDEX "bulletins_eleve_id_periode_id_key" ON "bulletins"("eleve_id", "periode_id");

-- CreateIndex
CREATE UNIQUE INDEX "parametres_cle_key" ON "parametres"("cle");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_domaine_id_fkey" FOREIGN KEY ("domaine_id") REFERENCES "domaines_apprentissage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classe_matieres" ADD CONSTRAINT "classe_matieres_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classe_matieres" ADD CONSTRAINT "classe_matieres_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_professeur_id_fkey" FOREIGN KEY ("professeur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_saisi_par_fkey" FOREIGN KEY ("saisi_par") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes_matieres" ADD CONSTRAINT "moyennes_matieres_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes_matieres" ADD CONSTRAINT "moyennes_matieres_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes_matieres" ADD CONSTRAINT "moyennes_matieres_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes_generales" ADD CONSTRAINT "moyennes_generales_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes_generales" ADD CONSTRAINT "moyennes_generales_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appreciations" ADD CONSTRAINT "appreciations_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appreciations" ADD CONSTRAINT "appreciations_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appreciations" ADD CONSTRAINT "appreciations_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_genere_par_fkey" FOREIGN KEY ("genere_par") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_activite" ADD CONSTRAINT "logs_activite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
