import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagement } from "@/lib/permissions";
import * as XLSX from "xlsx";

// GET /api/export/eleves - Exporter les élèves en Excel
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get("classeId");

    // Récupérer les élèves
    const eleves = await prisma.eleve.findMany({
      where: {
        deletedAt: null,
        ...(classeId ? { classeId } : {}),
      },
      include: {
        classe: { select: { nom: true } },
      },
      orderBy: [{ classe: { nom: "asc" } }, { nom: "asc" }],
    });

    // Préparer les données pour Excel
    const data = eleves.map((eleve) => ({
      Matricule: eleve.matricule,
      Nom: eleve.nom,
      Prénom: eleve.prenom,
      "Date de naissance": new Date(eleve.dateNaissance).toLocaleDateString("fr-FR"),
      "Lieu de naissance": eleve.lieuNaissance || "",
      Sexe: eleve.sexe === "M" ? "Masculin" : "Féminin",
      Classe: eleve.classe?.nom || "",
      "Nom du père": eleve.nomPere || "",
      "Téléphone père": eleve.telephonePere || "",
      "Nom de la mère": eleve.nomMere || "",
      "Téléphone mère": eleve.telephoneMere || "",
      "Nom tuteur": eleve.nomTuteur || "",
      "Téléphone tuteur": eleve.telephoneTuteur || "",
      "Email parent": eleve.emailParent || "",
      Adresse: eleve.adresse || "",
      Statut: eleve.actif ? "Actif" : "Inactif",
    }));

    // Créer le workbook Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Élèves");

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 15 }, // Matricule
      { wch: 20 }, // Nom
      { wch: 20 }, // Prénom
      { wch: 15 }, // Date naissance
      { wch: 15 }, // Lieu naissance
      { wch: 10 }, // Sexe
      { wch: 10 }, // Classe
      { wch: 25 }, // Nom père
      { wch: 15 }, // Tel père
      { wch: 25 }, // Nom mère
      { wch: 15 }, // Tel mère
      { wch: 25 }, // Nom tuteur
      { wch: 15 }, // Tel tuteur
      { wch: 25 }, // Email
      { wch: 30 }, // Adresse
      { wch: 10 }, // Statut
    ];
    worksheet["!cols"] = colWidths;

    // Générer le buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Retourner le fichier
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="eleves_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/export/eleves:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
