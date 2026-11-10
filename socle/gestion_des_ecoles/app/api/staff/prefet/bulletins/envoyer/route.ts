import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyUsers } from "@/lib/notify";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere } from "@/lib/prefet-scope";

const schema = z.object({
  bulletinIds: z.array(z.string().min(1)).min(1).max(200),
});

/** Rend les bulletins visibles aux parents et envoie la notification. */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Sélectionnez au moins un bulletin" }, { status: 400 });
    }

    const bulletins = await prisma.bulletin.findMany({
      where: {
        id: { in: parsed.data.bulletinIds },
        deletedAt: null,
        eleve: { deletedAt: null, classe: familleWhere(ecoleId, familleCycle) },
      },
      include: {
        eleve: { select: { id: true, prenom: true, nom: true } },
      },
    });

    if (bulletins.length === 0) {
      return NextResponse.json({ error: "Aucun bulletin à envoyer" }, { status: 404 });
    }

    const now = new Date();
    const toPublish = bulletins.filter((b) => !b.publieAt);
    if (toPublish.length > 0) {
      await prisma.bulletin.updateMany({
        where: { id: { in: toPublish.map((b) => b.id) } },
        data: { publieAt: now },
      });
    }

    const eleveIds = [...new Set(toPublish.map((b) => b.eleve.id))];
    const liens = eleveIds.length
      ? await prisma.parentEleve.findMany({
          where: { eleveId: { in: eleveIds } },
          select: { parentId: true, eleveId: true },
        })
      : [];

    const byEleve = new Map(toPublish.map((b) => [b.eleve.id, b]));
    if (liens.length > 0) {
      await notifyUsers(
        liens.flatMap((lien) => {
          const bulletin = byEleve.get(lien.eleveId);
          if (!bulletin) return [];
          return [
            {
              userId: lien.parentId,
              type: "bulletin" as const,
              title: `Bulletin disponible · ${bulletin.eleve.prenom} ${bulletin.eleve.nom}`,
              message: "Le bulletin est disponible dans EduParent.",
              data: {
                eleveId: bulletin.eleveId,
                bulletinId: bulletin.id,
                periodeId: bulletin.periodeId,
              },
            },
          ];
        })
      );
    }

    return NextResponse.json({
      data: {
        envoyes: toPublish.length,
        dejaPublies: bulletins.length - toPublish.length,
        parentsNotifies: liens.length,
      },
    });
  } catch (error) {
    console.error("Erreur envoi bulletins parents:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
