import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const [periodes, bulletins, appreciations] = await Promise.all([
      prisma.periode.findMany({ orderBy: { ordre: "asc" } }),
      prisma.bulletin.findMany({
        where: {
          deletedAt: null,
          eleve: { deletedAt: null, classe: familleWhere(ecoleId, familleCycle) },
        },
        include: {
          eleve: { include: { classe: { select: { id: true, nom: true, niveau: true } } } },
          periode: { select: { id: true, nom: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appreciation.findMany({
        where: {
          type: "GENERALE",
          eleve: { deletedAt: null, classe: familleWhere(ecoleId, familleCycle) },
        },
        select: { eleveId: true, periodeId: true, appreciation: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      data: {
        periodes: periodes.map((periode) => ({
          id: periode.id,
          nom: periode.nom,
          actif: periode.actif,
        })),
        bulletins: bulletins.map((bulletin) => ({
          id: bulletin.id,
          eleveId: bulletin.eleveId,
          periodeId: bulletin.periodeId,
          eleve: `${bulletin.eleve.prenom} ${bulletin.eleve.nom}`,
          classe: bulletin.eleve.classe.nom,
          classeId: bulletin.eleve.classe.id,
          niveau: bulletin.eleve.classe.niveau,
          periode: bulletin.periode.nom,
          date: bulletin.createdAt.toISOString(),
        })),
        appreciations: uniqueAppreciations(appreciations),
      },
    });
  } catch (error) {
    console.error("Erreur bulletins préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const body = await request.json();
    const eleveId = String(body.eleveId ?? "");
    let periodeId = String(body.periodeId ?? "");
    const appreciationTexte = String(body.appreciation ?? "").trim();
    if (!eleveId) {
      return NextResponse.json({ error: "Élève requis" }, { status: 400 });
    }

    const eleve = await prisma.eleve.findFirst({
      where: { id: eleveId, deletedAt: null, classe: familleWhere(ecoleId, familleCycle) },
    });
    if (!eleve) return forbiddenCycle();

    if (!periodeId) {
      const active = await prisma.periode.findFirst({ where: { actif: true } });
      periodeId = active?.id ?? "";
    }
    if (!periodeId) {
      return NextResponse.json({ error: "Aucune période active" }, { status: 400 });
    }

    const periode = await prisma.periode.findUnique({ where: { id: periodeId } });
    if (!periode) {
      return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
    }
    if (!periode.actif) {
      return NextResponse.json(
        { error: `Impossible de générer un bulletin pour « ${periode.nom} » : ce trimestre n’est pas actif.` },
        { status: 409 }
      );
    }

    const tokenQr = `BUL-${eleve.matricule}-${periodeId.slice(0, 8)}-${Date.now()}`;
    const bulletin = await prisma.bulletin.upsert({
      where: { eleveId_periodeId: { eleveId, periodeId } },
      create: {
        eleveId,
        periodeId,
        tokenQr,
        generePar: authResult.user.id,
      },
      update: { tokenQr },
    });

    if (appreciationTexte) {
      const existing = await prisma.appreciation.findFirst({
        where: { eleveId, periodeId, type: "GENERALE" },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        await prisma.appreciation.update({
          where: { id: existing.id },
          data: { appreciation: appreciationTexte, auteurId: authResult.user.id },
        });
      } else {
        await prisma.appreciation.create({
          data: {
            eleveId,
            periodeId,
            type: "GENERALE",
            appreciation: appreciationTexte,
            auteurId: authResult.user.id,
          },
        });
      }
    }

    const liens = await prisma.parentEleve.findMany({
      where: { eleveId },
      select: { parentId: true },
    });
    if (liens.length > 0) {
      await prisma.notification.createMany({
        data: liens.map((lien) => ({
          userId: lien.parentId,
          type: "bulletin",
          title: `Bulletin disponible · ${eleve.prenom} ${eleve.nom}`,
          message: "Un bulletin a été généré. Vous pouvez le télécharger dans EduParent.",
          data: { eleveId, bulletinId: bulletin.id, periodeId },
        })),
      });
    }

    return NextResponse.json({ data: { id: bulletin.id, parentsNotifies: liens.length } }, { status: 201 });
  } catch (error) {
    console.error("Erreur génération bulletin préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function uniqueAppreciations(
  rows: { eleveId: string; periodeId: string; appreciation: string }[]
) {
  const seen = new Set<string>();
  const out: { eleveId: string; periodeId: string; appreciation: string }[] = [];
  for (const row of rows) {
    const key = `${row.eleveId}:${row.periodeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
