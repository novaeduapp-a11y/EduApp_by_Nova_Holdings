import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { nomComplet, parseDateIso } from "@/lib/direction";
import { FAMILLES_CYCLE } from "@/lib/constants";
import { fanOutCommunique } from "@/lib/communiques";

const perturbationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  titre: z.string().min(3).max(120),
  detail: z.string().max(1000).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;
    const { date, start, end } = parseDateIso(request.nextUrl.searchParams.get("date"));

    const [ecole, totalEleves, absencesEleves, evenements, totalProfs, cycles, alertes, agenda] = await Promise.all([
      prisma.ecole.findUnique({ where: { id: ecoleId } }),
      prisma.eleve.count({ where: { ecoleId, deletedAt: null, actif: true } }),
      prisma.absence.findMany({
        where: {
          deletedAt: null,
          dateAbsence: { gte: start, lte: end },
          eleve: { ecoleId, deletedAt: null },
        },
        include: {
          eleve: { include: { classe: { select: { nom: true, niveau: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.evenementJour.findMany({
        where: { ecoleId, date: { gte: start, lte: end } },
        include: { user: { select: { id: true, prenom: true, nom: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({
        where: { ecoleId, role: "PROFESSEUR", actif: true, deletedAt: null },
      }),
      prisma.classe.findMany({
        where: { ecoleId },
        include: {
          cycle: { select: { famille: true } },
          _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
        },
      }),
      prisma.communique.findMany({
        where: { ecoleId, urgent: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, titre: true, createdAt: true },
      }),
      prisma.noteAgenda.findMany({
        where: { ecoleId, date: { gte: start, lte: end } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, titre: true, corps: true },
      }),
    ]);

    const absentsEleves = absencesEleves.filter((a) => !/retard/i.test(a.motif ?? ""));
    const retardsEleves = absencesEleves.filter((a) => /retard/i.test(a.motif ?? ""));
    const absentsPers = evenements.filter((e) => e.type === "ABSENCE_PERSONNEL");
    const retardsPers = evenements.filter((e) => e.type === "RETARD_PERSONNEL");
    const perturbations = evenements.filter((e) => e.type === "PERTURBATION");

    const parCycle = (Object.keys(FAMILLES_CYCLE) as Array<keyof typeof FAMILLES_CYCLE>).map((famille) => {
      const classes = cycles.filter((c) => c.cycle?.famille === famille);
      return {
        famille,
        label: FAMILLES_CYCLE[famille].label,
        classes: classes.length,
        eleves: classes.reduce((sum, c) => sum + c._count.eleves, 0),
      };
    });

    return NextResponse.json({
      data: {
        date,
        ecole: ecole ? { nom: ecole.nom, ville: ecole.ville } : null,
        eleves: {
          total: totalEleves,
          absents: absentsEleves.length,
          retards: retardsEleves.length,
        },
        personnel: {
          total: totalProfs,
          absents: absentsPers.length,
          retards: retardsPers.length,
          presents: Math.max(0, totalProfs - absentsPers.length - retardsPers.length),
        },
        cycles: parCycle,
        listes: {
          absencesEleves: absentsEleves.map((a) => ({
            id: a.id,
            eleve: `${a.eleve.prenom} ${a.eleve.nom}`,
            classe: a.eleve.classe.nom,
            motif: a.motif,
          })),
          retardsEleves: retardsEleves.map((a) => ({
            id: a.id,
            eleve: `${a.eleve.prenom} ${a.eleve.nom}`,
            classe: a.eleve.classe.nom,
            motif: a.motif,
          })),
          absencesPersonnel: absentsPers.map((e) => ({
            id: e.id,
            nom: e.user ? nomComplet(e.user) : "Personnel",
            detail: e.detail,
          })),
          retardsPersonnel: retardsPers.map((e) => ({
            id: e.id,
            nom: e.user ? nomComplet(e.user) : "Personnel",
            detail: e.detail,
          })),
          perturbations: perturbations.map((e) => ({
            id: e.id,
            titre: e.titre ?? "Perturbation",
            detail: e.detail,
          })),
        },
        alertes: alertes.map((item) => ({
          id: item.id,
          titre: item.titre,
          date: item.createdAt.toISOString(),
        })),
        agenda: agenda.map((item) => ({
          id: item.id,
          titre: item.titre,
          corps: item.corps,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur bilan direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { id, ecoleId } = authResult.user;

    const parsed = perturbationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Titre de perturbation requis" }, { status: 400 });
    }

    const { date, start } = parseDateIso(parsed.data.date ?? null);
    const evenement = await prisma.evenementJour.create({
      data: {
        ecoleId,
        date: start,
        type: "PERTURBATION",
        titre: parsed.data.titre.trim(),
        detail: parsed.data.detail?.trim() || null,
        auteurId: id,
      },
    });

    const envoyes = await fanOutCommunique({
      communiqueId: evenement.id,
      ecoleId,
      familleCycle: null,
      destinataires: "TOUS",
      titre: parsed.data.titre.trim(),
      corps: parsed.data.detail?.trim() || "Perturbation signalée par la direction.",
      urgent: true,
    });

    return NextResponse.json({ data: { id: evenement.id, date, envoyes } }, { status: 201 });
  } catch (error) {
    console.error("Erreur saisie perturbation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    const { ecoleId } = authResult.user;
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Événement manquant" }, { status: 400 });

    const existing = await prisma.evenementJour.findFirst({
      where: { id, ecoleId, type: "PERTURBATION" },
    });
    if (!existing) {
      return NextResponse.json({ error: "Événement introuvable dans votre établissement" }, { status: 403 });
    }

    await prisma.evenementJour.delete({ where: { id } });
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Erreur suppression événement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
