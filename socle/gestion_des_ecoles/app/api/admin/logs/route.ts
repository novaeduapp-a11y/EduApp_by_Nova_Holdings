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
    const ecoleId = request.nextUrl.searchParams.get("ecoleId")?.trim() ?? "";
    const dateDebut = request.nextUrl.searchParams.get("dateDebut")?.trim() ?? "";
    const dateFin = request.nextUrl.searchParams.get("dateFin")?.trim() ?? "";

    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (dateDebut) {
      const start = new Date(`${dateDebut}T00:00:00`);
      if (!Number.isNaN(start.getTime())) createdAtFilter.gte = start;
    }
    if (dateFin) {
      const end = new Date(`${dateFin}T23:59:59`);
      if (!Number.isNaN(end.getTime())) createdAtFilter.lte = end;
    }

    const logs = await prisma.logActivite.findMany({
      where: {
        ...(action ? { action } : {}),
        ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
        ...(role && ROLES.includes(role as Role)
          ? { user: { role: role as Role, ...(ecoleId ? { ecoleId } : {}) } }
          : ecoleId
            ? { user: { ecoleId } }
            : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            ecoleId: true,
            ecole: { select: { id: true, nom: true } },
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
                ecoleId: log.user.ecoleId,
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
    const ecoles = await prisma.ecole.findMany({
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json({ data: { logs: rows, actions, ecoles } });
  } catch (error) {
    console.error("Erreur admin logs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
