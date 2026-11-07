import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDirecteur } from "@/lib/request-auth";
import { logActivite } from "@/lib/activity-log";
import {
  createPeriode,
  listPeriodesForEcole,
  setPeriodeActiveForEcole,
  updatePeriode,
} from "@/lib/periodes";

const patchSchema = z.object({
  id: z.string().min(1),
  actif: z.boolean().optional(),
  nom: z.string().min(1).max(80).optional(),
  numero: z.number().int().min(1).max(12).optional(),
  dateDebut: z.string().min(8).optional(),
  dateFin: z.string().min(8).optional(),
  anneeScolaire: z.string().min(4).max(20).optional(),
});

const createSchema = z.object({
  nom: z.string().min(1).max(80),
  numero: z.number().int().min(1).max(12),
  dateDebut: z.string().min(8),
  dateFin: z.string().min(8),
  anneeScolaire: z.string().min(4).max(20),
});

export async function GET() {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;

    const periodes = await listPeriodesForEcole(authResult.user.ecoleId);

    return NextResponse.json({
      data: periodes.map((periode) => ({
        id: periode.id,
        nom: periode.nom,
        numero: periode.numero,
        dateDebut: periode.dateDebut.toISOString().slice(0, 10),
        dateFin: periode.dateFin.toISOString().slice(0, 10),
        anneeScolaire: periode.anneeScolaire,
        actif: periode.actif,
      })),
    });
  } catch (error) {
    console.error("Erreur GET direction périodes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Période invalide" }, { status: 400 });
    }

    const result = await createPeriode(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivite({
      userId: authResult.user.id,
      action: "periode_creee",
      table: "periodes",
      recordId: result.periode.id,
      details: {
        nom: result.periode.nom,
        anneeScolaire: result.periode.anneeScolaire,
        ecoleId: authResult.user.ecoleId,
      },
    });

    return NextResponse.json({
      data: {
        id: result.periode.id,
        nom: result.periode.nom,
        numero: result.periode.numero,
        dateDebut: result.periode.dateDebut.toISOString().slice(0, 10),
        dateFin: result.periode.dateFin.toISOString().slice(0, 10),
        anneeScolaire: result.periode.anneeScolaire,
        actif: false,
      },
    });
  } catch (error) {
    console.error("Erreur POST direction périodes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireDirecteur();
    if (!authResult.ok) return authResult.response;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Période invalide" }, { status: 400 });
    }

    if (typeof parsed.data.actif === "boolean") {
      const result = await setPeriodeActiveForEcole(
        authResult.user.ecoleId,
        parsed.data.actif ? parsed.data.id : null
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      await logActivite({
        userId: authResult.user.id,
        action: parsed.data.actif ? "periode_activee_ecole" : "periode_desactivee_ecole",
        table: "ecoles",
        recordId: authResult.user.ecoleId,
        details: {
          periodeId: parsed.data.id,
          nom: result.periode?.nom ?? null,
          anneeScolaire: result.periode?.anneeScolaire ?? null,
        },
      });

      return NextResponse.json({
        data: {
          id: parsed.data.id,
          actif: parsed.data.actif,
        },
      });
    }

    const { id, nom, numero, dateDebut, dateFin, anneeScolaire } = parsed.data;
    if (!nom || numero == null || !dateDebut || !dateFin || !anneeScolaire) {
      return NextResponse.json({ error: "Champs de période incomplets" }, { status: 400 });
    }

    const result = await updatePeriode(id, {
      nom,
      numero,
      dateDebut,
      dateFin,
      anneeScolaire,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === "Période introuvable" ? 404 : 400 });
    }

    await logActivite({
      userId: authResult.user.id,
      action: "periode_modifiee",
      table: "periodes",
      recordId: result.periode.id,
      details: {
        nom: result.periode.nom,
        anneeScolaire: result.periode.anneeScolaire,
        ecoleId: authResult.user.ecoleId,
      },
    });

    return NextResponse.json({
      data: {
        id: result.periode.id,
        nom: result.periode.nom,
        numero: result.periode.numero,
        dateDebut: result.periode.dateDebut.toISOString().slice(0, 10),
        dateFin: result.periode.dateFin.toISOString().slice(0, 10),
        anneeScolaire: result.periode.anneeScolaire,
      },
    });
  } catch (error) {
    console.error("Erreur PATCH direction périodes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
