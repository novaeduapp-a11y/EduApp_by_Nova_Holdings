import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Créer l'utilisateur admin
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@ecole.sn" },
    update: {},
    create: {
      email: "admin@ecole.sn",
      nom: "Admin",
      prenom: "Système",
      password: hashedPassword,
      role: "ADMIN",
      actif: true,
    },
  });
  console.log("✅ Utilisateur admin créé:", admin.email);

  // Créer un directeur
  const directeur = await prisma.user.upsert({
    where: { email: "directeur@ecole.sn" },
    update: {},
    create: {
      email: "directeur@ecole.sn",
      nom: "Diallo",
      prenom: "Mamadou",
      password: hashedPassword,
      role: "DIRECTEUR",
      telephone: "+221 77 123 45 67",
      actif: true,
    },
  });
  console.log("✅ Directeur créé:", directeur.email);

  // Créer un professeur
  const professeur = await prisma.user.upsert({
    where: { email: "professeur@ecole.sn" },
    update: {},
    create: {
      email: "professeur@ecole.sn",
      nom: "Ndiaye",
      prenom: "Fatou",
      password: hashedPassword,
      role: "PROFESSEUR",
      telephone: "+221 77 234 56 78",
      actif: true,
    },
  });
  console.log("✅ Professeur créé:", professeur.email);

  // Créer les cycles
  const cycles = await Promise.all([
    prisma.cycle.upsert({
      where: { id: "cycle-ci-cp" },
      update: {},
      create: {
        id: "cycle-ci-cp",
        nom: "Cycle d'Initiation",
        description: "CI et CP",
        ordre: 1,
      },
    }),
    prisma.cycle.upsert({
      where: { id: "cycle-ce" },
      update: {},
      create: {
        id: "cycle-ce",
        nom: "Cycle Élémentaire",
        description: "CE1 et CE2",
        ordre: 2,
      },
    }),
    prisma.cycle.upsert({
      where: { id: "cycle-cm" },
      update: {},
      create: {
        id: "cycle-cm",
        nom: "Cycle Moyen",
        description: "CM1 et CM2",
        ordre: 3,
      },
    }),
  ]);
  console.log("✅ Cycles créés:", cycles.length);

  // Créer les domaines d'apprentissage
  const domaines = await Promise.all([
    prisma.domaineApprentissage.upsert({
      where: { code: "LANG" },
      update: {},
      create: {
        code: "LANG",
        nom: "Langue et Communication",
        description: "Français, lecture, écriture",
        ordre: 1,
      },
    }),
    prisma.domaineApprentissage.upsert({
      where: { code: "MATH" },
      update: {},
      create: {
        code: "MATH",
        nom: "Mathématiques",
        description: "Calcul, géométrie, mesures",
        ordre: 2,
      },
    }),
    prisma.domaineApprentissage.upsert({
      where: { code: "EVEIL" },
      update: {},
      create: {
        code: "EVEIL",
        nom: "Éducation à la Science et à la Vie Sociale",
        description: "Sciences, histoire, géographie",
        ordre: 3,
      },
    }),
    prisma.domaineApprentissage.upsert({
      where: { code: "EPS" },
      update: {},
      create: {
        code: "EPS",
        nom: "Éducation Physique et Sportive",
        description: "Sport et activités physiques",
        ordre: 4,
      },
    }),
    prisma.domaineApprentissage.upsert({
      where: { code: "ART" },
      update: {},
      create: {
        code: "ART",
        nom: "Éducation Artistique",
        description: "Dessin, musique, arts plastiques",
        ordre: 5,
      },
    }),
  ]);
  console.log("✅ Domaines créés:", domaines.length);

  // Créer les matières
  const matieres = await Promise.all([
    // Langue et Communication
    prisma.matiere.upsert({
      where: { code: "FRANC" },
      update: {},
      create: {
        code: "FRANC",
        nom: "Français",
        coefficient: 3,
        couleur: "#3B82F6",
        domaineId: domaines[0].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "LECT" },
      update: {},
      create: {
        code: "LECT",
        nom: "Lecture",
        coefficient: 2,
        couleur: "#8B5CF6",
        domaineId: domaines[0].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "ECRIT" },
      update: {},
      create: {
        code: "ECRIT",
        nom: "Écriture",
        coefficient: 2,
        couleur: "#EC4899",
        domaineId: domaines[0].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "DICT" },
      update: {},
      create: {
        code: "DICT",
        nom: "Dictée",
        coefficient: 2,
        couleur: "#F59E0B",
        domaineId: domaines[0].id,
      },
    }),
    // Mathématiques
    prisma.matiere.upsert({
      where: { code: "CALC" },
      update: {},
      create: {
        code: "CALC",
        nom: "Calcul",
        coefficient: 3,
        couleur: "#10B981",
        domaineId: domaines[1].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "GEOM" },
      update: {},
      create: {
        code: "GEOM",
        nom: "Géométrie",
        coefficient: 2,
        couleur: "#06B6D4",
        domaineId: domaines[1].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "PROB" },
      update: {},
      create: {
        code: "PROB",
        nom: "Problèmes",
        coefficient: 2,
        couleur: "#84CC16",
        domaineId: domaines[1].id,
      },
    }),
    // Éveil
    prisma.matiere.upsert({
      where: { code: "HIST" },
      update: {},
      create: {
        code: "HIST",
        nom: "Histoire",
        coefficient: 1,
        couleur: "#EF4444",
        domaineId: domaines[2].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "GEO" },
      update: {},
      create: {
        code: "GEO",
        nom: "Géographie",
        coefficient: 1,
        couleur: "#22C55E",
        domaineId: domaines[2].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "SCI" },
      update: {},
      create: {
        code: "SCI",
        nom: "Sciences",
        coefficient: 1,
        couleur: "#A855F7",
        domaineId: domaines[2].id,
      },
    }),
    // EPS
    prisma.matiere.upsert({
      where: { code: "EPS" },
      update: {},
      create: {
        code: "EPS",
        nom: "Éducation Physique",
        coefficient: 1,
        couleur: "#F97316",
        domaineId: domaines[3].id,
      },
    }),
    // Arts
    prisma.matiere.upsert({
      where: { code: "DESS" },
      update: {},
      create: {
        code: "DESS",
        nom: "Dessin",
        coefficient: 1,
        couleur: "#14B8A6",
        domaineId: domaines[4].id,
      },
    }),
    prisma.matiere.upsert({
      where: { code: "RECIT" },
      update: {},
      create: {
        code: "RECIT",
        nom: "Récitation",
        coefficient: 1,
        couleur: "#6366F1",
        domaineId: domaines[4].id,
      },
    }),
  ]);
  console.log("✅ Matières créées:", matieres.length);

  // Créer les classes
  const anneeScolaire = "2025-2026";
  const classes = await Promise.all([
    prisma.classe.upsert({
      where: { id: "classe-ci-a" },
      update: {},
      create: {
        id: "classe-ci-a",
        nom: "CI-A",
        niveau: "CI",
        anneeScolaire,
        effectifMax: 35,
        cycleId: cycles[0].id,
      },
    }),
    prisma.classe.upsert({
      where: { id: "classe-cp-a" },
      update: {},
      create: {
        id: "classe-cp-a",
        nom: "CP-A",
        niveau: "CP",
        anneeScolaire,
        effectifMax: 35,
        cycleId: cycles[0].id,
      },
    }),
    prisma.classe.upsert({
      where: { id: "classe-ce1-a" },
      update: {},
      create: {
        id: "classe-ce1-a",
        nom: "CE1-A",
        niveau: "CE1",
        anneeScolaire,
        effectifMax: 40,
        cycleId: cycles[1].id,
      },
    }),
    prisma.classe.upsert({
      where: { id: "classe-ce2-a" },
      update: {},
      create: {
        id: "classe-ce2-a",
        nom: "CE2-A",
        niveau: "CE2",
        anneeScolaire,
        effectifMax: 40,
        cycleId: cycles[1].id,
      },
    }),
    prisma.classe.upsert({
      where: { id: "classe-cm1-a" },
      update: {},
      create: {
        id: "classe-cm1-a",
        nom: "CM1-A",
        niveau: "CM1",
        anneeScolaire,
        effectifMax: 45,
        cycleId: cycles[2].id,
      },
    }),
    prisma.classe.upsert({
      where: { id: "classe-cm2-a" },
      update: {},
      create: {
        id: "classe-cm2-a",
        nom: "CM2-A",
        niveau: "CM2",
        anneeScolaire,
        effectifMax: 45,
        cycleId: cycles[2].id,
      },
    }),
  ]);
  console.log("✅ Classes créées:", classes.length);

  // Créer les périodes
  const periodes = await Promise.all([
    prisma.periode.upsert({
      where: { id: "periode-1" },
      update: {},
      create: {
        id: "periode-1",
        nom: "1er Trimestre",
        numero: 1,
        dateDebut: new Date("2025-10-01"),
        dateFin: new Date("2025-12-20"),
        anneeScolaire,
        actif: true,
        ordre: 1,
      },
    }),
    prisma.periode.upsert({
      where: { id: "periode-2" },
      update: {},
      create: {
        id: "periode-2",
        nom: "2ème Trimestre",
        numero: 2,
        dateDebut: new Date("2026-01-05"),
        dateFin: new Date("2026-03-31"),
        anneeScolaire,
        actif: false,
        ordre: 2,
      },
    }),
    prisma.periode.upsert({
      where: { id: "periode-3" },
      update: {},
      create: {
        id: "periode-3",
        nom: "3ème Trimestre",
        numero: 3,
        dateDebut: new Date("2026-04-15"),
        dateFin: new Date("2026-06-30"),
        anneeScolaire,
        actif: false,
        ordre: 3,
      },
    }),
  ]);
  console.log("✅ Périodes créées:", periodes.length);

  // Créer quelques élèves de test
  const prenomsMasculins = ["Moussa", "Ibrahima", "Amadou", "Ousmane", "Mamadou", "Abdoulaye", "Cheikh", "Modou"];
  const prenomsFeminins = ["Fatou", "Aminata", "Mariama", "Aissatou", "Khady", "Ndèye", "Coumba", "Awa"];
  const noms = ["Diallo", "Ndiaye", "Fall", "Sow", "Ba", "Diop", "Sy", "Gueye", "Mbaye", "Sarr"];

  let eleveCount = 0;
  for (const classe of classes) {
    for (let i = 1; i <= 5; i++) {
      const isMale = i % 2 === 0;
      const prenom = isMale
        ? prenomsMasculins[Math.floor(Math.random() * prenomsMasculins.length)]
        : prenomsFeminins[Math.floor(Math.random() * prenomsFeminins.length)];
      const nom = noms[Math.floor(Math.random() * noms.length)];
      const matricule = `2025${classe.niveau}${String(eleveCount + 1).padStart(3, "0")}`;

      await prisma.eleve.upsert({
        where: { matricule },
        update: {},
        create: {
          nom,
          prenom,
          dateNaissance: new Date(2015 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          lieuNaissance: "Dakar",
          sexe: isMale ? "M" : "F",
          classeId: classe.id,
          matricule,
          nomPere: `${noms[Math.floor(Math.random() * noms.length)]} ${prenomsMasculins[Math.floor(Math.random() * prenomsMasculins.length)]}`,
          telephonePere: `+221 77 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
          nomMere: `${noms[Math.floor(Math.random() * noms.length)]} ${prenomsFeminins[Math.floor(Math.random() * prenomsFeminins.length)]}`,
          telephoneMere: `+221 78 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
          actif: true,
        },
      });
      eleveCount++;
    }
  }
  console.log("✅ Élèves créés:", eleveCount);

  // Créer les paramètres de l'établissement
  const parametres = [
    { cle: "nom_etablissement", valeur: "École Primaire Cheikh Anta Diop", description: "Nom de l'établissement", type: "string" },
    { cle: "adresse_etablissement", valeur: "Avenue Cheikh Anta Diop, Dakar", description: "Adresse de l'établissement", type: "string" },
    { cle: "telephone_etablissement", valeur: "+221 33 123 45 67", description: "Téléphone de l'établissement", type: "string" },
    { cle: "email_etablissement", valeur: "contact@ecole-cad.sn", description: "Email de l'établissement", type: "string" },
    { cle: "annee_scolaire", valeur: anneeScolaire, description: "Année scolaire en cours", type: "string" },
    { cle: "note_max", valeur: "20", description: "Note maximale par défaut", type: "number" },
  ];

  for (const param of parametres) {
    await prisma.parametre.upsert({
      where: { cle: param.cle },
      update: { valeur: param.valeur },
      create: param,
    });
  }
  console.log("✅ Paramètres créés:", parametres.length);

  console.log("🎉 Seeding terminé avec succès!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
