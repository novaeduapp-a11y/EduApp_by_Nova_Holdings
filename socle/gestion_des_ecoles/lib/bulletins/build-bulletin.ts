import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import type { BulletinData } from "@/lib/pdf/bulletin-template";
import { APP_URL } from "@/lib/constants";

function toNumber(val: { toString(): string } | number | null | undefined): number {
  if (val == null) return 0;
  return typeof val === "number" ? val : Number(val);
}

export async function buildBulletinData(bulletinId: string): Promise<BulletinData | null> {
  const bulletin = await prisma.bulletin.findUnique({
    where: { id: bulletinId },
    include: {
      periode: true,
      eleve: {
        include: {
          classe: { include: { _count: { select: { eleves: true } } } },
          moyennesMatieres: { include: { matiere: true } },
          moyennesGenerales: true,
        },
      },
    },
  });
  if (!bulletin) return null;

  const moyenne = bulletin.eleve.moyennesGenerales.find((m) => m.periodeId === bulletin.periodeId);
  const notesMatiere = bulletin.eleve.moyennesMatieres.filter((m) => m.periodeId === bulletin.periodeId);

  const notes = notesMatiere.map((m) => {
    const valeur = toNumber(m.moyenne);
    return {
      matiere: m.matiere.nom,
      note: valeur,
      noteSur: 20,
      coefficient: toNumber(m.matiere.coefficient),
      moyenne: valeur,
      appreciation: appreciation(valeur),
    };
  });

  const moyenneGenerale = toNumber(moyenne?.moyenneGenerale);
  const verificationUrl = `${APP_URL}/bulletins/verifier?code=${encodeURIComponent(bulletin.tokenQr)}`;
  const qrCodeUrl = await QRCode.toDataURL(verificationUrl, { width: 100, margin: 1 });

  const [nomEcole, adresse, telephone, email] = await Promise.all([
    prisma.parametre.findUnique({ where: { cle: "nom_etablissement" } }),
    prisma.parametre.findUnique({ where: { cle: "adresse_etablissement" } }),
    prisma.parametre.findUnique({ where: { cle: "telephone_etablissement" } }),
    prisma.parametre.findUnique({ where: { cle: "email_etablissement" } }),
  ]);

  return {
    ecole: {
      nom: nomEcole?.valeur || "EduApps",
      adresse: adresse?.valeur || "Dakar, Sénégal",
      telephone: telephone?.valeur || "",
      email: email?.valeur || "",
    },
    eleve: {
      nom: bulletin.eleve.nom,
      prenom: bulletin.eleve.prenom,
      matricule: bulletin.eleve.matricule,
      dateNaissance: new Date(bulletin.eleve.dateNaissance).toLocaleDateString("fr-FR"),
      classe: bulletin.eleve.classe.nom,
      effectif: bulletin.eleve.classe._count.eleves,
    },
    periode: {
      nom: bulletin.periode.nom,
      anneeScolaire: bulletin.periode.anneeScolaire,
    },
    notes,
    moyenneGenerale,
    rang: moyenne?.rangClasse || 1,
    mention: moyenne?.mention || "—",
    appreciationGenerale: appreciationGenerale(moyenneGenerale),
    qrCodeUrl,
    dateGeneration: new Date(bulletin.createdAt).toLocaleDateString("fr-FR"),
  };
}

function appreciation(note: number): string {
  if (note >= 16) return "Excellent";
  if (note >= 14) return "Très bien";
  if (note >= 12) return "Bien";
  if (note >= 10) return "Assez bien";
  if (note >= 8) return "Passable";
  return "Insuffisant";
}

function appreciationGenerale(moyenne: number): string {
  if (moyenne >= 16) return "Excellent travail. Félicitations pour ces résultats.";
  if (moyenne >= 14) return "Très bon travail. Continuez dans cette voie.";
  if (moyenne >= 12) return "Bon travail. Des efforts réguliers à maintenir.";
  if (moyenne >= 10) return "Travail satisfaisant. Peut mieux faire.";
  return "Travail insuffisant. Des efforts importants sont nécessaires.";
}
