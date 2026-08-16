import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagement, requireStaff } from "@/lib/permissions";
import { z } from "zod";

const createMatiereSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  code: z.string().min(1, "Le code est requis"),
  coefficient: z.number().min(1).max(10).default(1),
  domaineId: z.string().min(1, "Le domaine est requis"),
});

// GET /api/matieres - Liste des matières
export async function GET() {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const matieres = await prisma.matiere.findMany({
      include: { domaine: true },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json({ success: true, data: matieres });
  } catch (error) {
    console.error("Erreur GET /api/matieres:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// POST /api/matieres - Créer une matière
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validation = createMatiereSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: validation.error.issues[0].message } },
        { status: 400 }
      );
    }

    const matiere = await prisma.matiere.create({
      data: validation.data,
      include: { domaine: true },
    });

    return NextResponse.json({ success: true, data: matiere }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/matieres:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
