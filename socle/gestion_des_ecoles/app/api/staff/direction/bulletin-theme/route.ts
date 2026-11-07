import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDirecteur } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";
import {
  DEFAULT_BULLETIN_THEME,
  normalizeBulletinTheme,
} from "@/lib/bulletins/theme";
import { isCloudinaryConfigured, uploadBuffer } from "@/lib/cloudinary";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur hex invalide");

const patchSchema = z.object({
  logoUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  couleurPrimaire: hexColor.optional(),
  couleurSecondaire: hexColor.optional(),
  lignesEntete: z.array(z.string().max(120)).max(4).optional(),
  lignesPied: z.array(z.string().max(160)).max(3).optional(),
  labelsSignatures: z.array(z.string().max(80)).min(1).max(3).optional(),
  afficherPhoto: z.boolean().optional(),
  afficherAbsences: z.boolean().optional(),
  afficherObservationConseil: z.boolean().optional(),
});

function serializeTheme(row: Parameters<typeof normalizeBulletinTheme>[0]) {
  return normalizeBulletinTheme(row);
}

async function getOrCreateTheme(ecoleId: string) {
  const existing = await prisma.bulletinTheme.findUnique({ where: { ecoleId } });
  if (existing) return existing;
  return prisma.bulletinTheme.create({
    data: {
      ecoleId,
      couleurPrimaire: DEFAULT_BULLETIN_THEME.couleurPrimaire,
      couleurSecondaire: DEFAULT_BULLETIN_THEME.couleurSecondaire,
      lignesEntete: DEFAULT_BULLETIN_THEME.lignesEntete,
      lignesPied: DEFAULT_BULLETIN_THEME.lignesPied,
      labelsSignatures: [...DEFAULT_BULLETIN_THEME.labelsSignatures],
      afficherPhoto: DEFAULT_BULLETIN_THEME.afficherPhoto,
      afficherAbsences: DEFAULT_BULLETIN_THEME.afficherAbsences,
      afficherObservationConseil: DEFAULT_BULLETIN_THEME.afficherObservationConseil,
      layout: "CLASSIQUE",
    },
  });
}

export async function GET() {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;

    const theme = await getOrCreateTheme(authResult.user.ecoleId);
    const ecole = await prisma.ecole.findUnique({
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
    });

    return NextResponse.json({
      data: {
        theme: serializeTheme(theme),
        ecole,
        cloudinary: isCloudinaryConfigured(),
      },
    });
  } catch (error) {
    console.error("Erreur GET bulletin-theme:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const data: Record<string, unknown> = {};

    if (body.logoUrl !== undefined) {
      data.logoUrl = body.logoUrl === "" ? null : body.logoUrl;
    }
    if (body.couleurPrimaire !== undefined) data.couleurPrimaire = body.couleurPrimaire;
    if (body.couleurSecondaire !== undefined) data.couleurSecondaire = body.couleurSecondaire;
    if (body.lignesEntete !== undefined) {
      data.lignesEntete = body.lignesEntete.map((l) => l.trim()).filter(Boolean).slice(0, 4);
    }
    if (body.lignesPied !== undefined) {
      data.lignesPied = body.lignesPied.map((l) => l.trim()).filter(Boolean).slice(0, 3);
    }
    if (body.labelsSignatures !== undefined) {
      const labels = body.labelsSignatures.map((l) => l.trim()).filter(Boolean).slice(0, 3);
      if (labels.length === 0) {
        return NextResponse.json({ error: "Au moins une signature est requise" }, { status: 400 });
      }
      data.labelsSignatures = labels;
    }
    if (body.afficherPhoto !== undefined) data.afficherPhoto = body.afficherPhoto;
    if (body.afficherAbsences !== undefined) data.afficherAbsences = body.afficherAbsences;
    if (body.afficherObservationConseil !== undefined) {
      data.afficherObservationConseil = body.afficherObservationConseil;
    }

    const theme = await prisma.bulletinTheme.upsert({
      where: { ecoleId: authResult.user.ecoleId },
      create: {
        ecoleId: authResult.user.ecoleId,
        couleurPrimaire: DEFAULT_BULLETIN_THEME.couleurPrimaire,
        couleurSecondaire: DEFAULT_BULLETIN_THEME.couleurSecondaire,
        lignesEntete: DEFAULT_BULLETIN_THEME.lignesEntete,
        lignesPied: DEFAULT_BULLETIN_THEME.lignesPied,
        labelsSignatures: [...DEFAULT_BULLETIN_THEME.labelsSignatures],
        ...data,
      },
      update: data,
    });

    await logActivite({
      userId: authResult.user.id,
      action: "bulletin_theme_maj",
      table: "bulletin_themes",
      details: { ecoleId: authResult.user.ecoleId, champs: Object.keys(data) },
    });

    return NextResponse.json({ data: serializeTheme(theme) });
  } catch (error) {
    console.error("Erreur PATCH bulletin-theme:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Upload logo indisponible (Cloudinary non configuré). Utilisez une URL." },
        { status: 503 }
      );
    }

    const form = await request.formData();
    const file = form.get("logo");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier logo manquant" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadBuffer({
      buffer,
      mimeType: file.type || "image/png",
      folder: "ecoles",
      publicId: `logo-${authResult.user.ecoleId}`,
      filename: file.name,
    });

    const theme = await prisma.bulletinTheme.upsert({
      where: { ecoleId: authResult.user.ecoleId },
      create: {
        ecoleId: authResult.user.ecoleId,
        logoUrl: uploaded.secureUrl,
        couleurPrimaire: DEFAULT_BULLETIN_THEME.couleurPrimaire,
        couleurSecondaire: DEFAULT_BULLETIN_THEME.couleurSecondaire,
        lignesEntete: DEFAULT_BULLETIN_THEME.lignesEntete,
        lignesPied: DEFAULT_BULLETIN_THEME.lignesPied,
        labelsSignatures: [...DEFAULT_BULLETIN_THEME.labelsSignatures],
      },
      update: { logoUrl: uploaded.secureUrl },
    });

    await logActivite({
      userId: authResult.user.id,
      action: "bulletin_theme_logo",
      table: "bulletin_themes",
      details: { ecoleId: authResult.user.ecoleId },
    });

    return NextResponse.json({ data: serializeTheme(theme) });
  } catch (error) {
    console.error("Erreur POST bulletin-theme logo:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
