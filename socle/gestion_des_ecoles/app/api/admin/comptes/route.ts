import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";

const STAFF_ROLES = ["ADMIN", "DIRECTEUR", "PREFET", "PROFESSEUR"] as const;

const createSchema = z.object({
  nom: z.string().min(2).max(80),
  prenom: z.string().min(2).max(80),
  email: z.string().email(),
  telephone: z.string().max(30).optional(),
  role: z.enum(["ADMIN", "DIRECTEUR", "PREFET", "PROFESSEUR"]),
  ecoleId: z.string().min(1).optional().nullable(),
  familleCycle: z.enum(["PRIMAIRE", "COLLEGE", "SECONDAIRE"]).optional().nullable(),
  typeProfesseur: z.enum(["PRIMAIRE", "MATIERE"]).optional().nullable(),
  password: z.string().min(8).optional(),
  matiereIds: z.array(z.string().min(1)).optional(),
});

function roleError(role: (typeof STAFF_ROLES)[number], ecoleId?: string | null, familleCycle?: string | null, typeProfesseur?: string | null) {
  if (role === "ADMIN") return null;
  if (!ecoleId) return "Rattachez ce compte à un établissement";
  if (role === "PREFET" && !familleCycle) return "Choisissez le cycle du préfet (primaire, collège ou secondaire)";
  if (role === "PROFESSEUR" && !typeProfesseur) return "Précisez instituteur (primaire) ou professeur de matière";
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const ecoleId = request.nextUrl.searchParams.get("ecoleId") || "";
    const role = request.nextUrl.searchParams.get("role") || "";

    const [users, matieres] = await Promise.all([
      prisma.user.findMany({
      where: {
        deletedAt: null,
        role: role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])
          ? (role as (typeof STAFF_ROLES)[number])
          : { in: [...STAFF_ROLES] },
        ...(ecoleId ? { ecoleId } : {}),
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        actif: true,
        ecoleId: true,
        familleCycle: true,
        typeProfesseur: true,
        ecole: { select: { id: true, nom: true, ville: true } },
        professeurMatieres: { select: { matiereId: true } },
      },
      orderBy: [{ role: "asc" }, { nom: "asc" }, { prenom: "asc" }],
      take: 300,
    }),
      prisma.matiere.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    ]);

    return NextResponse.json({
      data: users.map((user) => ({
        ...user,
        matiereIds: user.professeurMatieres.map((row) => row.matiereId),
      })),
      matieres,
    });
  } catch (error) {
    console.error("Erreur admin comptes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Identité, e-mail et rôle sont requis" }, { status: 400 });
    }

    const ecoleId = parsed.data.role === "ADMIN" ? null : parsed.data.ecoleId || null;
    const familleCycle = parsed.data.role === "PREFET" ? parsed.data.familleCycle || null : null;
    const typeProfesseur = parsed.data.role === "PROFESSEUR" ? parsed.data.typeProfesseur || null : null;
    const invalid = roleError(parsed.data.role, ecoleId, familleCycle, typeProfesseur);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    if (ecoleId) {
      const ecole = await prisma.ecole.findUnique({
        where: { id: ecoleId },
        include: { cycles: { select: { famille: true } } },
      });
      if (!ecole) return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
      if (familleCycle && ecole.cycles.length > 0 && !ecole.cycles.some((c) => c.famille === familleCycle)) {
        return NextResponse.json(
          { error: "Ce cycle n’est pas ouvert dans l’établissement" },
          { status: 400 }
        );
      }
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Cet e-mail est déjà utilisé" }, { status: 409 });
    }

    const motDePasseTemporaire = parsed.data.password?.trim() || randomBytes(5).toString("hex");
    const user = await prisma.user.create({
      data: {
        nom: parsed.data.nom.trim(),
        prenom: parsed.data.prenom.trim(),
        email,
        telephone: parsed.data.telephone?.trim() || null,
        password: await bcrypt.hash(motDePasseTemporaire, 10),
        role: parsed.data.role,
        ecoleId,
        familleCycle,
        typeProfesseur,
        actif: true,
        twoFactorEnabled: parsed.data.role === "DIRECTEUR",
      },
      select: {
        id: true,
        email: true,
        role: true,
        prenom: true,
        ecole: { select: { nom: true } },
      },
    });

    if (user.role === "PROFESSEUR" && typeProfesseur === "MATIERE" && parsed.data.matiereIds?.length) {
      const { remplacerCompetences } = await import("@/lib/prof-competences");
      await remplacerCompetences(user.id, parsed.data.matiereIds);
    }

    await logActivite({
      userId: authResult.user.id,
      action: "compte_cree",
      table: "users",
      recordId: user.id,
      details: { email: user.email, role: user.role, ecoleId },
    });

    const { sendWelcomeAccountEmail } = await import("@/lib/email");
    const mailed = await sendWelcomeAccountEmail({
      to: user.email,
      prenom: user.prenom,
      role: user.role,
      temporaryPassword: motDePasseTemporaire,
      ecoleNom: user.ecole?.nom,
    });

    return NextResponse.json(
      {
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          motDePasseTemporaire,
          emailed: mailed.ok === true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création compte:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
