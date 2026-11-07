-- AlterTable
ALTER TABLE "ecoles" ADD COLUMN "paiement_a_jour" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "classes_deleted_at_idx" ON "classes"("deleted_at");
