import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { nomComplet, parseDateIso } from "@/lib/direction";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
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
    console.error("Erreur personnel direction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;
    return NextResponse.json(
      { error: "La saisie des absences du personnel est réservée au préfet" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Erreur statut personnel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
