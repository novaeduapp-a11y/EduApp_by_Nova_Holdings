import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/request-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff(["PROFESSEUR", "PREFET", "DIRECTEUR", "ADMIN"]);
    if (!authResult.ok) return authResult.response;

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    let ecoleId = authResult.user.ecoleId;
    if (!ecoleId && authResult.user.role !== "ADMIN") {
      const row = await prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: { ecoleId: true },
      });
      ecoleId = row?.ecoleId ?? null;
    }
    const where = {
      actif: true,
      ...(authResult.user.role === "ADMIN"
        ? q
          ? {
              OR: [
                { nom: { contains: q, mode: "insensitive" as const } },
                { ville: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}
        : {
            id: ecoleId ?? "__none__",
          }),
    };

    const ecoles = await prisma.ecole.findMany({
      where,
      orderBy: [{ ville: "asc" }, { nom: "asc" }],
      take: 20,
    });

    return NextResponse.json({
      data: ecoles.map((e) => ({ id: e.id, nom: e.nom, ville: e.ville })),
    });
  } catch (error) {
    console.error("Erreur écoles:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
