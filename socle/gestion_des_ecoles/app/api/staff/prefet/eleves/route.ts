import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";
import { generateMatricule } from "@/lib/constants";

const createSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  dateNaissance: z.string().min(4),
  lieuNaissance: z.string().optional(),
  sexe: z.enum(["M", "F"]),
  classeId: z.string().min(1),
  nomTuteur: z.string().min(2),
  telephoneTuteur: z.string().min(6),
  emailParent: z.string().email().optional().or(z.literal("")),
  adresse: z.string().optional(),
});

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const eleves = await prisma.eleve.findMany({
      where: { deletedAt: null, classe: familleWhere(ecoleId, familleCycle) },
      select: {
        id: true,
        nom: true,
        prenom: true,
        matricule: true,
        sexe: true,
        dateNaissance: true,
        nomTuteur: true,
        telephoneTuteur: true,
        classe: { select: { id: true, nom: true, niveau: true } },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      take: 200,
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
      return NextResponse.json({ error: "Identité, tuteur et classe sont requis" }, { status: 400 });
    }

    const classe = await prisma.classe.findFirst({
      where: { id: parsed.data.classeId, ...familleWhere(ecoleId, familleCycle) },
    });
    if (!classe) return forbiddenCycle();

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
        emailParent: parsed.data.emailParent || null,
        adresse: parsed.data.adresse || null,
      },
    });

    return NextResponse.json(
      { data: { id: eleve.id, matricule: eleve.matricule, prenom: eleve.prenom, nom: eleve.nom } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur inscription préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
