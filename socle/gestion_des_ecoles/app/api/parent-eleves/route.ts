import { NextRequest, NextResponse } from "next/server";
import { requireManagement } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createParentEleveSchema = z.object({
  parentId: z.string().min(1, "Parent requis"),
  eleveId: z.string().min(1, "Élève requis"),
  relation: z.string().optional().default("parent"),
});

// GET - Liste des associations parent-élève
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const eleveId = searchParams.get("eleveId");

    const where: Record<string, string> = {};
    if (parentId) where.parentId = parentId;
    if (eleveId) where.eleveId = eleveId;

    const parentEleves = await prisma.parentEleve.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            matricule: true,
            classe: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: parentEleves });
  } catch (error) {
    console.error("Erreur récupération parent-élèves:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Associer un parent à un élève
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validatedData = createParentEleveSchema.parse(body);

    // Vérifier que le parent existe et a le rôle PARENT
    const parent = await prisma.user.findUnique({
      where: { id: validatedData.parentId },
      select: { role: true },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    if (parent.role !== "PARENT") {
      return NextResponse.json({ error: "L'utilisateur n'a pas le rôle Parent" }, { status: 400 });
    }

    // Vérifier que l'élève existe
    const eleve = await prisma.eleve.findUnique({
      where: { id: validatedData.eleveId },
    });

    if (!eleve) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    // Créer l'association
    const parentEleve = await prisma.parentEleve.create({
      data: {
        parentId: validatedData.parentId,
        eleveId: validatedData.eleveId,
        relation: validatedData.relation,
      },
      include: {
        parent: {
          select: {
            nom: true,
            prenom: true,
          },
        },
        eleve: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json({ data: parentEleve }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    // Erreur de contrainte unique
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Cette association existe déjà" }, { status: 400 });
    }
    console.error("Erreur création parent-élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une association
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await prisma.parentEleve.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression parent-élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
