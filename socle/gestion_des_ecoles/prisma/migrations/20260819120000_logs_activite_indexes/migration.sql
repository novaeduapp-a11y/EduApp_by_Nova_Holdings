-- Journal d’activité : recherche récente et par utilisateur

CREATE INDEX IF NOT EXISTS "logs_activite_createdAt_idx" ON "logs_activite"("createdAt");
CREATE INDEX IF NOT EXISTS "logs_activite_user_id_createdAt_idx" ON "logs_activite"("user_id", "createdAt");
