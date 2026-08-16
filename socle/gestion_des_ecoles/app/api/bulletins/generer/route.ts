import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagement } from "@/lib/permissions";
import QRCode from "qrcode";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/bulletins/generer - Générer un bulletin
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;
    const session = authResult.session;

    const body = await request.json();
    const { eleveId, periodeId } = body;

    if (!eleveId || !periodeId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "eleveId et periodeId sont requis" } },
        { status: 400 }
      );
    }

    // Récupérer l'élève avec sa classe
    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      include: {
        classe: {
          include: {
            cycle: true,
            _count: { select: { eleves: true } },
          },
        },
      },
    });

    if (!eleve) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Élève non trouvé" } },
        { status: 404 }
      );
    }

    // Récupérer la période
    const periode = await prisma.periode.findUnique({
      where: { id: periodeId },
    });

    if (!periode) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Période non trouvée" } },
        { status: 404 }
      );
    }

    // Récupérer les notes de l'élève pour cette période
    const notes = await prisma.note.findMany({
      where: {
        eleveId,
        evaluation: { periodeId },
        absent: false,
        note: { not: null },
      },
      include: {
        evaluation: {
          include: { matiere: true },
        },
      },
    });

    // Helper pour convertir Decimal en number
    const toNumber = (val: Decimal | number | null): number => {
      if (val === null) return 0;
      return typeof val === "number" ? val : Number(val);
    };

    // Calculer les moyennes par matière
    const notesParMatiere: Record<string, { notes: number[]; coef: number; matiere: string }> = {};
    
    for (const noteRecord of notes) {
      if (noteRecord.note === null) continue;
      
      const matiereId = noteRecord.evaluation.matiereId;
      const matiereName = noteRecord.evaluation.matiere.nom;
      const coef = toNumber(noteRecord.evaluation.matiere.coefficient);
      
      if (!notesParMatiere[matiereId]) {
        notesParMatiere[matiereId] = { notes: [], coef, matiere: matiereName };
      }
      
      // Convertir la note sur 20
      const noteVal = toNumber(noteRecord.note);
      const noteSur = toNumber(noteRecord.evaluation.noteSur);
      const noteSur20 = noteSur > 0 ? (noteVal / noteSur) * 20 : 0;
      notesParMatiere[matiereId].notes.push(noteSur20);
    }

    // Calculer la moyenne par matière
    const bulletinNotes = Object.values(notesParMatiere).map((data) => {
      const moyenne = data.notes.length > 0 ? data.notes.reduce((a, b) => a + b, 0) / data.notes.length : 0;
      return {
        matiere: data.matiere,
        note: Math.round(moyenne * 100) / 100,
        noteSur: 20,
        coefficient: data.coef,
        moyenne: moyenne,
        appreciation: getAppreciation(moyenne),
      };
    });

    // Calculer la moyenne générale pondérée
    let totalPoints = 0;
    let totalCoef = 0;
    for (const noteItem of bulletinNotes) {
      totalPoints += noteItem.moyenne * noteItem.coefficient;
      totalCoef += noteItem.coefficient;
    }
    const moyenneGenerale = totalCoef > 0 ? totalPoints / totalCoef : 0;

    // Calculer le rang en comparant avec les autres élèves de la classe
    // Récupérer toutes les moyennes générales de la classe pour cette période
    const moyennesClasse = await prisma.moyenneGenerale.findMany({
      where: {
        periodeId,
        eleve: {
          classeId: eleve.classeId,
        },
      },
      select: {
        eleveId: true,
        moyenneGenerale: true,
      },
    });

    // Ajouter ou mettre à jour la moyenne de l'élève actuel dans la liste
    const moyennesAvecActuel = moyennesClasse.filter(m => m.eleveId !== eleveId);
    moyennesAvecActuel.push({ eleveId, moyenneGenerale: new Decimal(moyenneGenerale) });

    // Trier par moyenne décroissante et calculer le rang
    moyennesAvecActuel.sort((a, b) => Number(b.moyenneGenerale) - Number(a.moyenneGenerale));
    const rang = moyennesAvecActuel.findIndex(m => m.eleveId === eleveId) + 1;

    // Déterminer la mention
    const mention = getMention(moyenneGenerale);

    // Générer le QR Code
    const verificationCode = `BUL-${eleve.matricule}-${periode.id.slice(0, 8)}-${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const verificationUrl = `${appUrl}/bulletins/verifier?code=${encodeURIComponent(verificationCode)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
    });

    // Créer ou mettre à jour la moyenne générale
    await prisma.moyenneGenerale.upsert({
      where: {
        eleveId_periodeId: { eleveId, periodeId },
      },
      create: {
        eleveId,
        periodeId,
        moyenneGenerale: moyenneGenerale,
        rangClasse: rang,
        totalPoints: totalPoints,
        totalCoefficients: totalCoef,
        mention: mention,
      },
      update: {
        moyenneGenerale: moyenneGenerale,
        rangClasse: rang,
        totalPoints: totalPoints,
        totalCoefficients: totalCoef,
        mention: mention,
      },
    });

    // Créer ou mettre à jour le bulletin en base
    const bulletin = await prisma.bulletin.upsert({
      where: {
        eleveId_periodeId: { eleveId, periodeId },
      },
      create: {
        eleveId,
        periodeId,
        tokenQr: verificationCode,
        generePar: session.user.id,
      },
      update: {
        tokenQr: verificationCode,
      },
    });

    // Préparer les données pour le PDF
    const bulletinData = {
      ecole: {
        nom: "École Primaire Cheikh Anta Diop",
        adresse: "Avenue Cheikh Anta Diop, Dakar, Sénégal",
        telephone: "+221 33 123 45 67",
        email: "contact@ecole-cad.sn",
      },
      eleve: {
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        dateNaissance: new Date(eleve.dateNaissance).toLocaleDateString("fr-FR"),
        classe: eleve.classe?.nom || "",
        effectif: eleve.classe?._count?.eleves || 0,
      },
      periode: {
        nom: periode.nom,
        anneeScolaire: "2025-2026",
      },
      notes: bulletinNotes,
      moyenneGenerale,
      rang,
      mention,
      appreciationGenerale: getAppreciationGenerale(moyenneGenerale),
      qrCodeUrl: qrCodeDataUrl,
      dateGeneration: new Date().toLocaleDateString("fr-FR"),
    };

    return NextResponse.json({
      success: true,
      data: {
        bulletin,
        bulletinData,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/bulletins/generer:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

function getAppreciation(note: number): string {
  if (note >= 16) return "Excellent";
  if (note >= 14) return "Très bien";
  if (note >= 12) return "Bien";
  if (note >= 10) return "Assez bien";
  if (note >= 8) return "Passable";
  return "Insuffisant";
}

function getMention(moyenne: number): string {
  if (moyenne >= 16) return "Très Bien";
  if (moyenne >= 14) return "Bien";
  if (moyenne >= 12) return "Assez Bien";
  if (moyenne >= 10) return "Passable";
  return "Insuffisant";
}

function getAppreciationGenerale(moyenne: number): string {
  if (moyenne >= 16) return "Excellent travail ! Félicitations pour ces résultats remarquables.";
  if (moyenne >= 14) return "Très bon travail. Continuez dans cette voie.";
  if (moyenne >= 12) return "Bon travail. Des efforts réguliers à maintenir.";
  if (moyenne >= 10) return "Travail satisfaisant. Peut mieux faire avec plus d'efforts.";
  return "Travail insuffisant. Des efforts importants sont nécessaires.";
}
