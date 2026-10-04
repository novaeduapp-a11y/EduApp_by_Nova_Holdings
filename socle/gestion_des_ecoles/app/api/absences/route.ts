import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkEleveAccess, requireProfesseur } from "@/lib/unified-auth";
import { z } from "zod";

const createAbsenceSchema = z.object({
  eleveId: z.string().min(1, "L'élève est requis"),
  dateAbsence: z.string(),
  periode: z.enum(["MATIN", "APRES_MIDI", "JOURNEE"]).default("JOURNEE"),
  dureeHeures: z.number().min(0).optional(),
  matiereId: z.string().optional(),
  justifiee: z.boolean().default(false),
  motif: z.string().optional(),
  document: z.string().optional(),
});

// GET /api/absences - Liste des absences (avec isolation école/classe)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["ADMIN", "PROFESSEUR", "PREFET", "DIRECTEUR"]);
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const eleveId = searchParams.get("eleveId");
    const classeId = searchParams.get("classeId");
    const justifiee = searchParams.get("justifiee");
    const dateDebut = searchParams.get("dateDebut");
    const dateFin = searchParams.get("dateFin");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Isolation par école
    if (user.role !== "ADMIN" && user.ecoleId) {
      where.eleve = { ecoleId: user.ecoleId };
    }

    // Pour les préfets, filtrer par cycle
    if (user.role === "PREFET" && "familleCycle" in user && user.familleCycle) {
      where.eleve = {
        ...(where.eleve ?? {}),
        classe: { cycle: { famille: user.familleCycle } },
      };
    }

    // Pour les professeurs, filtrer par leurs classes
    if (user.role === "PROFESSEUR" && "affectations" in user && user.affectations) {
      const classeIds = [...new Set(user.affectations.map((a: { classeId: string }) => a.classeId))];
      if (classeIds.length > 0) {
        where.eleve = {
          ...(where.eleve ?? {}),
          classeId: { in: classeIds },
        };
      } else {
        where.id = { in: [] }; // Aucune classe accessible
      }
    }
    
    if (eleveId) where.eleveId = eleveId;
    if (classeId) where.eleve = { ...(where.eleve ?? {}), classeId };
    if (justifiee !== null && justifiee !== "") where.justifiee = justifiee === "true";
    if (dateDebut || dateFin) {
      where.dateAbsence = {};
      if (dateDebut) where.dateAbsence.gte = new Date(dateDebut);
      if (dateFin) where.dateAbsence.lte = new Date(dateFin);
    }

    const [absences, total] = await Promise.all([
      prisma.absence.findMany({
        where,
        include: {
          eleve: {
            select: { id: true, nom: true, prenom: true, matricule: true, classe: { select: { id: true, nom: true } } },
          },
          matiere: { select: { id: true, nom: true } },
        },
        orderBy: { dateAbsence: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.absence.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: absences,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur GET /api/absences:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// POST /api/absences - Créer une absence (avec validation accès élève)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["ADMIN", "PROFESSEUR", "PREFET", "DIRECTEUR"]);
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const body = await request.json();
    const validation = createAbsenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Données invalides", details: validation.error.issues } },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérifier l'accès à cet élève
    const hasAccess = await checkEleveAccess(
      user.id,
      user.role,
      user.ecoleId,
      data.eleveId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Accès refusé à cet élève" } },
        { status: 403 }
      );
    }

    const absence = await prisma.absence.create({
      data: {
        eleveId: data.eleveId,
        dateAbsence: new Date(data.dateAbsence),
        periode: data.periode,
        dureeHeures: data.dureeHeures,
        matiereId: data.matiereId || null,
        justifiee: data.justifiee,
        motif: data.motif,
        document: data.document,
        createdBy: user.id,
      },
      include: {
        eleve: { select: { id: true, nom: true, prenom: true, matricule: true, classe: { select: { id: true, nom: true } } } },
        matiere: { select: { id: true, nom: true } },
      },
    });

    return NextResponse.json({ success: true, data: absence }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/absences:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
