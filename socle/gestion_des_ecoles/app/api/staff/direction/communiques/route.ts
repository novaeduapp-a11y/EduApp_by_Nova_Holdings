import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { fanOutCommunique } from "@/lib/communiques";

const createSchema = z.object({
  titre: z.string().min(3).max(120),
  corps: z.string().min(8).max(4000),
  urgent: z.boolean().default(false),
  destinataires: z.enum(["PARENTS", "PROFESSEURS", "TOUS"]),
});

export async function GET() {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;

    const communiques = await prisma.communique.findMany({
      where: { ecoleId },
      include: { auteur: { select: { prenom: true, nom: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: communiques.map((item) => ({
        id: item.id,
        titre: item.titre,
        corps: item.corps,
        urgent: item.urgent,
        destinataires: item.destinataires,
        familleCycle: item.familleCycle,
        createdAt: item.createdAt,
        auteur: `${item.auteur.prenom} ${item.auteur.nom}`,
      })),
    });
  } catch (error) {
    console.error("Erreur communiqués direction:", error);
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
      return NextResponse.json({ error: "Titre, message et destinataires requis" }, { status: 400 });
    }

    const communique = await prisma.communique.create({
      data: {
        ecoleId,
        auteurId: id,
        titre: parsed.data.titre.trim(),
        corps: parsed.data.corps.trim(),
        urgent: parsed.data.urgent,
        destinataires: parsed.data.destinataires,
        familleCycle: null,
      },
    });

    const envoyes = await fanOutCommunique({
      communiqueId: communique.id,
      ecoleId,
      familleCycle: null,
      destinataires: communique.destinataires,
      titre: communique.titre,
      corps: communique.corps,
      urgent: communique.urgent,
    });

    return NextResponse.json({ data: { id: communique.id, envoyes } }, { status: 201 });
  } catch (error) {
    console.error("Erreur publication communiqué direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Communiqué manquant" }, { status: 400 });

    const existing = await prisma.communique.findFirst({
      where: { id, ecoleId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.notification.deleteMany({
        where: {
          type: { in: ["communique", "communique_urgent"] },
          data: { path: ["communiqueId"], equals: id },
        },
      }),
      prisma.communique.delete({ where: { id } }),
    ]);

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Erreur suppression communiqué direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
