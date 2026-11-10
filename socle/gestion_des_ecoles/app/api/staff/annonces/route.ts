import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/request-auth";

/** Annonces NOVA actives destinées aux directions / préfecture. */
export async function GET() {
  try {
    const authResult = await requireStaff(["DIRECTEUR", "PREFET"]);
    if (!authResult.ok) return authResult.response;

    const ecoleId = authResult.user.ecoleId;
    const annonces = await prisma.annonceNova.findMany({
      where: {
        actif: true,
        OR: [{ ecoleId: null }, ...(ecoleId ? [{ ecoleId }] : [])],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        titre: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      data: annonces.map((annonce) => ({
        id: annonce.id,
        titre: annonce.titre,
        message: annonce.message,
        createdAt: annonce.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur GET staff annonces:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
