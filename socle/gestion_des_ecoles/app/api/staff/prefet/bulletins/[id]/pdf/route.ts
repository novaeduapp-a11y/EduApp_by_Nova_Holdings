import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requirePrefet } from "@/lib/request-auth";
import { familleWhere, forbiddenCycle } from "@/lib/prefet-scope";
import { buildBulletinData } from "@/lib/bulletins/build-bulletin";
import { BulletinPDF } from "@/lib/pdf/bulletin-template";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const bulletin = await prisma.bulletin.findFirst({
      where: {
        id: params.id,
        eleve: { classe: familleWhere(ecoleId, familleCycle) },
      },
    });
    if (!bulletin) return forbiddenCycle();

    const data = await buildBulletinData(bulletin.id);
    if (!data) {
      return NextResponse.json({ error: "Bulletin introuvable" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = await renderToBuffer(createElement(BulletinPDF, { data }) as any);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bulletin-${bulletin.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur PDF bulletin préfet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
