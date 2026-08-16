import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const parentEleves = await prisma.parentEleve.findMany({
      where: { parentId: authResult.user.id },
      include: {
        eleve: {
          include: {
            classe: {
              include: {
                cycle: true,
              },
            },
          },
        },
      },
    });

    const enfants = parentEleves.map((pe) => ({
      id: pe.eleve.id,
      nom: pe.eleve.nom,
      prenom: pe.eleve.prenom,
      matricule: pe.eleve.matricule,
      photo: pe.eleve.photo,
      classe: pe.eleve.classe.nom,
      cycle: pe.eleve.classe.cycle?.nom,
      relation: pe.relation,
    }));

    return NextResponse.json({ data: enfants });
  } catch (error) {
    console.error("Erreur récupération enfants:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
