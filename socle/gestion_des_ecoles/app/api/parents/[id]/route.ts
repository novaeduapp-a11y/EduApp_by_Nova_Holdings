import { NextRequest, NextResponse } from "next/server";
import { requireManagement } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// POST /api/parents/[id] - Modifier un parent
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { nom, prenom, telephone, actif } = body;

    // Vérifier que le parent existe
    const existingParent = await prisma.user.findUnique({
      where: { id: params.id, role: "PARENT" },
    });

    if (!existingParent) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Parent non trouvé" } },
        { status: 404 }
      );
    }

    // Mettre à jour le parent
    const updatedParent = await prisma.user.update({
      where: { id: params.id },
      data: {
        nom: nom || existingParent.nom,
        prenom: prenom || existingParent.prenom,
        telephone: telephone !== undefined ? telephone : existingParent.telephone,
        actif: actif !== undefined ? actif : existingParent.actif,
      },
      include: {
        parentEleves: {
          include: {
            eleve: {
              include: { classe: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedParent });
  } catch (error) {
    console.error("Erreur POST /api/parents/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// GET /api/parents/[id] - Récupérer un parent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const parent = await prisma.user.findUnique({
      where: { id: params.id, role: "PARENT" },
      include: {
        parentEleves: {
          include: {
            eleve: {
              include: { classe: true },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Parent non trouvé" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: parent });
  } catch (error) {
    console.error("Erreur GET /api/parents/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
