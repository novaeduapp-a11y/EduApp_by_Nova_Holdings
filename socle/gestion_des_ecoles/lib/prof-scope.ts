import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type Assignment = {
  classeId: string;
  classeNom: string;
  niveau: string;
  matiereId: string;
  matiereNom: string;
  effectif: number;
};

export async function getProfAssignments(userId: string): Promise<Assignment[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, ecoleId: true, typeProfesseur: true },
  });
  if (!user || user.role !== "PROFESSEUR") return null;

  const rows = await prisma.classeMatiere.findMany({
    where: {
      professeurId: user.id,
      classe: {
        ...(user.ecoleId ? { ecoleId: user.ecoleId } : {}),
        ...(user.typeProfesseur === "PRIMAIRE" ? { cycle: { famille: "PRIMAIRE" as const } } : {}),
      },
    },
    include: {
      classe: {
        include: {
          _count: { select: { eleves: { where: { deletedAt: null, actif: true } } } },
        },
      },
      matiere: true,
    },
    orderBy: [{ classe: { nom: "asc" } }, { matiere: { nom: "asc" } }],
  });

  return rows.map((cm) => ({
    classeId: cm.classeId,
    classeNom: cm.classe.nom,
    niveau: cm.classe.niveau,
    matiereId: cm.matiereId,
    matiereNom: cm.matiere.nom,
    effectif: cm.classe._count.eleves,
  }));
}

export function canAccessClasse(assignments: Assignment[], classeId: string) {
  return assignments.some((item) => item.classeId === classeId);
}

export function canAccessMatiere(assignments: Assignment[], classeId: string, matiereId: string) {
  return assignments.some((item) => item.classeId === classeId && item.matiereId === matiereId);
}

export function groupedClasses(assignments: Assignment[]) {
  const map = new Map<
    string,
    {
      id: string;
      nom: string;
      niveau: string;
      effectif: number;
      matieres: { id: string; nom: string }[];
    }
  >();
  for (const item of assignments) {
    const current = map.get(item.classeId);
    if (!current) {
      map.set(item.classeId, {
        id: item.classeId,
        nom: item.classeNom,
        niveau: item.niveau,
        effectif: item.effectif,
        matieres: [{ id: item.matiereId, nom: item.matiereNom }],
      });
    } else {
      current.matieres.push({ id: item.matiereId, nom: item.matiereNom });
    }
  }
  return Array.from(map.values());
}

export function evaluationWhere(assignments: Assignment[]) {
  if (assignments.length === 0) return { id: { in: [] as string[] } };
  return {
    deletedAt: null,
    OR: assignments.map((item) => ({
      classeId: item.classeId,
      matiereId: item.matiereId,
    })),
  };
}

export function forbiddenClasse() {
  return NextResponse.json({ error: "Accès non autorisé à cette classe" }, { status: 403 });
}

export function dayBounds(dateIso: string) {
  const start = new Date(`${dateIso}T00:00:00.000Z`);
  const end = new Date(`${dateIso}T23:59:59.999Z`);
  return { start, end };
}
