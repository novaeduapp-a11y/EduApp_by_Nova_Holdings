import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { nomComplet, parseDateIso } from "@/lib/direction";
import { familleWhere, profTypeWhere } from "@/lib/prefet-scope";

const saveSchema = z
  .object({
    userId: z.string().min(1).optional(),
    all: z.boolean().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    statut: z.enum(["PRESENT", "ABSENT", "RETARD"]).optional(),
    detail: z.string().max(200).optional().nullable(),
    lignes: z
      .array(
        z.object({
          userId: z.string().min(1),
          statut: z.enum(["PRESENT", "ABSENT", "RETARD"]),
        })
      )
      .optional(),
  })
  .refine((data) => data.all === true || Boolean(data.userId) || Boolean(data.lignes?.length), {
    message: "Personnel requis",
  });

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const { date, start, end } = parseDateIso(request.nextUrl.searchParams.get("date"));

    const [profsTous, evenements] = await Promise.all([
      prisma.user.findMany({
        where: {
          ecoleId,
          role: "PROFESSEUR",
          actif: true,
          deletedAt: null,
          ...profTypeWhere(familleCycle),
        },
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

    const liensCycle = await prisma.classeMatiere.findMany({
      where: {
        professeurId: { in: profsTous.map((p) => p.id) },
        classe: familleWhere(ecoleId, familleCycle),
      },
      select: { professeurId: true },
    });
    const dansLeCycle = new Set(liensCycle.map((row) => row.professeurId).filter(Boolean));
    const profs =
      familleCycle === "PRIMAIRE"
        ? profsTous
        : profsTous.filter((prof) => dansLeCycle.has(prof.id));

    const affectations = await prisma.classeMatiere.findMany({
      where: { professeurId: { in: profs.map((p) => p.id) }, classe: familleWhere(ecoleId, familleCycle) },
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

    const eventsByUser = new Map<string, typeof evenements>();
    for (const event of evenements) {
      if (!event.userId) continue;
      const list = eventsByUser.get(event.userId) ?? [];
      list.push(event);
      eventsByUser.set(event.userId, list);
    }

    return NextResponse.json({
      data: {
        date,
        verrouille: evenements.length > 0,
        personnel: profs.map((prof) => {
          const events = eventsByUser.get(prof.id) ?? [];
          const hasAbs = events.some((e) => e.type === "ABSENCE_PERSONNEL");
          const hasRetard = events.some((e) => e.type === "RETARD_PERSONNEL");
          let statut: "PRESENT" | "ABSENT" | "RETARD" = "PRESENT";
          if (hasAbs) statut = "ABSENT";
          else if (hasRetard) statut = "RETARD";
          return {
            id: prof.id,
            nom: nomComplet(prof),
            email: prof.email,
            type: prof.typeProfesseur,
            affectations: byProf.get(prof.id) ?? [],
            statut,
            evenementId: events[0]?.id ?? null,
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

    const deja = await prisma.evenementJour.count({
      where: {
        ecoleId,
        date: { gte: start, lte: end },
        type: { in: ["ABSENCE_PERSONNEL", "RETARD_PERSONNEL"] },
      },
    });
    if (deja > 0 && parsed.data.lignes) {
      return NextResponse.json(
        { error: "La liste du personnel est déjà enregistrée pour cette date (définitif)." },
        { status: 409 }
      );
    }

    const writeStatut = async (
      userId: string,
      statut: "PRESENT" | "ABSENT" | "RETARD",
      detail?: string | null
    ) => {
      const staff = await prisma.user.findFirst({
        where: { id: userId, ecoleId, role: "PROFESSEUR", deletedAt: null },
      });
      if (!staff) return false;
      await prisma.evenementJour.deleteMany({
        where: {
          ecoleId,
          userId: staff.id,
          date: { gte: start, lte: end },
          type: { in: ["ABSENCE_PERSONNEL", "RETARD_PERSONNEL"] },
        },
      });
      if (statut === "PRESENT") return true;
      const types =
        statut === "ABSENT"
          ? (["ABSENCE_PERSONNEL"] as const)
          : (["RETARD_PERSONNEL"] as const);
      for (const type of types) {
        await prisma.evenementJour.create({
          data: {
            ecoleId,
            date: start,
            type,
            userId: staff.id,
            auteurId: id,
            detail: detail?.trim() || null,
          },
        });
      }
      return true;
    };

    if (parsed.data.lignes?.length) {
      for (const ligne of parsed.data.lignes) {
        const ok = await writeStatut(ligne.userId, ligne.statut);
        if (!ok) {
          return NextResponse.json({ error: "Un professeur n’appartient pas à votre établissement" }, { status: 403 });
        }
      }
      return NextResponse.json({ data: { saved: parsed.data.lignes.length } });
    }

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

    if (!parsed.data.userId || !parsed.data.statut) {
      return NextResponse.json({ error: "Personnel et statut requis" }, { status: 400 });
    }

    const ok = await writeStatut(parsed.data.userId, parsed.data.statut, parsed.data.detail);
    if (!ok) {
      return NextResponse.json({ error: "Ce professeur n’appartient pas à votre établissement" }, { status: 403 });
    }

    return NextResponse.json({ data: { userId: parsed.data.userId, statut: parsed.data.statut } });
  } catch (error) {
    console.error("Erreur statut personnel préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
