import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProfesseur } from "@/lib/request-auth";
import {
  canAccessClasse,
  canAccessMatiere,
  dayBounds,
  forbiddenClasse,
  getProfAssignments,
} from "@/lib/prof-scope";
import {
  dureeHeuresFromCreneau,
  jourSemaineFromDate,
  motifFromStatut,
  pickDefaultCreneau,
  statutFromMotif,
  type AppelStatut,
} from "@/lib/appel-creneau";
import { notifyUsers } from "@/lib/notify";

const saveSchema = z.object({
  classeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/),
  matiereId: z.string().min(1).optional(),
  lignes: z.array(
    z.object({
      eleveId: z.string().min(1),
      statut: z.enum(["PRESENT", "ABSENT", "RETARD"]),
    })
  ),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get("classeId");
    const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    let heureDebut = searchParams.get("heureDebut");
    let heureFin = searchParams.get("heureFin");

    if (!classeId) {
      return NextResponse.json({ error: "Classe requise" }, { status: 400 });
    }
    if (!canAccessClasse(assignments, classeId)) return forbiddenClasse();

    const classe = assignments.find((item) => item.classeId === classeId);
    const jour = jourSemaineFromDate(date);
    const matiereIds = new Set(
      assignments.filter((a) => a.classeId === classeId).map((a) => a.matiereId)
    );

    const creneauxJour = jour
      ? await prisma.creneauEdt.findMany({
          where: { classeId, jour },
          include: {
            matiere: { select: { id: true, nom: true } },
            professeur: { select: { id: true, nom: true, prenom: true } },
          },
          orderBy: { heureDebut: "asc" },
        })
      : [];

    const mesCreneaux = creneauxJour
      .filter(
        (c) =>
          (c.professeurId && c.professeurId === authResult.user.id) || matiereIds.has(c.matiereId)
      )
      .map((c) => ({
        id: c.id,
        heureDebut: c.heureDebut,
        heureFin: c.heureFin,
        matiereId: c.matiereId,
        matiereNom: c.matiere.nom,
        salle: c.salle,
      }));

    if (mesCreneaux.length === 0) {
      const eleves = jour
        ? await prisma.eleve.findMany({
            where: { classeId, deletedAt: null, actif: true },
            select: { id: true, nom: true, prenom: true, matricule: true, sexe: true },
            orderBy: [{ nom: "asc" }, { prenom: "asc" }],
          })
        : [];
      return NextResponse.json({
        data: {
          classeId,
          classeNom: classe?.classeNom ?? "",
          date,
          jour,
          creneaux: [],
          creneau: null,
          precedent: null,
          verrouille: false,
          eleves: eleves.map((eleve) => ({
            eleveId: eleve.id,
            nom: eleve.nom,
            prenom: eleve.prenom,
            matricule: eleve.matricule,
            sexe: eleve.sexe,
            statut: "PRESENT",
          })),
          message: jour
            ? "Aucun cours prévu à votre emploi du temps ce jour. Les élèves sont affichés, mais l'enregistrement de l'appel nécessite un créneau établi par le préfet"
            : "Pas de cours aujourd’hui",
        },
      });
    }

    if (!heureDebut || !heureFin) {
      const def = pickDefaultCreneau(mesCreneaux);
      heureDebut = def?.heureDebut ?? mesCreneaux[0].heureDebut;
      heureFin = def?.heureFin ?? mesCreneaux[0].heureFin;
    }

    const creneau =
      mesCreneaux.find((c) => c.heureDebut === heureDebut && c.heureFin === heureFin) ?? null;
    if (!creneau) {
      return NextResponse.json({ error: "Créneau non autorisé pour ce professeur" }, { status: 403 });
    }

    const index = creneauxJour.findIndex(
      (c) => c.heureDebut === creneau.heureDebut && c.heureFin === creneau.heureFin
    );
    const creneauPrecedent = index > 0 ? creneauxJour[index - 1] : null;

    const { start, end } = dayBounds(date);
    const [eleves, absencesCreneau, absencesPrecedent, feuille] = await Promise.all([
      prisma.eleve.findMany({
        where: { classeId, deletedAt: null, actif: true },
        select: { id: true, nom: true, prenom: true, matricule: true, sexe: true },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      }),
      prisma.absence.findMany({
        where: {
          deletedAt: null,
          dateAbsence: { gte: start, lte: end },
          heureDebut: creneau.heureDebut,
          heureFin: creneau.heureFin,
          eleve: { classeId },
        },
      }),
      creneauPrecedent
        ? prisma.absence.findMany({
            where: {
              deletedAt: null,
              dateAbsence: { gte: start, lte: end },
              heureDebut: creneauPrecedent.heureDebut,
              heureFin: creneauPrecedent.heureFin,
              eleve: { classeId },
            },
          })
        : Promise.resolve([]),
      prisma.feuillePresence.findFirst({
        where: {
          classeId,
          dateAppel: start,
          heureDebut: creneau.heureDebut,
          heureFin: creneau.heureFin,
        },
      }),
    ]);

    const byEleve = new Map(absencesCreneau.map((item) => [item.eleveId, item]));
    const prevByEleve = new Map(absencesPrecedent.map((item) => [item.eleveId, item]));
    const verrouille = Boolean(feuille);

    return NextResponse.json({
      data: {
        classeId,
        classeNom: classe?.classeNom ?? "",
        date,
        jour,
        creneaux: mesCreneaux,
        creneau,
        precedent: creneauPrecedent
          ? {
              heureDebut: creneauPrecedent.heureDebut,
              heureFin: creneauPrecedent.heureFin,
              matiereNom: creneauPrecedent.matiere.nom,
              professeurNom: creneauPrecedent.professeur
                ? `${creneauPrecedent.professeur.prenom} ${creneauPrecedent.professeur.nom}`
                : null,
            }
          : null,
        verrouille,
        eleves: eleves.map((eleve) => {
          const absence = byEleve.get(eleve.id);
          const prev = prevByEleve.get(eleve.id);
          let statut: AppelStatut = "PRESENT";
          if (verrouille || absence) {
            statut = absence ? statutFromMotif(absence.motif) : "PRESENT";
          } else if (prev) {
            const prevStatut = statutFromMotif(prev.motif);
            if (prevStatut === "ABSENT" || prevStatut === "ABSENT_RETARD") {
              statut = "RETARD";
            }
          }
          return {
            eleveId: eleve.id,
            nom: eleve.nom,
            prenom: eleve.prenom,
            matricule: eleve.matricule,
            sexe: eleve.sexe,
            statut,
            justifiee: absence?.justifiee ?? false,
            statutPrecedent: prev ? statutFromMotif(prev.motif) : ("PRESENT" as AppelStatut),
          };
        }),
      },
    });
  } catch (error) {
    console.error("Erreur feuille d'appel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireProfesseur();
    if (!authResult.ok) return authResult.response;

    const assignments = await getProfAssignments(authResult.user.id);
    if (!assignments) {
      return NextResponse.json({ error: "Accès réservé aux professeurs" }, { status: 403 });
    }

    const parsed = saveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    const { classeId, date, heureDebut, heureFin, lignes } = parsed.data;
    let matiereId = parsed.data.matiereId;
    if (!canAccessClasse(assignments, classeId)) return forbiddenClasse();

    const jour = jourSemaineFromDate(date);
    if (!jour) {
      return NextResponse.json({ error: "Pas de cours aujourd’hui" }, { status: 400 });
    }

    const creneau = await prisma.creneauEdt.findFirst({
      where: { classeId, jour, heureDebut, heureFin },
      select: { matiereId: true, professeurId: true },
    });
    if (!creneau) {
      return NextResponse.json({ error: "Créneau introuvable dans l’EDT" }, { status: 404 });
    }
    matiereId = matiereId ?? creneau.matiereId;
    const allowedSlot =
      creneau.professeurId === authResult.user.id ||
      canAccessMatiere(assignments, classeId, creneau.matiereId);
    if (!allowedSlot) {
      return NextResponse.json({ error: "Créneau non autorisé" }, { status: 403 });
    }

    const eleves = await prisma.eleve.findMany({
      where: { classeId, deletedAt: null, actif: true },
      select: { id: true },
    });
    const allowed = new Set(eleves.map((eleve) => eleve.id));
    for (const ligne of lignes) {
      if (!allowed.has(ligne.eleveId)) {
        return NextResponse.json({ error: "Élève hors de cette classe" }, { status: 403 });
      }
    }

    const { start, end } = dayBounds(date);
    const dateAbsence = start;
    const duree = dureeHeuresFromCreneau(heureDebut, heureFin);

    const deja = await prisma.feuillePresence.findFirst({
      where: { classeId, dateAppel: start, heureDebut, heureFin },
    });
    if (deja) {
      return NextResponse.json(
        { error: "Cette liste de présence (créneau) est déjà enregistrée et ne peut plus être modifiée." },
        { status: 409 }
      );
    }

    // Créneau précédent du jour : si l’élève y était absent (billet), forcer RETARD ici.
    const creneauxJour = await prisma.creneauEdt.findMany({
      where: { classeId, jour },
      orderBy: { heureDebut: "asc" },
      select: { heureDebut: true, heureFin: true },
    });
    const index = creneauxJour.findIndex((c) => c.heureDebut === heureDebut && c.heureFin === heureFin);
    const creneauPrecedent = index > 0 ? creneauxJour[index - 1] : null;
    const absencesPrecedent = creneauPrecedent
      ? await prisma.absence.findMany({
          where: {
            deletedAt: null,
            dateAbsence: { gte: start, lte: end },
            heureDebut: creneauPrecedent.heureDebut,
            heureFin: creneauPrecedent.heureFin,
            eleve: { classeId },
          },
          select: { eleveId: true, motif: true },
        })
      : [];
    const absentPrecedent = new Set(
      absencesPrecedent
        .filter((row) => {
          const s = statutFromMotif(row.motif);
          return s === "ABSENT" || s === "ABSENT_RETARD";
        })
        .map((row) => row.eleveId)
    );

    const createdFor: Array<{ eleveId: string; statut: "ABSENT" | "RETARD" }> = [];

    await prisma.$transaction(async (tx) => {
      await tx.feuillePresence.create({
        data: {
          classeId,
          dateAppel: start,
          heureDebut,
          heureFin,
          matiereId,
          createdBy: authResult.user.id,
        },
      });

      for (const ligne of lignes) {
        let statut = ligne.statut;
        if (statut === "ABSENT" && absentPrecedent.has(ligne.eleveId)) {
          statut = "RETARD";
        }

        const existing = await tx.absence.findFirst({
          where: {
            eleveId: ligne.eleveId,
            dateAbsence: { gte: start, lte: end },
            heureDebut,
            heureFin,
            deletedAt: null,
          },
        });

        if (statut === "PRESENT") {
          if (existing) {
            await tx.absence.update({
              where: { id: existing.id },
              data: { deletedAt: new Date() },
            });
          }
          continue;
        }

        const motif = motifFromStatut(statut);
        if (existing) {
          await tx.absence.update({
            where: { id: existing.id },
            data: {
              motif,
              periode: "JOURNEE",
              matiereId,
              dureeHeures: duree,
              heureDebut,
              heureFin,
            },
          });
        } else {
          await tx.absence.create({
            data: {
              eleveId: ligne.eleveId,
              dateAbsence,
              periode: "JOURNEE",
              motif,
              matiereId,
              dureeHeures: duree,
              heureDebut,
              heureFin,
              createdBy: authResult.user.id,
            },
          });
          if (statut === "ABSENT" || statut === "RETARD") {
            createdFor.push({ eleveId: ligne.eleveId, statut });
          }
        }
      }
    });

    let parentsNotifies = 0;
    if (createdFor.length > 0) {
      const eleveIds = createdFor.map((item) => item.eleveId);
      const statutByEleve = new Map(createdFor.map((item) => [item.eleveId, item.statut]));
      const [liens, elevesNotif] = await Promise.all([
        prisma.parentEleve.findMany({
          where: { eleveId: { in: eleveIds } },
          select: { parentId: true, eleveId: true },
        }),
        prisma.eleve.findMany({
          where: { id: { in: eleveIds } },
          select: { id: true, prenom: true, nom: true },
        }),
      ]);
      const nomById = new Map(elevesNotif.map((e) => [e.id, `${e.prenom} ${e.nom}`]));
      const matiereNom = matiereId
        ? (await prisma.matiere.findUnique({ where: { id: matiereId }, select: { nom: true } }))?.nom
        : null;
      const cours = matiereNom ? ` au cours de ${matiereNom}` : "";
      if (liens.length > 0) {
        await notifyUsers(
          liens.map((lien) => {
            const retard = statutByEleve.get(lien.eleveId) === "RETARD";
            const enfant = nomById.get(lien.eleveId) ?? "votre enfant";
            const label = retard ? "Retard" : "Absence";
            return {
              userId: lien.parentId,
              type: retard ? "retard" : "absence",
              title: `${label} · ${enfant}`,
              message: retard
                ? `Votre enfant ${enfant} a un retard${cours} de ${heureDebut} à ${heureFin}.`
                : `Votre enfant ${enfant} est absent${cours} de ${heureDebut} à ${heureFin}.`,
              data: {
                eleveId: lien.eleveId,
                date,
                heureDebut,
                heureFin,
                statut: statutByEleve.get(lien.eleveId) ?? "ABSENT",
              },
            };
          })
        );
        parentsNotifies = liens.length;
      }
    }

    return NextResponse.json({
      data: {
        saved: lignes.length,
        absents: lignes.filter((ligne) => ligne.statut === "ABSENT").length,
        retards: lignes.filter((ligne) => ligne.statut === "RETARD").length,
        parentsNotifies,
        creneau: { heureDebut, heureFin, matiereId },
      },
    });
  } catch (error) {
    console.error("Erreur enregistrement appel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
