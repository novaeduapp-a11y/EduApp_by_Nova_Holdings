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
    const action = request.nextUrl.searchParams.get("action")?.trim() ?? "";
    const role = request.nextUrl.searchParams.get("role")?.trim() ?? "";
    const voie = request.nextUrl.searchParams.get("voie")?.trim() ?? "";

    const logs = await prisma.logActivite.findMany({
      where: {
        ...(action ? { action } : {}),
        ...(role && ROLES.includes(role as Role) ? { user: { role: role as Role } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            ecole: { select: { nom: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 400,
    });

    const rows = logs
      .map((log) => {
        const details = (log.details ?? {}) as Record<string, unknown>;
        return {
          id: log.id,
          action: log.action,
          table: log.table,
          recordId: log.recordId,
          details,
          voie: typeof details.voie === "string" ? details.voie : null,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt.toISOString(),
          user: log.user
            ? {
                id: log.user.id,
                nom: `${log.user.prenom} ${log.user.nom}`,
                email: log.user.email,
                role: log.user.role,
                ecole: log.user.ecole?.nom ?? null,
              }
            : null,
        };
      })
      .filter((row) => {
        if (voie && row.voie !== voie) return false;
        if (!q) return true;
        const hay = `${row.action} ${row.user?.nom ?? ""} ${row.user?.email ?? ""} ${row.user?.ecole ?? ""} ${JSON.stringify(row.details)}`.toLowerCase();
        return hay.includes(q);
      });

    const actions = [...new Set(logs.map((log) => log.action))].sort((a, b) => a.localeCompare(b, "fr"));

    return NextResponse.json({ data: { logs: rows, actions } });
  } catch (error) {
    console.error("Erreur admin logs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
