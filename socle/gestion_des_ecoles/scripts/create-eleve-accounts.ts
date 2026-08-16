import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createEleveAccounts() {
  console.log("🚀 Création des comptes élèves...\n");

  // Récupérer tous les élèves sans compte utilisateur
  const eleves = await prisma.eleve.findMany({
    where: {
      deletedAt: null,
      userId: null,
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      matricule: true,
    },
  });

  console.log(`📚 ${eleves.length} élèves sans compte trouvés\n`);

  let created = 0;
  const credentials: { matricule: string; email: string; password: string; nom: string }[] = [];

  for (const eleve of eleves) {
    // Générer un email basé sur le matricule
    const email = `${eleve.matricule.toLowerCase()}@eleve.ecole.sn`;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`⏭️  Email existant pour ${eleve.prenom} ${eleve.nom}`);
      continue;
    }

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Créer le compte utilisateur et lier à l'élève
      const user = await prisma.user.create({
        data: {
          nom: eleve.nom,
          prenom: eleve.prenom,
          email,
          password: hashedPassword,
          role: "ELEVE",
        },
      });

      // Lier l'élève au compte utilisateur
      await prisma.eleve.update({
        where: { id: eleve.id },
        data: { userId: user.id },
      });

      console.log(`✅ Compte créé: ${eleve.prenom} ${eleve.nom} (${email})`);
      credentials.push({
        matricule: eleve.matricule,
        email,
        password,
        nom: `${eleve.prenom} ${eleve.nom}`,
      });
      created++;
    } catch (error) {
      console.error(`❌ Erreur pour ${eleve.prenom} ${eleve.nom}:`, error);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`📊 Résumé:`);
  console.log(`   - Comptes élèves créés: ${created}`);
  console.log("=".repeat(70));

  if (credentials.length > 0) {
    console.log("\n📋 IDENTIFIANTS DES COMPTES ÉLÈVES:\n");
    console.log("=".repeat(70));
    for (const cred of credentials) {
      console.log(`Élève: ${cred.nom}`);
      console.log(`Matricule: ${cred.matricule}`);
      console.log(`Email: ${cred.email}`);
      console.log(`Mot de passe: ${cred.password}`);
      console.log("-".repeat(70));
    }
  }
}

createEleveAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
