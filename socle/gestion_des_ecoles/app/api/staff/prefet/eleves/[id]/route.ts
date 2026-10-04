import { NextRequest, NextResponse } from "next/server";
import type { FamilleCycle } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";
import { lierParentAEleve } from "@/lib/parent-lien";

const updateSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  dateNaissance: z.string().min(4),
  lieuNaissance: z.string().optional(),
  sexe: z.enum(["M", "F"]),
  classeId: z.string().min(1),
  nomTuteur: z.string().min(2),
  telephoneTuteur: z.string().min(6),
  emailParent: z.string().email(),
  adresse: z.string().optional(),
  groupeSanguin: z.string().max(8).optional(),
  allergies: z.string().max(200).optional(),
  telephoneSecours: z.string().max(20).optional(),
  lienTuteur: z.enum(["pere", "mere", "tuteur"]).default("tuteur"),
});

async function eleveDuCycle(id: string, ecoleId: string, familleCycle: FamilleCycle) {
  return prisma.eleve.findFirst({
    where: {
      id,
      deletedAt: null,
      classe: familleWhere(ecoleId, familleCycle),
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const eleve = await prisma.eleve.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        classe: familleWhere(ecoleId, familleCycle),
      },
      include: {
        classe: { select: { id: true, nom: true, niveau: true } },
        absences: {
          where: { deletedAt: null },
          orderBy: { dateAbsence: "desc" },
          take: 8,
          select: { id: true, dateAbsence: true, periode: true, justifiee: true, motif: true },
        },
      },
    });
    if (!eleve) return forbiddenCycle();

    return NextResponse.json({
      data: {
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        sexe: eleve.sexe,
        dateNaissance: eleve.dateNaissance,
        lieuNaissance: eleve.lieuNaissance,
        adresse: eleve.adresse,
        nomTuteur: eleve.nomTuteur,
        telephoneTuteur: eleve.telephoneTuteur,
        emailParent: eleve.emailParent,
        lienTuteur: eleve.lienTuteur,
        groupeSanguin: eleve.groupeSanguin,
        allergies: eleve.allergies,
        telephoneSecours: eleve.telephoneSecours,
        classe: eleve.classe,
        absences: eleve.absences,
      },
    });
  } catch (error) {
    console.error("Erreur fiche élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Identité, tuteur, e-mail parent et classe sont requis" },
        { status: 400 }
      );
    }

    const existing = await eleveDuCycle(params.id, ecoleId, familleCycle);
    if (!existing) return forbiddenCycle();

    const classe = await prisma.classe.findFirst({
      where: { id: parsed.data.classeId, ...familleWhere(ecoleId, familleCycle) },
      include: { _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } } },
    });
    if (!classe) return forbiddenCycle();

    if (classe.id !== existing.classeId && classe._count.eleves >= classe.effectifMax) {
      return NextResponse.json(
        { error: `Effectif max atteint (${classe.effectifMax}) pour ${classe.nom}` },
        { status: 409 }
      );
    }

    const emailChange = parsed.data.emailParent.trim().toLowerCase() !== (existing.emailParent ?? "").toLowerCase();
    if (emailChange) {
      const parent = await lierParentAEleve({
        ecoleId,
        eleveId: existing.id,
        emailParent: parsed.data.emailParent,
        nomTuteur: parsed.data.nomTuteur,
        telephoneTuteur: parsed.data.telephoneTuteur,
        relation: parsed.data.lienTuteur,
      });
      if (!parent.ok) {
        return NextResponse.json({ error: parent.error }, { status: 409 });
      }
    }

    const eleve = await prisma.eleve.update({
      where: { id: existing.id },
      data: {
        nom: parsed.data.nom,
        prenom: parsed.data.prenom,
        dateNaissance: new Date(parsed.data.dateNaissance),
        lieuNaissance: parsed.data.lieuNaissance || null,
        sexe: parsed.data.sexe,
        classeId: classe.id,
        nomTuteur: parsed.data.nomTuteur,
        telephoneTuteur: parsed.data.telephoneTuteur,
        emailParent: parsed.data.emailParent,
        adresse: parsed.data.adresse || null,
        groupeSanguin: parsed.data.groupeSanguin || null,
        allergies: parsed.data.allergies || null,
        telephoneSecours: parsed.data.telephoneSecours || null,
        lienTuteur: parsed.data.lienTuteur,
      },
      select: { id: true, prenom: true, nom: true, matricule: true },
    });

    return NextResponse.json({ data: eleve });
  } catch (error) {
    console.error("Erreur modification élève préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const existing = await eleveDuCycle(params.id, ecoleId, familleCycle);
    if (!existing) return forbiddenCycle();

    await prisma.eleve.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), actif: false },
    });

    return NextResponse.json({ data: { id: existing.id } });
  } catch (error) {
    console.error("Erreur suppression élève préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
