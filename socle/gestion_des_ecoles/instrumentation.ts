/**
 * Instrumentation de démarrage pour Next.js
 * Vérifie les variables d'environnement critiques au démarrage
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Vérifier AUTH_SECRET au démarrage
    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    
    if (!authSecret || authSecret.trim() === "") {
      console.error("\n❌ ERREUR CRITIQUE: AUTH_SECRET manquant ou vide\n");
      console.error("L'application ne peut pas démarrer sans AUTH_SECRET.");
      console.error("Veuillez définir AUTH_SECRET ou NEXTAUTH_SECRET dans vos variables d'environnement.\n");
      console.error("Exemple: AUTH_SECRET=$(openssl rand -base64 32)\n");
      
      // En production, arrêter le démarrage
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "AUTH_SECRET manquant. L'application ne peut pas démarrer sans cette variable d'environnement critique pour la sécurité."
        );
      }
      
      // En développement, avertir fortement mais permettre le démarrage
      console.warn("⚠️  AVERTISSEMENT: Vous êtes en mode développement. Définissez AUTH_SECRET avant de passer en production.\n");
    } else {
      console.log("✓ AUTH_SECRET configuré");
    }

    // Vérifier DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn("⚠️  AVERTISSEMENT: DATABASE_URL non défini");
    } else {
      console.log("✓ DATABASE_URL configuré");
    }
  }
}
