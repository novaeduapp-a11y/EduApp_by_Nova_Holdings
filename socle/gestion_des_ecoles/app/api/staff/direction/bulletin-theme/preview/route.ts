import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { BulletinPDF } from "@/lib/pdf/bulletin-template";
import { buildSampleBulletinData } from "@/lib/bulletins/sample-preview";
import { normalizeBulletinTheme } from "@/lib/bulletins/theme";

export const runtime = "nodejs";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const bodySchema = z
  .object({
    logoUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
    couleurPrimaire: hexColor.optional(),
    couleurSecondaire: hexColor.optional(),
    lignesEntete: z.array(z.string().max(120)).max(4).optional(),
    lignesPied: z.array(z.string().max(160)).max(3).optional(),
    labelsSignatures: z.array(z.string().max(80)).max(3).optional(),
    afficherPhoto: z.boolean().optional(),
    afficherAbsences: z.boolean().optional(),
    afficherObservationConseil: z.boolean().optional(),
  })
  .optional();

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;

    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const [ecole, stored] = await Promise.all([
      prisma.ecole.findUnique({
        where: { id: authResult.user.ecoleId },
        select: {
          nom: true,
          nomOfficiel: true,
          sigle: true,
          adresse: true,
          telephone: true,
          email: true,
          ville: true,
        },
      }),
      prisma.bulletinTheme.findUnique({ where: { ecoleId: authResult.user.ecoleId } }),
    ]);

    if (!ecole) {
      return NextResponse.json({ error: "École introuvable" }, { status: 404 });
    }

    const overrides = parsed.data ?? {};
    const base = normalizeBulletinTheme(stored);
    const theme = normalizeBulletinTheme({
      ...base,
      ...overrides,
      logoUrl:
        overrides.logoUrl === undefined
          ? base.logoUrl
          : overrides.logoUrl === ""
            ? null
            : overrides.logoUrl,
      lignesEntete: overrides.lignesEntete ?? base.lignesEntete,
      lignesPied: overrides.lignesPied ?? base.lignesPied,
      labelsSignatures: overrides.labelsSignatures ?? base.labelsSignatures,
    });

    const data = buildSampleBulletinData({ ecole, theme });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = await renderToBuffer(createElement(BulletinPDF, { data }) as any);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="apercu-bulletin.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erreur aperçu PDF bulletin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
