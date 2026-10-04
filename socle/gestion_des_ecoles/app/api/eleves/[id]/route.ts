import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, checkEleveAccess } from "@/lib/unified-auth";
import { requireAuth } from "@/lib/unified-auth";
import { updateEleveSchema } from "@/lib/validations/eleve";

// GET /api/eleves/[id] - Détail d'un élève (avec isolation école)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(["ADMIN", "PROFESSEUR", "PREFET", "DIRECTEUR"]);
    if (!authResult.ok) return authResult.response;

    const eleve = await prisma.eleve.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        classe: { include: { cycle: true } },
        notes: {
          include: {
            evaluation: { include: { matiere: true, periode: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        absences: {
          orderBy: { dateAbsence: "desc" },
          take: 20,
        },
        bulletins: {
          include: { periode: true },
          orderBy: { createdAt: "desc" },
        },
        moyennesMatieres: {
          include: { matiere: true, periode: true },
        },
        moyennesGenerales: {
          include: { periode: true },
        },
      },
    });

    if (!eleve) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Élève non trouvé" } },
        { status: 404 }
      );
    }

    // Vérifier l'accès à cet élève
    const hasAccess = await checkEleveAccess(
      authResult.user.id,
      authResult.user.role,
      authResult.user.ecoleId,
      params.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Accès refusé à cet élève" } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: eleve });
  } catch (error) {
    console.error("Erreur GET /api/eleves/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// PUT /api/eleves/[id] - Modifier un élève (avec isolation école)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(["ADMIN", "PREFET", "DIRECTEUR"]);
    if (!authResult.ok) return authResult.response;

    // Vérifier l'accès à cet élève
    const hasAccess = await checkEleveAccess(
      authResult.user.id,
      authResult.user.role,
      authResult.user.ecoleId,
      params.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Accès refusé à cet élève" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateEleveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Données invalides",
            details: validation.error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const existingEleve = await prisma.eleve.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!existingEleve) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Élève non trouvé" } },
        { status: 404 }
      );
    }

    const data = validation.data;
    const eleve = await prisma.eleve.update({
      where: { id: params.id },
      data: {
        ...data,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        emailParent: data.emailParent || null,
      },
      include: {
        classe: { include: { cycle: true } },
      },
    });

    return NextResponse.json({ success: true, data: eleve });
  } catch (error) {
    console.error("Erreur PUT /api/eleves/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// DELETE /api/eleves/[id] - Supprimer un élève (soft delete, ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const existingEleve = await prisma.eleve.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!existingEleve) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Élève non trouvé" } },
        { status: 404 }
      );
    }

    // Vérifier l'accès à cet élève
    const hasAccess = await checkEleveAccess(
      authResult.user.id,
      authResult.user.role,
      authResult.user.ecoleId,
      params.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Accès refusé à cet élève" } },
        { status: 403 }
      );
    }

    await prisma.eleve.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), actif: false },
    });

    return NextResponse.json({ success: true, data: { message: "Élève supprimé" } });
  } catch (error) {
    console.error("Erreur DELETE /api/eleves/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
