import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAppreciationSchema = z.object({
  eleveId: z.string().min(1, "Élève requis"),
  periodeId: z.string().min(1, "Période requise"),
  matiereId: z.string().optional().nullable(),
  type: z.enum(["MATIERE", "GENERALE", "CONSEIL_CLASSE"]),
  appreciation: z.string().min(1, "Appréciation requise"),
});

// GET - Récupérer les appréciations
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const eleveId = searchParams.get("eleveId");
    const periodeId = searchParams.get("periodeId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (eleveId) where.eleveId = eleveId;
    if (periodeId) where.periodeId = periodeId;
    if (type) where.type = type;

    const appreciations = await prisma.appreciation.findMany({
      where,
      include: {
        eleve: {
          select: {
            nom: true,
            prenom: true,
          },
        },
        matiere: {
          select: {
            nom: true,
          },
        },
        periode: {
          select: {
            nom: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: appreciations });
  } catch (error) {
    console.error("Erreur récupération appréciations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer ou mettre à jour une appréciation
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;
    const session = authResult.session;

    const body = await request.json();
    const validatedData = createAppreciationSchema.parse(body);

    // Vérifier si une appréciation existe déjà pour cet élève/période/matière/type
    const existingAppreciation = await prisma.appreciation.findFirst({
      where: {
        eleveId: validatedData.eleveId,
        periodeId: validatedData.periodeId,
        matiereId: validatedData.matiereId || null,
        type: validatedData.type,
      },
    });

    let appreciation;

    if (existingAppreciation) {
      // Mettre à jour l'appréciation existante
      appreciation = await prisma.appreciation.update({
        where: { id: existingAppreciation.id },
        data: {
          appreciation: validatedData.appreciation,
          auteurId: session.user.id,
        },
      });
    } else {
      // Créer une nouvelle appréciation
      appreciation = await prisma.appreciation.create({
        data: {
          eleveId: validatedData.eleveId,
          periodeId: validatedData.periodeId,
          matiereId: validatedData.matiereId || null,
          type: validatedData.type,
          appreciation: validatedData.appreciation,
          auteurId: session.user.id,
        },
      });
    }

    return NextResponse.json({ data: appreciation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Erreur création appréciation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une appréciation
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await prisma.appreciation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression appréciation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
