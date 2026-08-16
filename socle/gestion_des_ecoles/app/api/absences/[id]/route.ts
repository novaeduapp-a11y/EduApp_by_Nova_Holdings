import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { z } from "zod";

const updateAbsenceSchema = z.object({
  justifiee: z.boolean().optional(),
  motif: z.string().optional(),
  document: z.string().optional(),
});

// GET /api/absences/[id] - Détail d'une absence
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const absence = await prisma.absence.findUnique({
      where: { id: params.id },
      include: {
        eleve: { include: { classe: true } },
        matiere: true,
      },
    });

    if (!absence) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Absence non trouvée" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: absence });
  } catch (error) {
    console.error("Erreur GET /api/absences/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// PUT /api/absences/[id] - Modifier une absence (justifier)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validation = updateAbsenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Données invalides" } },
        { status: 400 }
      );
    }

    const existingAbsence = await prisma.absence.findUnique({
      where: { id: params.id },
    });

    if (!existingAbsence) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Absence non trouvée" } },
        { status: 404 }
      );
    }

    const absence = await prisma.absence.update({
      where: { id: params.id },
      data: validation.data,
      include: {
        eleve: { include: { classe: true } },
        matiere: true,
      },
    });

    return NextResponse.json({ success: true, data: absence });
  } catch (error) {
    console.error("Erreur PUT /api/absences/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// DELETE /api/absences/[id] - Supprimer une absence
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const existingAbsence = await prisma.absence.findUnique({
      where: { id: params.id },
    });

    if (!existingAbsence) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Absence non trouvée" } },
        { status: 404 }
      );
    }

    await prisma.absence.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: { message: "Absence supprimée" } });
  } catch (error) {
    console.error("Erreur DELETE /api/absences/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
