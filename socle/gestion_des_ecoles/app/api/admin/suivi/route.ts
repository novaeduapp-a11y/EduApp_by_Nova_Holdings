import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["ADMIN", "DIRECTEUR", "PREFET", "PROFESSEUR", "PARENT", "ELEVE"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const role = request.nextUrl.searchParams.get("role")?.trim() ?? "";
    const actif = request.nextUrl.searchParams.get("actif")?.trim() ?? "";

    const [users, lastLogs] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          ...(role && ROLES.includes(role as Role) ? { role: role as Role } : {}),
          ...(actif === "actif" ? { actif: true } : {}),
          ...(actif === "inactif" ? { actif: false } : {}),
        },
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
          actif: true,
          createdAt: true,
          ecole: { select: { nom: true, ville: true } },
        },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        take: 800,
      }),
      prisma.logActivite.findMany({
        where: { userId: { not: null } },
        orderBy: { createdAt: "desc" },
        distinct: ["userId"],
        select: {
          userId: true,
          action: true,
          createdAt: true,
          details: true,
        },
      }),
    ]);

    const lastByUser = new Map(lastLogs.map((log) => [log.userId as string, log]));

    const rows = users
      .map((user) => {
        const last = lastByUser.get(user.id);
        const details = (last?.details ?? {}) as Record<string, unknown>;
        return {
          id: user.id,
          nom: `${user.prenom} ${user.nom}`,
          email: user.email,
          role: user.role,
          actif: user.actif,
          ecole: user.ecole ? `${user.ecole.nom}` : null,
          creeLe: user.createdAt.toISOString(),
          derniereAction: last?.action ?? null,
          derniereDate: last?.createdAt.toISOString() ?? null,
          derniereVoie: typeof details.voie === "string" ? details.voie : null,
        };
      })
      .filter((row) => {
        if (!q) return true;
        return `${row.nom} ${row.email} ${row.ecole ?? ""}`.toLowerCase().includes(q);
      });

    return NextResponse.json({
      data: {
        utilisateurs: rows,
        totaux: {
          comptes: rows.length,
          actifs: rows.filter((row) => row.actif).length,
          jamaisConnectes: rows.filter((row) => !row.derniereDate).length,
        },
      },
    });
  } catch (error) {
    console.error("Erreur admin suivi:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
