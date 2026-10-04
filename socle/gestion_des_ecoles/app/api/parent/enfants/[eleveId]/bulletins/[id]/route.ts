import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";
import { buildBulletinData } from "@/lib/bulletins/build-bulletin";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { eleveId: string; id: string } }
) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const lien = await prisma.parentEleve.findUnique({
      where: {
        parentId_eleveId: {
          parentId: authResult.user.id,
          eleveId: params.eleveId,
        },
      },
    });
    if (!lien) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const bulletin = await prisma.bulletin.findFirst({
      where: { id: params.id, eleveId: params.eleveId, deletedAt: null },
    });
    if (!bulletin) {
      return NextResponse.json({ error: "Bulletin introuvable" }, { status: 404 });
    }

    const data = await buildBulletinData(bulletin.id);
    if (!data) {
      return NextResponse.json({ error: "Impossible de composer le bulletin" }, { status: 500 });
    }

    const preview = { ...data };
    delete preview.qrCodeUrl;
    return NextResponse.json({ data: { id: bulletin.id, ...preview } });
  } catch (error) {
    console.error("Erreur lecture bulletin parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
