import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

const TYPE_FRAIS: Record<string, string> = {
  SCOLARITE: "Scolarité",
  INSCRIPTION: "Inscription",
  CANTINE: "Cantine",
  TRANSPORT: "Transport",
  FOURNITURES: "Fournitures",
  AUTRE: "Autre",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const liens = await prisma.parentEleve.findMany({
      where: { parentId: authResult.user.id, eleve: { deletedAt: null } },
      select: { eleveId: true },
    });
    const eleveIds = liens.map((lien) => lien.eleveId);

    const paiements = eleveIds.length
      ? await prisma.paiement.findMany({
          where: { eleveId: { in: eleveIds } },
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                classe: { select: { nom: true } },
              },
            },
            versements: { orderBy: { datePaiement: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const rows = paiements.map((paiement) => ({
      id: paiement.id,
      typeFrais: paiement.typeFrais,
      typeLabel: TYPE_FRAIS[paiement.typeFrais] ?? paiement.typeFrais,
      montantTotal: Number(paiement.montantTotal),
      montantPaye: Number(paiement.montantPaye),
      reste: Number(paiement.montantTotal) - Number(paiement.montantPaye),
      statut: paiement.statut,
      anneeScolaire: paiement.anneeScolaire,
      echeance: paiement.echeance?.toISOString().slice(0, 10) ?? null,
      description: paiement.description,
      eleve: {
        id: paiement.eleve.id,
        nom: `${paiement.eleve.prenom} ${paiement.eleve.nom}`,
        classe: paiement.eleve.classe.nom,
      },
      versements: paiement.versements.map((versement) => ({
        id: versement.id,
        montant: Number(versement.montant),
        date: versement.datePaiement.toISOString().slice(0, 10),
        mode: versement.modePaiement,
        reference: versement.reference,
      })),
    }));

    const totalDu = rows.reduce((sum, item) => sum + item.montantTotal, 0);
    const totalPaye = rows.reduce((sum, item) => sum + item.montantPaye, 0);

    return NextResponse.json({
      data: {
        paiements: rows,
        stats: {
          totalDu,
          totalPaye,
          reste: totalDu - totalPaye,
          count: rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Erreur paiements parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
