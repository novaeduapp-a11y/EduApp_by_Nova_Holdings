import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Profil de l'élève connecté
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'élève lié à ce compte
    const eleve = await prisma.eleve.findUnique({
      where: { userId: session.user.id },
      include: {
        classe: { include: { cycle: true } },
      },
    });

    if (!eleve) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        dateNaissance: eleve.dateNaissance.toISOString(),
        lieuNaissance: eleve.lieuNaissance,
        sexe: eleve.sexe,
        classe: eleve.classe.nom,
        cycle: eleve.classe.cycle?.nom || null,
        adresse: eleve.adresse,
        photo: eleve.photo,
        nomPere: eleve.nomPere,
        telephonePere: eleve.telephonePere,
        nomMere: eleve.nomMere,
        telephoneMere: eleve.telephoneMere,
        emailParent: eleve.emailParent,
      },
    });
  } catch (error) {
    console.error("Erreur profil élève:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
