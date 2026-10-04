import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Reset the test database to a known state with seed data.
 * This creates two schools (Dakar and Thiès) with teachers, students, and classes
 * to test cross-school isolation.
 */
export async function resetTestDatabase() {
  // Clean all data - order matters for FK constraints
  // Delete tables that reference User first
  await prisma.noteAgenda.deleteMany({});
  await prisma.evenementJour.deleteMany({});
  await prisma.messageStaff.deleteMany({});
  await prisma.filStaff.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.filMessage.deleteMany({});
  await prisma.communique.deleteMany({});
  await prisma.creneauEdt.deleteMany({});
  await prisma.logsActivite.deleteMany({});
  await prisma.convocation.deleteMany({});
  await prisma.professeurMatiere.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  
  // Delete tables that reference Eleve
  await prisma.note.deleteMany({});
  await prisma.appreciation.deleteMany({});
  await prisma.bulletin.deleteMany({});
  await prisma.moyenneMatiere.deleteMany({});
  await prisma.moyenneGenerale.deleteMany({});
  await prisma.absence.deleteMany({});
  await prisma.paiement.deleteMany({});
  await prisma.parentEleve.deleteMany({});
  
  // Delete evaluations (references User via professeur)
  await prisma.evaluation.deleteMany({});
  await prisma.classeMatiere.deleteMany({});
  
  // Now safe to delete core entities
  await prisma.eleve.deleteMany({});
  await prisma.classe.deleteMany({});
  await prisma.matiere.deleteMany({});
  await prisma.domaineApprentissage.deleteMany({});
  await prisma.periode.deleteMany({});
  await prisma.tokenRevocation.deleteMany({});
  await prisma.twoFactorChallenge.deleteMany({});
  await prisma.loginAttempt.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.cycle.deleteMany({});
  await prisma.ecole.deleteMany({});

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  // Create two schools for isolation testing
  const ecoleDakar = await prisma.ecole.create({
    data: {
      id: "ecole-dakar",
      nom: "École Primaire Dakar",
      ville: "Dakar",
      actif: true,
    },
  });

  const ecoleThies = await prisma.ecole.create({
    data: {
      id: "ecole-thies",
      nom: "École Primaire Thiès",
      ville: "Thiès",
      actif: true,
    },
  });

  // Create cycles
  const cyclePrimaire = await prisma.cycle.create({
    data: {
      id: "cycle-primaire",
      nom: "Cycle Primaire",
      description: "Classes primaires",
      ordre: 1,
      famille: "PRIMAIRE",
    },
  });

  const cycleCollege = await prisma.cycle.create({
    data: {
      id: "cycle-college",
      nom: "Cycle Collège",
      description: "Classes collège",
      ordre: 2,
      famille: "COLLEGE",
    },
  });

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@test.sn",
      nom: "Admin",
      prenom: "Test",
      password: hashedPassword,
      role: "ADMIN",
      actif: true,
    },
  });

  // Create teacher for Dakar
  const profDakar = await prisma.user.create({
    data: {
      email: "prof-dakar@test.sn",
      nom: "Diop",
      prenom: "Fatou",
      password: hashedPassword,
      role: "PROFESSEUR",
      ecoleId: ecoleDakar.id,
      typeProfesseur: "PRIMAIRE",
      actif: true,
      telephone: "+221771234567",
    },
  });

  // Create teacher for Thiès
  const profThies = await prisma.user.create({
    data: {
      email: "prof-thies@test.sn",
      nom: "Ndiaye",
      prenom: "Moussa",
      password: hashedPassword,
      role: "PROFESSEUR",
      ecoleId: ecoleThies.id,
      typeProfesseur: "PRIMAIRE",
      actif: true,
      telephone: "+221771234568",
    },
  });

  // Create préfet for Dakar (limited to PRIMAIRE cycle)
  const prefetDakar = await prisma.user.create({
    data: {
      email: "prefet-dakar@test.sn",
      nom: "Sall",
      prenom: "Aminata",
      password: hashedPassword,
      role: "PREFET",
      ecoleId: ecoleDakar.id,
      familleCycle: "PRIMAIRE",
      actif: true,
    },
  });

  // Create directeur for Dakar
  const directeurDakar = await prisma.user.create({
    data: {
      email: "directeur-dakar@test.sn",
      nom: "Ba",
      prenom: "Mamadou",
      password: hashedPassword,
      role: "DIRECTEUR",
      ecoleId: ecoleDakar.id,
      actif: true,
    },
  });

  // Create parent
  const parent = await prisma.user.create({
    data: {
      email: "parent@test.sn",
      nom: "Fall",
      prenom: "Aissatou",
      password: hashedPassword,
      role: "PARENT",
      actif: true,
      telephone: "+221771234569",
    },
  });

  // Create user that must change password
  const userMustChange = await prisma.user.create({
    data: {
      email: "mustchange@test.sn",
      nom: "Change",
      prenom: "Password",
      password: hashedPassword,
      role: "PROFESSEUR",
      ecoleId: ecoleDakar.id,
      mustChangePassword: true,
      actif: true,
    },
  });

  // Create deactivated user
  const userDeactivated = await prisma.user.create({
    data: {
      email: "deactivated@test.sn",
      nom: "Inactive",
      prenom: "User",
      password: hashedPassword,
      role: "PROFESSEUR",
      ecoleId: ecoleDakar.id,
      actif: false,
    },
  });

  // Create classes for Dakar
  const classeDakarCM1 = await prisma.classe.create({
    data: {
      nom: "CM1 A",
      niveau: "CM1",
      cycleId: cyclePrimaire.id,
      ecoleId: ecoleDakar.id,
      effectifMax: 40,
      anneeScolaire: "2024-2025",
    },
  });

  // Create class for Thiès
  const classeThiesCM1 = await prisma.classe.create({
    data: {
      nom: "CM1 B",
      niveau: "CM1",
      cycleId: cyclePrimaire.id,
      ecoleId: ecoleThies.id,
      effectifMax: 40,
      anneeScolaire: "2024-2025",
    },
  });

  // Create a college class in Dakar (different cycle for préfet testing)
  const classeDakar6eme = await prisma.classe.create({
    data: {
      nom: "6ème A",
      niveau: "6ème",
      cycleId: cycleCollege.id,
      ecoleId: ecoleDakar.id,
      effectifMax: 35,
      anneeScolaire: "2024-2025",
    },
  });

  // Create domain and subjects
  const domaine = await prisma.domaineApprentissage.create({
    data: {
      code: "MATH",
      nom: "Mathématiques",
      description: "Sciences mathématiques",
      ordre: 1,
    },
  });

  const matiereMaths = await prisma.matiere.create({
    data: {
      code: "MATH",
      nom: "Mathématiques",
      domaineId: domaine.id,
      coefficient: 1,
    },
  });

  // Create students for Dakar
  const eleveDakar1 = await prisma.eleve.create({
    data: {
      matricule: "2024DK001",
      nom: "Sarr",
      prenom: "Ibrahima",
      dateNaissance: new Date("2013-03-15"),
      sexe: "M",
      classeId: classeDakarCM1.id,
      ecoleId: ecoleDakar.id,
      actif: true,
    },
  });

  const eleveDakar2 = await prisma.eleve.create({
    data: {
      matricule: "2024DK002",
      nom: "Diallo",
      prenom: "Marieme",
      dateNaissance: new Date("2013-05-20"),
      sexe: "F",
      classeId: classeDakarCM1.id,
      ecoleId: ecoleDakar.id,
      actif: true,
    },
  });

  // Create student for Thiès
  const eleveThies1 = await prisma.eleve.create({
    data: {
      matricule: "2024TH001",
      nom: "Cisse",
      prenom: "Amadou",
      dateNaissance: new Date("2013-04-10"),
      sexe: "M",
      classeId: classeThiesCM1.id,
      ecoleId: ecoleThies.id,
      actif: true,
    },
  });

  // Create student for 6ème (different cycle, shouldn't be visible to préfet primaire)
  const eleveDakar6eme = await prisma.eleve.create({
    data: {
      matricule: "2024DK003",
      nom: "Sow",
      prenom: "Fatimata",
      dateNaissance: new Date("2012-01-15"),
      sexe: "F",
      classeId: classeDakar6eme.id,
      ecoleId: ecoleDakar.id,
      actif: true,
    },
  });

  // Link parent to one student only
  await prisma.parentEleve.create({
    data: {
      parentId: parent.id,
      eleveId: eleveDakar1.id,
    },
  });

  // Assign teacher to class/subject
  const assignmentDakar = await prisma.classeMatiere.create({
    data: {
      classeId: classeDakarCM1.id,
      matiereId: matiereMaths.id,
      professeurId: profDakar.id,
    },
  });

  const assignmentThies = await prisma.classeMatiere.create({
    data: {
      classeId: classeThiesCM1.id,
      matiereId: matiereMaths.id,
      professeurId: profThies.id,
    },
  });

  // Create periods
  const periode = await prisma.periode.create({
    data: {
      nom: "Trimestre 1",
      numero: 1,
      dateDebut: new Date("2024-09-01"),
      dateFin: new Date("2024-12-15"),
      anneeScolaire: "2024-2025",
      ordre: 1,
    },
  });

  // Create evaluations
  const evalDakar = await prisma.evaluation.create({
    data: {
      titre: "Devoir 1 Maths",
      type: "DEVOIR",
      classeId: classeDakarCM1.id,
      matiereId: matiereMaths.id,
      periodeId: periode.id,
      professeurId: profDakar.id,
      dateEvaluation: new Date("2024-10-01"),
      noteSur: 20,
      coefficient: 1,
    },
  });

  const evalThies = await prisma.evaluation.create({
    data: {
      titre: "Devoir 1 Maths",
      type: "DEVOIR",
      classeId: classeThiesCM1.id,
      matiereId: matiereMaths.id,
      periodeId: periode.id,
      professeurId: profThies.id,
      dateEvaluation: new Date("2024-10-01"),
      noteSur: 20,
      coefficient: 1,
    },
  });

  return {
    schools: { dakar: ecoleDakar, thies: ecoleThies },
    users: {
      admin,
      profDakar,
      profThies,
      prefetDakar,
      directeurDakar,
      parent,
      userMustChange,
      userDeactivated,
    },
    cycles: { primaire: cyclePrimaire, college: cycleCollege },
    classes: {
      dakarCM1: classeDakarCM1,
      thiesCM1: classeThiesCM1,
      dakar6eme: classeDakar6eme,
    },
    students: { eleveDakar1, eleveDakar2, eleveThies1, eleveDakar6eme },
    subjects: { maths: matiereMaths },
    assignments: { dakar: assignmentDakar, thies: assignmentThies },
    evaluations: { evalDakar, evalThies },
    periode,
  };
}
