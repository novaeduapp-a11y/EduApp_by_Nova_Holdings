import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Classes du professeur connecté
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "PROFESSEUR") {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const classeMatieres = await prisma.classeMatiere.findMany({
      where: { professeurId: session.user.id },
      include: {
        classe: {
          include: {
            _count: { select: { eleves: { where: { deletedAt: null } } } },
          },
        },
        matiere: true,
      },
    });

    return NextResponse.json({
      data: classeMatieres.map(cm => ({
        id: cm.classe.id,
        nom: cm.classe.nom,
        niveau: cm.classe.niveau,
        effectif: cm.classe._count.eleves,
        matiere: cm.matiere.nom,
        matiereId: cm.matiere.id,
      })),
    });
  } catch (error) {
    console.error("Erreur classes professeur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
