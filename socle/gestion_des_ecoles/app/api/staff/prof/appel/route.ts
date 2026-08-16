import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import {
  canAccessClasse,
  dayBounds,
  forbiddenClasse,
  getProfAssignments,
} from "@/lib/prof-scope";

const saveSchema = z.object({
  classeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lignes: z.array(
    z.object({
      eleveId: z.string().min(1),
      statut: z.enum(["PRESENT", "ABSENT", "RETARD"]),
    })
  ),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get("classeId");
    const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    if (!classeId) {
      return NextResponse.json({ error: "Classe requise" }, { status: 400 });
    }
    if (!canAccessClasse(assignments, classeId)) return forbiddenClasse();

    const classe = assignments.find((item) => item.classeId === classeId);
    const { start, end } = dayBounds(date);
    const [eleves, absences] = await Promise.all([
      prisma.eleve.findMany({
        where: { classeId, deletedAt: null, actif: true },
        select: { id: true, nom: true, prenom: true, matricule: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.absence.findMany({
        where: {
          deletedAt: null,
          dateAbsence: { gte: start, lte: end },
          eleve: { classeId },
        },
      }),
    ]);

    const byEleve = new Map(absences.map((item) => [item.eleveId, item]));

    return NextResponse.json({
      data: {
        classeId,
        classeNom: classe?.classeNom ?? "",
        date,
        eleves: eleves.map((eleve) => {
          const absence = byEleve.get(eleve.id);
          let statut: "PRESENT" | "ABSENT" | "RETARD" = "PRESENT";
          if (absence) {
            statut = /retard/i.test(absence.motif ?? "") ? "RETARD" : "ABSENT";
          }
          return {
            eleveId: eleve.id,
            nom: eleve.nom,
            prenom: eleve.prenom,
            matricule: eleve.matricule,
            statut,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Erreur feuille d'appel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const parsed = saveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    const { classeId, date, lignes } = parsed.data;
    if (!canAccessClasse(assignments, classeId)) return forbiddenClasse();

    const eleves = await prisma.eleve.findMany({
      where: { classeId, deletedAt: null, actif: true },
      select: { id: true },
    });
    const allowed = new Set(eleves.map((eleve) => eleve.id));
    for (const ligne of lignes) {
      if (!allowed.has(ligne.eleveId)) {
        return NextResponse.json({ error: "Élève hors de cette classe" }, { status: 403 });
      }
    }

    const { start, end } = dayBounds(date);
    const dateAbsence = start;

    await prisma.$transaction(async (tx) => {
      for (const ligne of lignes) {
        const existing = await tx.absence.findFirst({
          where: {
            eleveId: ligne.eleveId,
            dateAbsence: { gte: start, lte: end },
            deletedAt: null,
          },
        });

        if (ligne.statut === "PRESENT") {
          if (existing) {
            await tx.absence.update({
              where: { id: existing.id },
              data: { deletedAt: new Date() },
            });
          }
          continue;
        }

        const motif = ligne.statut === "RETARD" ? "Retard" : "Absence";
        if (existing) {
          await tx.absence.update({
            where: { id: existing.id },
            data: { motif, periode: "JOURNEE" },
          });
        } else {
          await tx.absence.create({
            data: {
              eleveId: ligne.eleveId,
              dateAbsence,
              periode: "JOURNEE",
              motif,
              createdBy: authResult.user.id,
            },
          });
        }
      }
    });

    return NextResponse.json({ data: { saved: lignes.length } });
  } catch (error) {
    console.error("Erreur enregistrement appel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
