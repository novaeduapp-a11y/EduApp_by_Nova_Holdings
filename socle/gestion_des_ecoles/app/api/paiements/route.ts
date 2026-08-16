import { NextRequest, NextResponse } from "next/server";
import { requireManagement } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaiementSchema = z.object({
  eleveId: z.string().min(1, "Élève requis"),
  typeFrais: z.enum(["INSCRIPTION", "SCOLARITE", "CANTINE", "TRANSPORT", "AUTRE"]),
  montantTotal: z.number().positive("Montant doit être positif"),
  anneeScolaire: z.string().min(1, "Année scolaire requise"),
  echeance: z.string().optional(),
  description: z.string().optional(),
});

// GET - Récupérer les paiements
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const eleveId = searchParams.get("eleveId");
    const classeId = searchParams.get("classeId");
    const statut = searchParams.get("statut");
    const anneeScolaire = searchParams.get("anneeScolaire") || "2025-2026";

    const where: Record<string, unknown> = {
      anneeScolaire,
    };
    
    if (eleveId) where.eleveId = eleveId;
    if (statut) where.statut = statut;
    if (classeId) {
      where.eleve = { classeId };
    }

    const paiements = await prisma.paiement.findMany({
      where,
      include: {
        eleve: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            matricule: true,
            classe: {
              select: {
                nom: true,
              },
            },
          },
        },
        versements: {
          orderBy: { datePaiement: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Statistiques
    const stats = {
      totalPaiements: paiements.length,
      totalMontant: paiements.reduce((acc, p) => acc + Number(p.montantTotal), 0),
      totalPaye: paiements.reduce((acc, p) => acc + Number(p.montantPaye), 0),
      totalRestant: paiements.reduce((acc, p) => acc + (Number(p.montantTotal) - Number(p.montantPaye)), 0),
      payes: paiements.filter((p) => p.statut === "PAYE").length,
      partiels: paiements.filter((p) => p.statut === "PARTIEL").length,
      nonPayes: paiements.filter((p) => p.statut === "NON_PAYE").length,
    };

    return NextResponse.json({ success: true, data: { paiements, stats } });
  } catch (error) {
    console.error("Erreur récupération paiements:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un paiement
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validatedData = createPaiementSchema.parse(body);

    const paiement = await prisma.paiement.create({
      data: {
        eleveId: validatedData.eleveId,
        typeFrais: validatedData.typeFrais,
        montantTotal: validatedData.montantTotal,
        anneeScolaire: validatedData.anneeScolaire,
        echeance: validatedData.echeance ? new Date(validatedData.echeance) : null,
        description: validatedData.description,
      },
      include: {
        eleve: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    return NextResponse.json({ data: paiement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Erreur création paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
