import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const convocation = await prisma.convocation.findFirst({
      where: {
        id: params.id,
        eleve: { parentEleves: { some: { parentId: authResult.user.id } } },
      },
      include: {
        eleve: { select: { prenom: true, nom: true } },
        classe: { select: { nom: true } },
        createdBy: { select: { prenom: true, nom: true, role: true } },
      },
    });
    if (!convocation) {
      return NextResponse.json({ error: "Convocation introuvable" }, { status: 404 });
    }

    if (convocation.statut === "ENVOYEE") {
      await prisma.convocation.update({
        where: { id: convocation.id },
        data: { statut: "VUE" },
      });
    }

    const demandePar =
      convocation.createdBy.role === "PREFET"
        ? "Le Préfet"
        : convocation.createdBy.role === "DIRECTEUR"
          ? "La Direction"
          : `${convocation.createdBy.prenom} ${convocation.createdBy.nom}`;

    return NextResponse.json({
      data: {
        id: convocation.id,
        motif: convocation.motif,
        message: convocation.message,
        dateConvocation: convocation.dateConvocation.toISOString(),
        statut: convocation.statut === "ENVOYEE" ? "VUE" : convocation.statut,
        confirmedAt: convocation.confirmedAt?.toISOString() ?? null,
        eleveNom: `${convocation.eleve.prenom} ${convocation.eleve.nom}`,
        classeNom: convocation.classe.nom,
        demandePar,
      },
    });
  } catch (error) {
    console.error("Erreur lecture convocation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
