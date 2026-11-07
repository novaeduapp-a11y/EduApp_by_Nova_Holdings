import { prisma } from "@/lib/prisma";

export type PeriodeResume = {
  id: string;
  nom: string;
  numero: number;
  dateDebut: Date;
  dateFin: Date;
  anneeScolaire: string;
  ordre: number;
  actif: boolean;
};

/** Période active pour une école (choix Direction), avec repli sur le flag global. */
export async function getPeriodeActiveForEcole(ecoleId: string) {
  const ecole = await prisma.ecole.findUnique({
    where: { id: ecoleId },
    select: {
      periodeActiveId: true,
      periodeActive: true,
    },
  });
  if (ecole?.periodeActive) return ecole.periodeActive;

  return prisma.periode.findFirst({
    where: { actif: true },
    orderBy: { numero: "desc" },
  });
}

export async function listPeriodesForEcole(ecoleId: string): Promise<PeriodeResume[]> {
  const [periodes, ecole] = await Promise.all([
    prisma.periode.findMany({
      orderBy: [{ anneeScolaire: "desc" }, { numero: "asc" }],
    }),
    prisma.ecole.findUnique({
      where: { id: ecoleId },
      select: { periodeActiveId: true },
    }),
  ]);

  const activeId =
    ecole?.periodeActiveId ??
    periodes.find((periode) => periode.actif)?.id ??
    null;

  return periodes.map((periode) => ({
    id: periode.id,
    nom: periode.nom,
    numero: periode.numero,
    dateDebut: periode.dateDebut,
    dateFin: periode.dateFin,
    anneeScolaire: periode.anneeScolaire,
    ordre: periode.ordre,
    actif: periode.id === activeId,
  }));
}

export async function setPeriodeActiveForEcole(ecoleId: string, periodeId: string | null) {
  if (periodeId) {
    const periode = await prisma.periode.findUnique({ where: { id: periodeId } });
    if (!periode) return { ok: false as const, error: "Période introuvable" as const };

    await prisma.ecole.update({
      where: { id: ecoleId },
      data: { periodeActiveId: periodeId },
    });
    return { ok: true as const, periode };
  }

  await prisma.ecole.update({
    where: { id: ecoleId },
    data: { periodeActiveId: null },
  });
  return { ok: true as const, periode: null };
}

export function isPeriodeActiveForEcole(
  periodeId: string,
  ecolePeriodeActiveId: string | null | undefined,
  periodeActifGlobal: boolean
) {
  if (ecolePeriodeActiveId) return periodeId === ecolePeriodeActiveId;
  return periodeActifGlobal;
}

export type PeriodeInput = {
  nom: string;
  numero: number;
  dateDebut: string;
  dateFin: string;
  anneeScolaire: string;
};

export async function createPeriode(input: PeriodeInput) {
  const dateDebut = new Date(`${input.dateDebut}T12:00:00`);
  const dateFin = new Date(`${input.dateFin}T12:00:00`);
  if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
    return { ok: false as const, error: "Dates invalides" as const };
  }
  if (dateFin < dateDebut) {
    return { ok: false as const, error: "La date de fin doit être après la date de début" as const };
  }

  const periode = await prisma.periode.create({
    data: {
      nom: input.nom.trim(),
      numero: input.numero,
      dateDebut,
      dateFin,
      anneeScolaire: input.anneeScolaire.trim(),
      ordre: input.numero,
      actif: false,
    },
  });
  return { ok: true as const, periode };
}

export async function updatePeriode(id: string, input: PeriodeInput) {
  const existing = await prisma.periode.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Période introuvable" as const };

  const dateDebut = new Date(`${input.dateDebut}T12:00:00`);
  const dateFin = new Date(`${input.dateFin}T12:00:00`);
  if (Number.isNaN(dateDebut.getTime()) || Number.isNaN(dateFin.getTime())) {
    return { ok: false as const, error: "Dates invalides" as const };
  }
  if (dateFin < dateDebut) {
    return { ok: false as const, error: "La date de fin doit être après la date de début" as const };
  }

  const periode = await prisma.periode.update({
    where: { id },
    data: {
      nom: input.nom.trim(),
      numero: input.numero,
      dateDebut,
      dateFin,
      anneeScolaire: input.anneeScolaire.trim(),
      ordre: input.numero,
    },
  });
  return { ok: true as const, periode };
}
