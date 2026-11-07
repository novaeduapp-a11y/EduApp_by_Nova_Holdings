import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eleveId: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const { eleveId } = params;

    const parentEleve = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: {
          parentId: authResult.user.id,
          eleveId: eleveId,
        },
      },
    });

    if (!parentEleve) {
      return NextResponse.json({ error: "Accès non autorisé à cet élève" }, { status: 403 });
    }

    // Récupérer les notes de l'élève
    const notes = await prisma.note.findMany({
      where: { eleveId, deletedAt: null },
      include: {
        evaluation: {
          include: {
            matiere: true,
            periode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const eleve = await prisma.eleve.findUnique({
      where: { id: eleveId },
      select: { classeId: true },
    });

    const [moyennesMatieres, moyennesGenerales, affectations] = await Promise.all([
      prisma.moyenneMatiere.findMany({
        where: { eleveId },
        include: {
          matiere: true,
          periode: true,
        },
        orderBy: { periode: { numero: "desc" } },
      }),
      prisma.moyenneGenerale.findMany({
        where: { eleveId },
        include: {
          periode: true,
        },
        orderBy: { periode: { numero: "desc" } },
      }),
      eleve
        ? prisma.classeMatiere.findMany({
            where: { classeId: eleve.classeId },
            include: {
              matiere: { select: { id: true, nom: true, coefficient: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const profIds = [
      ...new Set(affectations.map((a) => a.professeurId).filter((id): id is string => Boolean(id))),
    ];
    const profs = profIds.length
      ? await prisma.user.findMany({
          where: { id: { in: profIds } },
          select: { id: true, prenom: true, nom: true },
        })
      : [];
    const profById = new Map(profs.map((p) => [p.id, `${p.prenom} ${p.nom}`]));

    const profByMatiere = new Map(
      affectations.map((a) => [
        a.matiere.nom,
        {
          professeur: a.professeurId ? profById.get(a.professeurId) ?? null : null,
          coefficient: Number(a.coefficient ?? a.matiere.coefficient),
        },
      ])
    );

    return NextResponse.json({
      data: {
        notes: notes.map((n) => ({
          id: n.id,
          valeur: n.note,
          noteMax: n.evaluation.noteSur,
          evaluation: n.evaluation.titre,
          type: n.evaluation.type,
          date: n.evaluation.dateEvaluation,
          matiere: n.evaluation.matiere.nom,
          periode: n.evaluation.periode.nom,
          coefficient: n.evaluation.coefficient,
        })),
        moyennesMatieres: moyennesMatieres.map((m) => {
          const meta = profByMatiere.get(m.matiere.nom);
          return {
            matiere: m.matiere.nom,
            moyenne: m.moyenne,
            periode: m.periode.nom,
            coefficient: meta?.coefficient ?? Number(m.matiere.coefficient),
            professeur: meta?.professeur ?? null,
          };
        }),
        moyennesGenerales: moyennesGenerales.map((m) => ({
          moyenne: m.moyenneGenerale,
          rang: m.rangClasse,
          mention: m.mention,
          periode: m.periode.nom,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur récupération notes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
