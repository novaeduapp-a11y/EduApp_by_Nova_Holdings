import { NextRequest, NextResponse } from "next/server";
import { requireManagement } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createVersementSchema = z.object({
  montant: z.number().positive("Montant doit être positif"),
  datePaiement: z.string().min(1, "Date requise"),
  modePaiement: z.enum(["especes", "cheque", "virement", "wave", "orange_money"]),
  reference: z.string().optional(),
});

// POST - Ajouter un versement à un paiement
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;
    const session = authResult.session;

    const { id: paiementId } = params;
    const body = await request.json();
    const validatedData = createVersementSchema.parse(body);

    // Vérifier que le paiement existe
    const paiement = await prisma.paiement.findUnique({
      where: { id: paiementId },
    });

    if (!paiement) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 });
    }

    // Créer le versement
    const versement = await prisma.versementPaiement.create({
      data: {
        paiementId,
        montant: validatedData.montant,
        datePaiement: new Date(validatedData.datePaiement),
        modePaiement: validatedData.modePaiement,
        reference: validatedData.reference,
        recuPar: session.user.id,
      },
    });

    // Mettre à jour le montant payé et le statut du paiement
    const nouveauMontantPaye = Number(paiement.montantPaye) + validatedData.montant;
    const montantTotal = Number(paiement.montantTotal);
    
    let nouveauStatut: "PAYE" | "PARTIEL" | "NON_PAYE" = "NON_PAYE";
    if (nouveauMontantPaye >= montantTotal) {
      nouveauStatut = "PAYE";
    } else if (nouveauMontantPaye > 0) {
      nouveauStatut = "PARTIEL";
    }

    await prisma.paiement.update({
      where: { id: paiementId },
      data: {
        montantPaye: nouveauMontantPaye,
        statut: nouveauStatut,
      },
    });

    return NextResponse.json({ 
      data: versement,
      paiement: {
        montantPaye: nouveauMontantPaye,
        statut: nouveauStatut,
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Erreur création versement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
