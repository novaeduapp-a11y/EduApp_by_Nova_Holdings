import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParentOfEleve } from "@/lib/request-auth";
import { JOURS_SEMAINE, serializeCreneau } from "@/lib/edt";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParentOfEleve(params.eleveId);
    if (!authResult.ok) return authResult.response;

    const eleve = await prisma.eleve.findUnique({
      where: { id: params.eleveId },
      select: { classeId: true },
    });
    if (!eleve) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }

    const creneaux = await prisma.creneauEdt.findMany({
      where: { classeId: eleve.classeId },
      include: {
        matiere: { select: { nom: true } },
        professeur: { select: { prenom: true, nom: true } },
      },
      orderBy: [{ heureDebut: "asc" }],
    });

    return NextResponse.json({
      data: {
        semaine: JOURS_SEMAINE.map((jour) => ({
          jour: jour.jour,
          label: jour.label,
          cours: creneaux.filter((c) => c.jour === jour.jour).map(serializeCreneau),
        })),
      },
    });
  } catch (error) {
    console.error("Erreur emploi du temps parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
