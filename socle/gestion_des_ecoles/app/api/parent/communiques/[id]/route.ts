import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const notif = await prisma.notification.findFirst({
      where: {
        userId: authResult.user.id,
        type: { in: ["communique", "communique_urgent"] },
        OR: [
          { data: { path: ["communiqueId"], equals: params.id } },
        ],
      },
      select: { id: true, readAt: true, data: true, type: true },
    });

    const communique = await prisma.communique.findUnique({
      where: { id: params.id },
      include: {
        auteur: { select: { prenom: true, nom: true, role: true } },
        ecole: { select: { id: true, nom: true } },
      },
    });
    if (!communique) {
      return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 });
    }

    const lien = await prisma.parentEleve.findFirst({
      where: {
        parentId: authResult.user.id,
        eleve: { ecoleId: communique.ecoleId, deletedAt: null },
      },
      select: { id: true },
    });
    if (!lien && !notif) {
      return NextResponse.json({ error: "Communiqué introuvable" }, { status: 404 });
    }

    const data = (notif?.data as { ackedAt?: string; auteur?: string } | null) ?? null;
    const auteurNom =
      data?.auteur ||
      `${communique.auteur.prenom} ${communique.auteur.nom}`.trim() ||
      "Établissement";

    return NextResponse.json({
      data: {
        id: communique.id,
        titre: communique.titre,
        corps: communique.corps,
        urgent: communique.urgent,
        auteur: auteurNom,
        createdAt: communique.createdAt.toISOString(),
        ackedAt: data?.ackedAt ?? (notif?.readAt ? notif.readAt.toISOString() : null),
        notificationId: notif?.id ?? null,
      },
    });
  } catch (error) {
    console.error("Erreur lecture communiqué:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
