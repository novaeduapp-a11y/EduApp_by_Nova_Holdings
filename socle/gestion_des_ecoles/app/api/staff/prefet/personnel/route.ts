import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { nomComplet, parseDateIso } from "@/lib/direction";

const saveSchema = z
  .object({
    userId: z.string().min(1).optional(),
    all: z.boolean().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    statut: z.enum(["PRESENT", "ABSENT", "RETARD"]),
    detail: z.string().max(200).optional().nullable(),
  })
  .refine((data) => data.all === true || Boolean(data.userId), {
    message: "Personnel requis",
  });

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;
    const { date, start, end } = parseDateIso(request.nextUrl.searchParams.get("date"));

    const [profs, evenements] = await Promise.all([
      prisma.user.findMany({
        where: { ecoleId, role: "PROFESSEUR", actif: true, deletedAt: null },
        select: { id: true, prenom: true, nom: true, typeProfesseur: true, email: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.evenementJour.findMany({
        where: {
          ecoleId,
          date: { gte: start, lte: end },
          type: { in: ["ABSENCE_PERSONNEL", "RETARD_PERSONNEL"] },
        },
      }),
    ]);

    const affectations = await prisma.classeMatiere.findMany({
      where: { professeurId: { in: profs.map((p) => p.id) }, classe: { ecoleId } },
      include: {
        classe: { select: { nom: true } },
        matiere: { select: { nom: true } },
      },
    });
    const byProf = new Map<string, string[]>();
    for (const row of affectations) {
      if (!row.professeurId) continue;
      const label = `${row.matiere.nom} · ${row.classe.nom}`;
      const list = byProf.get(row.professeurId) ?? [];
      list.push(label);
      byProf.set(row.professeurId, list);
    }

    const eventByUser = new Map(evenements.filter((e) => e.userId).map((e) => [e.userId as string, e]));

    return NextResponse.json({
      data: {
        date,
        personnel: profs.map((prof) => {
          const event = eventByUser.get(prof.id);
          let statut: "PRESENT" | "ABSENT" | "RETARD" = "PRESENT";
          if (event?.type === "ABSENCE_PERSONNEL") statut = "ABSENT";
          if (event?.type === "RETARD_PERSONNEL") statut = "RETARD";
          return {
            id: prof.id,
            nom: nomComplet(prof),
            email: prof.email,
            type: prof.typeProfesseur,
            affectations: byProf.get(prof.id) ?? [],
            statut,
            evenementId: event?.id ?? null,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Erreur personnel préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId } = authResult.user;

    const parsed = saveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Personnel et statut requis" }, { status: 400 });
    }

    const { start, end } = parseDateIso(parsed.data.date ?? null);

    if (parsed.data.all) {
      if (parsed.data.statut !== "PRESENT") {
        return NextResponse.json({ error: "Le marquage groupé n’est disponible que pour Présent" }, { status: 400 });
      }
      await prisma.evenementJour.deleteMany({
        where: {
          ecoleId,
          date: { gte: start, lte: end },
          type: { in: ["ABSENCE_PERSONNEL", "RETARD_PERSONNEL"] },
        },
      });
      return NextResponse.json({ data: { all: true, statut: "PRESENT" } });
    }

    const staff = await prisma.user.findFirst({
      where: { id: parsed.data.userId, ecoleId, role: "PROFESSEUR", deletedAt: null },
    });
    if (!staff) {
      return NextResponse.json({ error: "Ce professeur n’appartient pas à votre établissement" }, { status: 403 });
    }

    await prisma.evenementJour.deleteMany({
      where: {
        ecoleId,
        userId: staff.id,
        date: { gte: start, lte: end },
        type: { in: ["ABSENCE_PERSONNEL", "RETARD_PERSONNEL"] },
      },
    });

    if (parsed.data.statut !== "PRESENT") {
      await prisma.evenementJour.create({
        data: {
          ecoleId,
          date: start,
          type: parsed.data.statut === "ABSENT" ? "ABSENCE_PERSONNEL" : "RETARD_PERSONNEL",
          userId: staff.id,
          auteurId: id,
          detail: parsed.data.detail?.trim() || null,
        },
      });
    }

    return NextResponse.json({ data: { userId: staff.id, statut: parsed.data.statut } });
  } catch (error) {
    console.error("Erreur statut personnel préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
