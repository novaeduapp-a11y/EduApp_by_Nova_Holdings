-- Messagerie interne direction ↔ préfet
CREATE TABLE IF NOT EXISTS "fils_staff" (
    "id" TEXT NOT NULL,
    "ecole_id" TEXT NOT NULL,
    "directeur_id" TEXT NOT NULL,
    "prefet_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fils_staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "messages_staff" (
    "id" TEXT NOT NULL,
    "fil_id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "lu_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_staff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fils_staff_directeur_id_prefet_id_key" ON "fils_staff"("directeur_id", "prefet_id");
CREATE INDEX IF NOT EXISTS "fils_staff_ecole_id_idx" ON "fils_staff"("ecole_id");
CREATE INDEX IF NOT EXISTS "messages_staff_fil_id_created_at_idx" ON "messages_staff"("fil_id", "created_at");

ALTER TABLE "fils_staff" ADD CONSTRAINT "fils_staff_ecole_id_fkey" FOREIGN KEY ("ecole_id") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fils_staff" ADD CONSTRAINT "fils_staff_directeur_id_fkey" FOREIGN KEY ("directeur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fils_staff" ADD CONSTRAINT "fils_staff_prefet_id_fkey" FOREIGN KEY ("prefet_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages_staff" ADD CONSTRAINT "messages_staff_fil_id_fkey" FOREIGN KEY ("fil_id") REFERENCES "fils_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages_staff" ADD CONSTRAINT "messages_staff_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
