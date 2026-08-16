import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Noms sénégalais courants
const nomsFamille = [
  "Diallo", "Ndiaye", "Fall", "Diop", "Sow", "Ba", "Sy", "Gueye", "Sarr", "Kane",
  "Mbaye", "Faye", "Diouf", "Thiam", "Cisse", "Seck", "Toure", "Diagne", "Ndoye", "Ly"
];

const prenomsMasculins = [
  "Mamadou", "Ibrahima", "Ousmane", "Moussa", "Abdoulaye", "Cheikh", "Modou", "Pape",
  "Amadou", "Aliou", "Babacar", "Samba", "Lamine", "Boubacar", "Malick"
];

const prenomsFeminins = [
  "Fatou", "Aminata", "Awa", "Mariama", "Khady", "Ndèye", "Aïssatou", "Coumba",
  "Rama", "Sokhna", "Mame", "Dieynaba", "Astou", "Ndeye", "Bineta"
];

function generatePhone(): string {
  const prefixes = ["77", "78", "76", "70"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, "0");
  return `${prefix} ${number.slice(0, 3)} ${number.slice(3, 5)} ${number.slice(5)}`;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createParentAccounts() {
  console.log("🚀 Génération des informations parents et création des comptes...\n");

  // Récupérer tous les élèves
  const eleves = await prisma.eleve.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      nom: true,
      prenom: true,
      emailParent: true,
      nomPere: true,
      nomMere: true,
      telephonePere: true,
      telephoneMere: true,
    },
  });

  console.log(`📚 ${eleves.length} élèves trouvés\n`);

  // Étape 1: Mettre à jour les élèves sans infos parents
  let updated = 0;
  for (const eleve of eleves) {
    if (!eleve.emailParent || !eleve.telephonePere) {
      const nomPere = eleve.nomPere || `${prenomsMasculins[Math.floor(Math.random() * prenomsMasculins.length)]} ${eleve.nom}`;
      const nomMere = eleve.nomMere || `${prenomsFeminins[Math.floor(Math.random() * prenomsFeminins.length)]} ${nomsFamille[Math.floor(Math.random() * nomsFamille.length)]}`;
      const telephonePere = eleve.telephonePere || generatePhone();
      const telephoneMere = eleve.telephoneMere || generatePhone();
      const emailParent = eleve.emailParent || `parent.${eleve.nom.toLowerCase().replace(/\s/g, "")}.${eleve.prenom.toLowerCase().replace(/\s/g, "")}@email.sn`;

      await prisma.eleve.update({
        where: { id: eleve.id },
        data: {
          nomPere,
          nomMere,
          telephonePere,
          telephoneMere,
          emailParent,
        },
      });
      
      // Mettre à jour l'objet local
      eleve.nomPere = nomPere;
      eleve.nomMere = nomMere;
      eleve.telephonePere = telephonePere;
      eleve.telephoneMere = telephoneMere;
      eleve.emailParent = emailParent;
      
      updated++;
      console.log(`📝 Infos parent générées pour ${eleve.prenom} ${eleve.nom}`);
    }
  }

  console.log(`\n✅ ${updated} élèves mis à jour avec des infos parents\n`);

  // Étape 2: Grouper les élèves par emailParent
  const elevesByEmail: Record<string, typeof eleves> = {};
  for (const eleve of eleves) {
    if (eleve.emailParent) {
      const email = eleve.emailParent.toLowerCase();
      if (!elevesByEmail[email]) {
        elevesByEmail[email] = [];
      }
      elevesByEmail[email].push(eleve);
    }
  }

  console.log(`📧 ${Object.keys(elevesByEmail).length} emails parents uniques\n`);

  // Étape 3: Créer les comptes parents
  let created = 0;
  let skipped = 0;
  const credentials: { email: string; telephone: string; password: string; enfants: string[] }[] = [];

  for (const [email, enfants] of Object.entries(elevesByEmail)) {
    // Vérifier si un compte existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Vérifier si les liaisons parent-élève existent
      for (const enfant of enfants) {
        const existingLink = await prisma.parentEleve.findUnique({
          where: {
            parentId_eleveId: {
              parentId: existingUser.id,
              eleveId: enfant.id,
            },
          },
        });
        if (!existingLink) {
          await prisma.parentEleve.create({
            data: {
              parentId: existingUser.id,
              eleveId: enfant.id,
              relation: "parent",
            },
          });
          console.log(`🔗 Liaison ajoutée: ${existingUser.email} -> ${enfant.prenom} ${enfant.nom}`);
        }
      }
      skipped++;
      continue;
    }

    // Déterminer le nom du parent (père)
    const premierEnfant = enfants[0];
    let nomParent = premierEnfant.nom;
    let prenomParent = "Parent";
    const telephone = premierEnfant.telephonePere || premierEnfant.telephoneMere || generatePhone();

    if (premierEnfant.nomPere) {
      const parts = premierEnfant.nomPere.split(" ");
      if (parts.length >= 2) {
        prenomParent = parts[0];
        nomParent = parts.slice(1).join(" ");
      } else {
        prenomParent = premierEnfant.nomPere;
      }
    }

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await prisma.user.create({
        data: {
          nom: nomParent,
          prenom: prenomParent,
          email,
          telephone,
          password: hashedPassword,
          role: "PARENT",
          parentEleves: {
            create: enfants.map((e) => ({
              eleveId: e.id,
              relation: "parent",
            })),
          },
        },
      });

      console.log(`✅ Compte créé: ${email} (${enfants.length} enfant(s))`);
      credentials.push({
        email,
        telephone,
        password,
        enfants: enfants.map((e) => `${e.prenom} ${e.nom}`),
      });
      created++;
    } catch (error) {
      console.error(`❌ Erreur pour ${email}:`, error);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`📊 Résumé:`);
  console.log(`   - Élèves mis à jour: ${updated}`);
  console.log(`   - Comptes parents créés: ${created}`);
  console.log(`   - Comptes existants (ignorés): ${skipped}`);
  console.log("=".repeat(70));

  if (credentials.length > 0) {
    console.log("\n📋 IDENTIFIANTS DES NOUVEAUX COMPTES PARENTS:\n");
    console.log("=".repeat(70));
    for (const cred of credentials) {
      console.log(`Email: ${cred.email}`);
      console.log(`Téléphone: ${cred.telephone}`);
      console.log(`Mot de passe: ${cred.password}`);
      console.log(`Enfant(s): ${cred.enfants.join(", ")}`);
      console.log("-".repeat(70));
    }
  }
}

createParentAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
