import { NextRequest, NextResponse } from "next/server";
import { requireManagement } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createParentSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  password: z.string().min(6, "Mot de passe minimum 6 caractères"),
  eleveIds: z.array(z.string()).min(1, "Au moins un élève requis"),
  relation: z.string().default("parent"),
});

// GET - Liste des parents
export async function GET() {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const parents = await prisma.user.findMany({
      where: { role: "PARENT", deletedAt: null },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        actif: true,
        createdAt: true,
        parentEleves: {
          include: {
            eleve: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                matricule: true,
                classe: { select: { nom: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: parents });
  } catch (error) {
    console.error("Erreur GET /api/parents:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un compte parent
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validatedData = createParentSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier que les élèves existent
    const eleves = await prisma.eleve.findMany({
      where: { id: { in: validatedData.eleveIds } },
    });

    if (eleves.length !== validatedData.eleveIds.length) {
      return NextResponse.json(
        { error: "Un ou plusieurs élèves n'existent pas" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Créer le parent et les liaisons avec les élèves
    const parent = await prisma.user.create({
      data: {
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        email: validatedData.email,
        telephone: validatedData.telephone,
        password: hashedPassword,
        role: "PARENT",
        parentEleves: {
          create: validatedData.eleveIds.map((eleveId) => ({
            eleveId,
            relation: validatedData.relation,
          })),
        },
      },
      include: {
        parentEleves: {
          include: {
            eleve: {
              select: {
                nom: true,
                prenom: true,
                matricule: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: parent.id,
          nom: parent.nom,
          prenom: parent.prenom,
          email: parent.email,
          enfants: parent.parentEleves.map((pe) => pe.eleve),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Erreur POST /api/parents:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
