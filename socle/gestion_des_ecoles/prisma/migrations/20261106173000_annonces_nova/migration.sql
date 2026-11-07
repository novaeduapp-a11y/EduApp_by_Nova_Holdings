-- CreateTable
CREATE TABLE "annonces_nova" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annonces_nova_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annonces_nova_createdAt_idx" ON "annonces_nova"("createdAt");
