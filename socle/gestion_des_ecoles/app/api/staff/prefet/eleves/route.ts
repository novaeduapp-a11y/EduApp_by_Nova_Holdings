import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";
import { generateMatricule } from "@/lib/constants";
import { lierParentAEleve } from "@/lib/parent-lien";

const createSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const classeId = request.nextUrl.searchParams.get("classeId");

    const eleves = await prisma.eleve.findMany({
      where: {
        deletedAt: null,
        classe: familleWhere(ecoleId, familleCycle),
        ...(classeId ? { classeId } : {}),
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        matricule: true,
        sexe: true,
        dateNaissance: true,
        lieuNaissance: true,
        adresse: true,
        nomTuteur: true,
        telephoneTuteur: true,
        emailParent: true,
        groupeSanguin: true,
        allergies: true,
        telephoneSecours: true,
        lienTuteur: true,
        classe: { select: { id: true, nom: true, niveau: true } },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return NextResponse.json({
      data: eleves.map((eleve) => ({
        ...eleve,
        dateNaissance: eleve.dateNaissance.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur élèves préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Identité, tuteur, e-mail parent et classe sont requis" },
        { status: 400 }
      );
    }

    const classe = await prisma.classe.findFirst({
      where: { id: parsed.data.classeId, ...familleWhere(ecoleId, familleCycle) },
      include: { _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } } },
    });
    if (!classe) return forbiddenCycle();
    if (classe._count.eleves >= classe.effectifMax) {
      return NextResponse.json(
        { error: `Effectif max atteint (${classe.effectifMax}) pour ${classe.nom}` },
        { status: 409 }
      );
    }

    const count = await prisma.eleve.count({
      where: { matricule: { startsWith: `${new Date().getFullYear()}${classe.niveau}` } },
    });
    const matricule = generateMatricule(classe.niveau, count + 1);

    const eleve = await prisma.eleve.create({
      data: {
        nom: parsed.data.nom,
        prenom: parsed.data.prenom,
        dateNaissance: new Date(parsed.data.dateNaissance),
        lieuNaissance: parsed.data.lieuNaissance || null,
        sexe: parsed.data.sexe,
        classeId: classe.id,
        ecoleId,
        matricule,
        nomTuteur: parsed.data.nomTuteur,
        telephoneTuteur: parsed.data.telephoneTuteur,
        emailParent: parsed.data.emailParent,
        adresse: parsed.data.adresse || null,
        groupeSanguin: parsed.data.groupeSanguin || null,
        allergies: parsed.data.allergies || null,
        telephoneSecours: parsed.data.telephoneSecours || null,
        lienTuteur: parsed.data.lienTuteur,
      },
    });

    const parent = await lierParentAEleve({
      ecoleId,
      eleveId: eleve.id,
      emailParent: parsed.data.emailParent,
      nomTuteur: parsed.data.nomTuteur,
      telephoneTuteur: parsed.data.telephoneTuteur,
      relation: parsed.data.lienTuteur,
    });
    if (!parent.ok) {
      await prisma.eleve.delete({ where: { id: eleve.id } });
      return NextResponse.json({ error: parent.error }, { status: 409 });
    }

    return NextResponse.json(
      {
        data: {
          id: eleve.id,
          matricule: eleve.matricule,
          prenom: eleve.prenom,
          nom: eleve.nom,
          parent: {
            email: parent.email,
            cree: parent.cree,
            motDePasseTemporaire: parent.cree ? parent.motDePasseTemporaire : null,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur inscription préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
