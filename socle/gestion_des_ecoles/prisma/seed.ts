import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getMention } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await prisma.ecole.upsert({
    where: { id: "ecole-dakar" },
    update: {},
    create: {
      id: "ecole-dakar",
      nom: "École Primaire Cheikh Anta Diop",
      ville: "Dakar",
      actif: true,
    },
  });
  await prisma.ecole.upsert({
    where: { id: "ecole-thies" },
    update: {},
    create: {
      id: "ecole-thies",
      nom: "Groupe Scolaire NOVA Thiès",
      ville: "Thiès",
      actif: true,
    },
  });
  console.log("✅ Écoles Dakar et Thiès");

  // Créer l'utilisateur admin 
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
    update: { ecoleId: "ecole-dakar", twoFactorEnabled: true },
    create: {
      email: "directeur@ecole.sn",
      nom: "Diallo",
      prenom: "Mamadou",
      password: hashedPassword,
      role: "DIRECTEUR",
      telephone: "+221 77 123 45 67",
      actif: true,
      ecoleId: "ecole-dakar",
      twoFactorEnabled: true,
    },
  });
  console.log("✅ Directeur créé:", directeur.email);

  // Créer un professeur
  const professeur = await prisma.user.upsert({
    where: { email: "professeur@ecole.sn" },
    update: { ecoleId: "ecole-dakar", typeProfesseur: "PRIMAIRE" },
    create: {
      email: "professeur@ecole.sn",
      nom: "Ndiaye",
      prenom: "Fatou",
      password: hashedPassword,
      role: "PROFESSEUR",
      telephone: "+221 77 234 56 78",
      actif: true,
      ecoleId: "ecole-dakar",
      typeProfesseur: "PRIMAIRE",
    },
  });
  console.log("✅ Professeur créé:", professeur.email);

  // Créer les cycles
  const cycles = await Promise.all([
    prisma.cycle.upsert({
      where: { id: "cycle-ci-cp" },
      update: { famille: "PRIMAIRE" },
      create: {
        id: "cycle-ci-cp",
        nom: "Cycle d'Initiation",
        description: "CI et CP",
        ordre: 1,
        famille: "PRIMAIRE",
      },
    }),
    prisma.cycle.upsert({
      where: { id: "cycle-ce" },
      update: { famille: "PRIMAIRE" },
      create: {
        id: "cycle-ce",
        nom: "Cycle Élémentaire",
        description: "CE1 et CE2",
        ordre: 2,
        famille: "PRIMAIRE",
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
        famille: "PRIMAIRE",
      },
    }),
    prisma.cycle.upsert({
      where: { id: "cycle-college" },
      update: { famille: "COLLEGE" },
      create: {
        id: "cycle-college",
        nom: "Collège",
        description: "6ème à 3ème",
        ordre: 10,
        famille: "COLLEGE",
      },
    }),
    prisma.cycle.upsert({
      where: { id: "cycle-secondaire" },
      update: { famille: "SECONDAIRE" },
      create: {
        id: "cycle-secondaire",
        nom: "Secondaire",
        description: "Seconde à Terminale",
        ordre: 20,
        famille: "SECONDAIRE",
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
        ecoleId: "ecole-dakar",
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
        ecoleId: "ecole-dakar",
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
        ecoleId: "ecole-dakar",
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
        ecoleId: "ecole-dakar",
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
        ecoleId: "ecole-dakar",
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
        ecoleId: "ecole-dakar",
      },
    }),
  ]);
  console.log("✅ Classes créées:", classes.length);

  await prisma.classe.upsert({
    where: { id: "classe-6eme-a" },
    update: { ecoleId: "ecole-dakar", cycleId: "cycle-college" },
    create: {
      id: "classe-6eme-a",
      nom: "6ème A",
      niveau: "6ème",
      anneeScolaire,
      effectifMax: 40,
      cycleId: "cycle-college",
      ecoleId: "ecole-dakar",
    },
  });

  await prisma.classe.upsert({
    where: { id: "classe-thies-ci-a" },
    update: { ecoleId: "ecole-thies" },
    create: {
      id: "classe-thies-ci-a",
      nom: "CI-A",
      niveau: "CI",
      anneeScolaire,
      effectifMax: 35,
      cycleId: cycles[0].id,
      ecoleId: "ecole-thies",
    },
  });

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
          ecoleId: "ecole-dakar",
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

  const parentPassword = await bcrypt.hash("Admin@123", 10);
  const parent = await prisma.user.upsert({
    where: { email: "parent@ecole.sn" },
    update: { ecoleId: "ecole-dakar" },
    create: {
      email: "parent@ecole.sn",
      nom: "Fall",
      prenom: "Aissatou",
      password: parentPassword,
      role: "PARENT",
      telephone: "+221 77 111 22 33",
      actif: true,
      ecoleId: "ecole-dakar",
    },
  });
  const enfantsLies = await prisma.eleve.findMany({
    take: 2,
    orderBy: { matricule: "asc" },
  });
  for (const enfant of enfantsLies) {
    await prisma.parentEleve.upsert({
      where: {
        parentId_eleveId: { parentId: parent.id, eleveId: enfant.id },
      },
      update: {},
      create: {
        parentId: parent.id,
        eleveId: enfant.id,
        relation: "mere",
      },
    });
  }
  console.log("✅ Parent démo:", parent.email, "→", enfantsLies.map((e) => e.prenom).join(", "));

  const francais = matieres[0];
  const calcul = matieres[4];
  const periodeActive = periodes[0];
  const evaluationsDemo = await Promise.all(
    [
      {
        id: "eval-demo-franc-d1",
        titre: "Devoir 1",
        type: "DEVOIR" as const,
        matiereId: francais.id,
        date: "2025-11-12",
      },
      {
        id: "eval-demo-franc-c1",
        titre: "Composition",
        type: "COMPOSITION" as const,
        matiereId: francais.id,
        date: "2025-12-05",
      },
      {
        id: "eval-demo-calc-d1",
        titre: "Devoir 1",
        type: "DEVOIR" as const,
        matiereId: calcul.id,
        date: "2025-11-18",
      },
      {
        id: "eval-demo-calc-i1",
        titre: "Interrogation",
        type: "INTERROGATION" as const,
        matiereId: calcul.id,
        date: "2025-12-02",
      },
    ].map((item) =>
      prisma.evaluation.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          titre: item.titre,
          type: item.type,
          matiereId: item.matiereId,
          classeId: "classe-ci-a",
          periodeId: periodeActive.id,
          professeurId: professeur.id,
          dateEvaluation: new Date(item.date),
          noteSur: 20,
          coefficient: 1,
        },
      })
    )
  );

  const notesDemo: number[][] = [
    [15.5, 12, 16, 9],
    [11, 14.5, 13, 16],
  ];

  for (let i = 0; i < enfantsLies.length; i++) {
    const enfant = enfantsLies[i];
    const valeurs = notesDemo[i] ?? notesDemo[0];
    for (let j = 0; j < evaluationsDemo.length; j++) {
      await prisma.note.upsert({
        where: {
          eleveId_evaluationId: {
            eleveId: enfant.id,
            evaluationId: evaluationsDemo[j].id,
          },
        },
        update: { note: valeurs[j] },
        create: {
          eleveId: enfant.id,
          evaluationId: evaluationsDemo[j].id,
          note: valeurs[j],
          saisiPar: professeur.id,
        },
      });
    }

    const moyenne = valeurs.reduce((sum, n) => sum + n, 0) / valeurs.length;
    await prisma.moyenneGenerale.upsert({
      where: { eleveId_periodeId: { eleveId: enfant.id, periodeId: periodeActive.id } },
      update: { moyenneGenerale: moyenne, mention: getMention(moyenne) },
      create: {
        eleveId: enfant.id,
        periodeId: periodeActive.id,
        moyenneGenerale: moyenne,
        mention: getMention(moyenne),
      },
    });

    await prisma.moyenneMatiere.upsert({
      where: {
        eleveId_matiereId_periodeId: {
          eleveId: enfant.id,
          matiereId: francais.id,
          periodeId: periodeActive.id,
        },
      },
      update: { moyenne: (valeurs[0] + valeurs[1]) / 2, nombreNotes: 2 },
      create: {
        eleveId: enfant.id,
        matiereId: francais.id,
        periodeId: periodeActive.id,
        moyenne: (valeurs[0] + valeurs[1]) / 2,
        nombreNotes: 2,
      },
    });
    await prisma.moyenneMatiere.upsert({
      where: {
        eleveId_matiereId_periodeId: {
          eleveId: enfant.id,
          matiereId: calcul.id,
          periodeId: periodeActive.id,
        },
      },
      update: { moyenne: (valeurs[2] + valeurs[3]) / 2, nombreNotes: 2 },
      create: {
        eleveId: enfant.id,
        matiereId: calcul.id,
        periodeId: periodeActive.id,
        moyenne: (valeurs[2] + valeurs[3]) / 2,
        nombreNotes: 2,
      },
    });

    await prisma.absence.upsert({
      where: { id: `absence-demo-${enfant.matricule}-1` },
      update: {},
      create: {
        id: `absence-demo-${enfant.matricule}-1`,
        eleveId: enfant.id,
        dateAbsence: new Date("2026-01-15"),
        periode: "MATIN",
        justifiee: i === 0,
        motif: i === 0 ? "Rendez-vous médical" : "Non justifiée",
        createdBy: professeur.id,
      },
    });

    await prisma.bulletin.upsert({
      where: { eleveId_periodeId: { eleveId: enfant.id, periodeId: periodeActive.id } },
      update: {},
      create: {
        eleveId: enfant.id,
        periodeId: periodeActive.id,
        tokenQr: `qr-demo-${enfant.matricule}`,
        generePar: professeur.id,
      },
    });
  }

  await prisma.notification.upsert({
    where: { id: "notif-demo-rentree" },
    update: {},
    create: {
      id: "notif-demo-rentree",
      userId: parent.id,
      type: "alerte",
      title: "Réunion parents-professeurs",
      message: "Samedi 22 février à 9h, salle polyvalente. Votre présence est souhaitée.",
    },
  });
  console.log("✅ Notes, absences, bulletins et notification de démo créés");

  await prisma.classeMatiere.upsert({
    where: { classeId_matiereId: { classeId: "classe-ci-a", matiereId: francais.id } },
    update: { professeurId: professeur.id },
    create: {
      classeId: "classe-ci-a",
      matiereId: francais.id,
      professeurId: professeur.id,
      coefficient: 3,
    },
  });
  await prisma.classeMatiere.upsert({
    where: { classeId_matiereId: { classeId: "classe-ci-a", matiereId: calcul.id } },
    update: { professeurId: professeur.id },
    create: {
      classeId: "classe-ci-a",
      matiereId: calcul.id,
      professeurId: professeur.id,
      coefficient: 3,
    },
  });
  console.log("✅ Instituteur CI-A : Français + Calcul");

  const staffExtras = [
    {
      email: "prefet.primaire@ecole.sn",
      nom: "Sarr",
      prenom: "Oumar",
      role: "PREFET" as const,
      familleCycle: "PRIMAIRE" as const,
      ecoleId: "ecole-dakar",
    },
    {
      email: "prefet.college@ecole.sn",
      nom: "Ba",
      prenom: "Awa",
      role: "PREFET" as const,
      familleCycle: "COLLEGE" as const,
      ecoleId: "ecole-dakar",
    },
    {
      email: "prefet.secondaire@ecole.sn",
      nom: "Gueye",
      prenom: "Ibrahima",
      role: "PREFET" as const,
      familleCycle: "SECONDAIRE" as const,
      ecoleId: "ecole-dakar",
    },
    {
      email: "prof.college@ecole.sn",
      nom: "Diop",
      prenom: "Cheikh",
      role: "PROFESSEUR" as const,
      typeProfesseur: "MATIERE" as const,
      ecoleId: "ecole-dakar",
    },
    {
      email: "directeur.thies@ecole.sn",
      nom: "Cissé",
      prenom: "Mame",
      role: "DIRECTEUR" as const,
      ecoleId: "ecole-thies",
      twoFactorEnabled: true,
    },
    {
      email: "prefet.thies@ecole.sn",
      nom: "Kane",
      prenom: "Astou",
      role: "PREFET" as const,
      familleCycle: "PRIMAIRE" as const,
      ecoleId: "ecole-thies",
    },
    {
      email: "prof.thies@ecole.sn",
      nom: "Faye",
      prenom: "Pape",
      role: "PROFESSEUR" as const,
      typeProfesseur: "PRIMAIRE" as const,
      ecoleId: "ecole-thies",
    },
  ];

  for (const item of staffExtras) {
    await prisma.user.upsert({
      where: { email: item.email },
      update: {
        ecoleId: item.ecoleId,
        role: item.role,
        familleCycle: "familleCycle" in item ? item.familleCycle : null,
        typeProfesseur: "typeProfesseur" in item ? item.typeProfesseur : null,
        twoFactorEnabled: "twoFactorEnabled" in item ? Boolean(item.twoFactorEnabled) : false,
      },
      create: {
        email: item.email,
        nom: item.nom,
        prenom: item.prenom,
        password: hashedPassword,
        role: item.role,
        actif: true,
        ecoleId: item.ecoleId,
        familleCycle: "familleCycle" in item ? item.familleCycle : undefined,
        typeProfesseur: "typeProfesseur" in item ? item.typeProfesseur : undefined,
        twoFactorEnabled: "twoFactorEnabled" in item ? Boolean(item.twoFactorEnabled) : false,
      },
    });
  }
  console.log("✅ Préfets, prof matière et comptes Thiès");

  const profCollege = await prisma.user.findUnique({ where: { email: "prof.college@ecole.sn" } });
  const profThies = await prisma.user.findUnique({ where: { email: "prof.thies@ecole.sn" } });

  if (profCollege) {
    await prisma.classeMatiere.upsert({
      where: { classeId_matiereId: { classeId: "classe-6eme-a", matiereId: francais.id } },
      update: { professeurId: profCollege.id },
      create: {
        classeId: "classe-6eme-a",
        matiereId: francais.id,
        professeurId: profCollege.id,
        coefficient: 3,
      },
    });
    await prisma.evaluation.upsert({
      where: { id: "eval-college-franc-d1" },
      update: { professeurId: profCollege.id, classeId: "classe-6eme-a" },
      create: {
        id: "eval-college-franc-d1",
        titre: "Devoir 1",
        type: "DEVOIR",
        matiereId: francais.id,
        classeId: "classe-6eme-a",
        periodeId: periodeActive.id,
        professeurId: profCollege.id,
        dateEvaluation: new Date("2025-11-20"),
        noteSur: 20,
        coefficient: 1,
      },
    });
  }

  const elevesCollege = [
    { matricule: "20256EMA001", nom: "Diop", prenom: "Cheikh", sexe: "M" as const },
    { matricule: "20256EMA002", nom: "Ndiaye", prenom: "Awa", sexe: "F" as const },
    { matricule: "20256EMA003", nom: "Ba", prenom: "Moussa", sexe: "M" as const },
  ];
  for (const eleve of elevesCollege) {
    await prisma.eleve.upsert({
      where: { matricule: eleve.matricule },
      update: { classeId: "classe-6eme-a", ecoleId: "ecole-dakar" },
      create: {
        nom: eleve.nom,
        prenom: eleve.prenom,
        dateNaissance: new Date("2013-04-12"),
        lieuNaissance: "Dakar",
        sexe: eleve.sexe,
        classeId: "classe-6eme-a",
        ecoleId: "ecole-dakar",
        matricule: eleve.matricule,
        actif: true,
      },
    });
  }

  if (profThies) {
    await prisma.classeMatiere.upsert({
      where: { classeId_matiereId: { classeId: "classe-thies-ci-a", matiereId: francais.id } },
      update: { professeurId: profThies.id },
      create: {
        classeId: "classe-thies-ci-a",
        matiereId: francais.id,
        professeurId: profThies.id,
        coefficient: 3,
      },
    });
  }
  await prisma.eleve.upsert({
    where: { matricule: "2025THCI001" },
    update: { classeId: "classe-thies-ci-a", ecoleId: "ecole-thies" },
    create: {
      nom: "Kane",
      prenom: "Astou",
      dateNaissance: new Date("2018-09-01"),
      lieuNaissance: "Thiès",
      sexe: "F",
      classeId: "classe-thies-ci-a",
      ecoleId: "ecole-thies",
      matricule: "2025THCI001",
      actif: true,
    },
  });
  console.log("✅ Affectations collège / Thiès et élèves de démo");

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
