import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "DIRECTEUR", "PROFESSEUR"]).optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  actif: z.boolean().optional(),
});

// GET /api/users/[id] - Détail d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const user = await prisma.user.findUnique({
      where: { id: params.id, deletedAt: null },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        telephone: true,
        adresse: true,
        actif: true,
        photo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Utilisateur non trouvé" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Erreur GET /api/users/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Modifier un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: validation.error.message } },
        { status: 400 }
      );
    }

    const data = { ...validation.data };

    // Si le mot de passe est fourni, le hasher
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: params.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: { code: "EMAIL_EXISTS", message: "Cet email est déjà utilisé" } },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        telephone: true,
        actif: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Erreur PUT /api/users/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Supprimer un utilisateur (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;
    const session = authResult.session;

    // Empêcher la suppression de son propre compte
    if (params.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Vous ne pouvez pas supprimer votre propre compte" } },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), actif: false },
    });

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error) {
    console.error("Erreur DELETE /api/users/[id]:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
