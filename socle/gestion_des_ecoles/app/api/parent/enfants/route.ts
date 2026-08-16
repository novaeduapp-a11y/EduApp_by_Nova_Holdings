import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les enfants du parent connecté
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un parent
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "PARENT") {
      return NextResponse.json({ error: "Accès réservé aux parents" }, { status: 403 });
    }

    // Récupérer les enfants liés à ce parent
    const parentEleves = await prisma.parentEleve.findMany({
      where: { parentId: session.user.id },
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
