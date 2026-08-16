import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/permissions";
import { z } from "zod";

const updateMatiereSchema = z.object({
  nom: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  coefficient: z.number().min(1).max(10).optional(),
  domaineId: z.string().optional(),
});

// GET /api/matieres/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const matiere = await prisma.matiere.findUnique({
      where: { id: params.id },
      include: { domaine: true },
    });

    if (!matiere) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Matière non trouvée" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: matiere });
  } catch (error) {
    console.error("Erreur GET /api/matieres/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// PUT /api/matieres/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validation = updateMatiereSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: validation.error.message } },
        { status: 400 }
      );
    }

    const matiere = await prisma.matiere.update({
      where: { id: params.id },
      data: validation.data,
      include: { domaine: true },
    });

    return NextResponse.json({ success: true, data: matiere });
  } catch (error) {
    console.error("Erreur PUT /api/matieres/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// DELETE /api/matieres/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    await prisma.matiere.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error) {
    console.error("Erreur DELETE /api/matieres/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
