import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; classeId: string } }
) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const classe = await prisma.classe.findFirst({
      where: { id: params.classeId, ecoleId: params.id },
    });
    if (!classe) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    }
    if (!classe.deletedAt) {
      return NextResponse.json({ error: "Cette classe n’est pas archivée" }, { status: 409 });
    }

    const restored = await prisma.classe.update({
      where: { id: classe.id },
      data: { deletedAt: null },
    });

    await logActivite({
      userId: authResult.user.id,
      action: "classe_restauree",
      table: "classes",
      recordId: restored.id,
      details: { nom: restored.nom, ecoleId: params.id },
    });

    return NextResponse.json({ data: { id: restored.id, nom: restored.nom } });
  } catch (error) {
    console.error("Erreur restauration classe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
