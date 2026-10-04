import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { parseDateIso } from "@/lib/direction";

const createSchema = z.object({
  titre: z.string().min(3).max(120),
  corps: z.string().min(3).max(2000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET() {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;

    const notes = await prisma.noteAgenda.findMany({
      where: { ecoleId },
      include: { auteur: { select: { prenom: true, nom: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      data: notes.map((note) => ({
        id: note.id,
        titre: note.titre,
        corps: note.corps,
        date: note.date.toISOString().slice(0, 10),
        auteur: `${note.auteur.prenom} ${note.auteur.nom}`,
      })),
    });
  } catch (error) {
    console.error("Erreur agenda direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId } = authResult.user;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Titre et note requis" }, { status: 400 });
    }

    const { start } = parseDateIso(parsed.data.date ?? null);
    const note = await prisma.noteAgenda.create({
      data: {
        ecoleId,
        auteurId: id,
        titre: parsed.data.titre.trim(),
        corps: parsed.data.corps.trim(),
        date: start,
      },
    });

    return NextResponse.json({ data: { id: note.id } }, { status: 201 });
  } catch (error) {
    console.error("Erreur création agenda:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Note manquante" }, { status: 400 });

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Titre et note requis" }, { status: 400 });
    }

    const existing = await prisma.noteAgenda.findFirst({
      where: { id, ecoleId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note introuvable dans votre établissement" }, { status: 404 });
    }

    const { start } = parseDateIso(parsed.data.date ?? null);
    await prisma.noteAgenda.update({
      where: { id },
      data: {
        titre: parsed.data.titre.trim(),
        corps: parsed.data.corps.trim(),
        date: start,
      },
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Erreur modification agenda:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Note manquante" }, { status: 400 });

    const existing = await prisma.noteAgenda.findFirst({ where: { id, ecoleId } });
    if (!existing) {
      return NextResponse.json({ error: "Note introuvable dans votre établissement" }, { status: 404 });
    }

    await prisma.noteAgenda.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Erreur suppression agenda:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
