import { NextResponse } from "next/server";
import type { FamilleCycle } from "@prisma/client";
import { FAMILLES_CYCLE } from "@/lib/constants";

export function niveauxPourFamille(famille: FamilleCycle) {
  return [...FAMILLES_CYCLE[famille].niveaux];
}

export function cycleIdPourNiveau(niveau: string): string | null {
  if (niveau === "CI" || niveau === "CP") return "cycle-ci-cp";
  if (niveau === "CE1" || niveau === "CE2") return "cycle-ce";
  if (niveau === "CM1" || niveau === "CM2") return "cycle-cm";
  if (["6ème", "5ème", "4ème", "3ème"].includes(niveau)) return "cycle-college";
  if (["Seconde", "Première", "Terminale"].includes(niveau)) return "cycle-secondaire";
  return null;
}

export function familleWhere(ecoleId: string, famille: FamilleCycle) {
  return {
    ecoleId,
    cycle: { famille },
  };
}

export function forbiddenCycle() {
  return NextResponse.json(
    { error: "Cette classe ou cet élève n’appartient pas à votre cycle" },
    { status: 403 }
  );
}
