import { prisma } from "@/lib/prisma";
import type { FamilleCycle } from "@prisma/client";
import { CRENEAUX_DEFAUT, minutesDepuisMinuit } from "@/lib/edt";
import { familleWhere } from "@/lib/prefet-scope";

export async function horairesDuCycle(ecoleId: string, famille: FamilleCycle) {
  const existing = await prisma.grilleHoraire.findMany({
    where: { ecoleId, famille },
    orderBy: [{ ordre: "asc" }, { heureDebut: "asc" }],
  });
  if (existing.length > 0) {
    return existing.map((row) => ({ heureDebut: row.heureDebut, heureFin: row.heureFin }));
  }

  await prisma.grilleHoraire.createMany({
    data: CRENEAUX_DEFAUT.map((slot, ordre) => ({
      ecoleId,
      famille,
      heureDebut: slot.heureDebut,
      heureFin: slot.heureFin,
      ordre,
    })),
    skipDuplicates: true,
  });

  return CRENEAUX_DEFAUT.map((slot) => ({ heureDebut: slot.heureDebut, heureFin: slot.heureFin }));
}

export type RemapHoraire = {
  from: { heureDebut: string; heureFin: string };
  to: { heureDebut: string; heureFin: string };
};

export async function enregistrerGrille(
  ecoleId: string,
  famille: FamilleCycle,
  horaires: { heureDebut: string; heureFin: string }[],
  remaps: RemapHoraire[] = []
) {
  const ordered = [...horaires].sort(
    (a, b) => minutesDepuisMinuit(a.heureDebut) - minutesDepuisMinuit(b.heureDebut)
  );

  const meaningfulRemaps = remaps.filter(
    (item) =>
      item.from.heureDebut !== item.to.heureDebut || item.from.heureFin !== item.to.heureFin
  );

  await prisma.$transaction(async (tx) => {
    await tx.grilleHoraire.deleteMany({ where: { ecoleId, famille } });
    await tx.grilleHoraire.createMany({
      data: ordered.map((slot, ordre) => ({
        ecoleId,
        famille,
        heureDebut: slot.heureDebut,
        heureFin: slot.heureFin,
        ordre,
      })),
    });

    if (meaningfulRemaps.length === 0) return;

    const classeFilter = familleWhere(ecoleId, famille);
    const affected = await tx.creneauEdt.findMany({
      where: {
        ecoleId,
        classe: classeFilter,
        OR: meaningfulRemaps.map((item) => ({
          heureDebut: item.from.heureDebut,
          heureFin: item.from.heureFin,
        })),
      },
      select: { id: true, heureDebut: true, heureFin: true },
    });

    const targetByFrom = new Map(
      meaningfulRemaps.map((item) => [
        `${item.from.heureDebut}|${item.from.heureFin}`,
        item.to,
      ])
    );

    // Libère les contraintes unique (classe, jour, début, fin) avant d'écrire les nouvelles heures.
    for (let i = 0; i < affected.length; i++) {
      const slot = affected[i];
      const block = Math.floor(i / 60);
      const mm = String(i % 60).padStart(2, "0");
      await tx.creneauEdt.update({
        where: { id: slot.id },
        data: {
          heureDebut: `${String(88 - block).padStart(2, "0")}:${mm}`,
          heureFin: `${String(89 - block).padStart(2, "0")}:${mm}`,
        },
      });
    }

    for (const slot of affected) {
      const to = targetByFrom.get(`${slot.heureDebut}|${slot.heureFin}`);
      if (!to) continue;
      await tx.creneauEdt.update({
        where: { id: slot.id },
        data: { heureDebut: to.heureDebut, heureFin: to.heureFin },
      });
    }
  });

  return ordered;
}

export function fusionnerHoraires(
  grille: { heureDebut: string; heureFin: string }[],
  extra: { heureDebut: string; heureFin: string }[]
) {
  const map = new Map<string, { heureDebut: string; heureFin: string }>();
  for (const slot of [...grille, ...extra]) {
    map.set(`${slot.heureDebut}|${slot.heureFin}`, slot);
  }
  return [...map.values()].sort(
    (a, b) => minutesDepuisMinuit(a.heureDebut) - minutesDepuisMinuit(b.heureDebut)
  );
}
