import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePrefet } from "@/lib/request-auth";
import { isHeureValide } from "@/lib/edt";
import { enregistrerGrille, horairesDuCycle } from "@/lib/grille-horaire";

const slotSchema = z.object({
  heureDebut: z.string().min(4),
  heureFin: z.string().min(4),
});

const schema = z.object({
  horaires: z.array(slotSchema).min(1).max(16),
  remaps: z
    .array(
      z.object({
        from: slotSchema,
        to: slotSchema,
      })
    )
    .max(16)
    .optional(),
});

export async function GET() {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;
    const horaires = await horairesDuCycle(ecoleId, familleCycle);
    return NextResponse.json({ data: { horaires } });
  } catch (error) {
    console.error("Erreur grille horaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requirePrefet();
    if (!authResult.ok) return authResult.response;
    const { ecoleId, familleCycle } = authResult.user;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Indiquez au moins un créneau horaire" }, { status: 400 });
    }

    const normalize = (value: string) => value.slice(0, 5);
    const horaires = parsed.data.horaires.map((slot) => ({
      heureDebut: normalize(slot.heureDebut),
      heureFin: normalize(slot.heureFin),
    }));
    const remaps = (parsed.data.remaps ?? []).map((item) => ({
      from: {
        heureDebut: normalize(item.from.heureDebut),
        heureFin: normalize(item.from.heureFin),
      },
      to: {
        heureDebut: normalize(item.to.heureDebut),
        heureFin: normalize(item.to.heureFin),
      },
    }));

    for (const slot of [...horaires, ...remaps.flatMap((item) => [item.from, item.to])]) {
      if (
        !isHeureValide(slot.heureDebut) ||
        !isHeureValide(slot.heureFin) ||
        slot.heureDebut >= slot.heureFin
      ) {
        return NextResponse.json({ error: "Heures invalides" }, { status: 400 });
      }
    }

    const saved = await enregistrerGrille(ecoleId, familleCycle, horaires, remaps);
    return NextResponse.json({ data: { horaires: saved } });
  } catch (error) {
    console.error("Erreur enregistrement grille:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
