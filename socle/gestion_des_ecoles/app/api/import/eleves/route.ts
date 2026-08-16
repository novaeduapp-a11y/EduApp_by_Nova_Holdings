import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagement } from "@/lib/permissions";
import * as XLSX from "xlsx";

// POST /api/import/eleves - Importer des élèves depuis Excel
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
    if (!authResult.ok) return authResult.response;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Fichier requis" } },
        { status: 400 }
      );
    }

    // Lire le fichier Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Le fichier est vide" } },
        { status: 400 }
      );
    }

    // Récupérer les classes existantes
    const classes = await prisma.classe.findMany({
      where: { anneeScolaire: "2025-2026" },
    });
    const classeMap = new Map(classes.map((c) => [c.nom.toLowerCase(), c.id]));

    // Traiter les données
    const results = {
      success: 0,
      errors: [] as { ligne: number; erreur: string }[],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const ligne = i + 2; // +2 car ligne 1 = header, index commence à 0

      try {
        // Mapper les colonnes (flexible sur les noms)
        const nom = row["Nom"] || row["nom"] || row["NOM"];
        const prenom = row["Prénom"] || row["prenom"] || row["PRENOM"] || row["Prenom"];
        const dateNaissanceStr = row["Date de naissance"] || row["date_naissance"] || row["DateNaissance"];
        const lieuNaissance = row["Lieu de naissance"] || row["lieu_naissance"] || row["LieuNaissance"];
        const sexe = row["Sexe"] || row["sexe"] || row["SEXE"];
        const classeNom = row["Classe"] || row["classe"] || row["CLASSE"];
        const nomPere = row["Nom du père"] || row["nom_pere"] || row["NomPere"];
        const telephonePere = row["Téléphone père"] || row["tel_pere"] || row["TelPere"];
        const nomMere = row["Nom de la mère"] || row["nom_mere"] || row["NomMere"];
        const telephoneMere = row["Téléphone mère"] || row["tel_mere"] || row["TelMere"];
        const nomTuteur = row["Nom tuteur"] || row["nom_tuteur"] || row["NomTuteur"];
        const telephoneTuteur = row["Téléphone tuteur"] || row["tel_tuteur"] || row["TelTuteur"];
        const emailParent = row["Email parent"] || row["email"] || row["Email"];
        const adresse = row["Adresse"] || row["adresse"] || row["ADRESSE"];

        // Validation
        if (!nom || !prenom) {
          results.errors.push({ ligne, erreur: "Nom et prénom requis" });
          continue;
        }

        if (!dateNaissanceStr) {
          results.errors.push({ ligne, erreur: "Date de naissance requise" });
          continue;
        }

        if (!classeNom) {
          results.errors.push({ ligne, erreur: "Classe requise" });
          continue;
        }

        // Trouver la classe
        const classeId = classeMap.get(classeNom.toLowerCase());
        if (!classeId) {
          results.errors.push({ ligne, erreur: `Classe "${classeNom}" non trouvée` });
          continue;
        }

        // Parser la date
        let dateNaissance: Date;
        if (typeof dateNaissanceStr === "number") {
          // Date Excel (nombre de jours depuis 1900)
          dateNaissance = new Date((dateNaissanceStr - 25569) * 86400 * 1000);
        } else {
          // Essayer différents formats
          const parts = dateNaissanceStr.split(/[\/\-\.]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              // YYYY-MM-DD
              dateNaissance = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              // DD/MM/YYYY
              dateNaissance = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
          } else {
            dateNaissance = new Date(dateNaissanceStr);
          }
        }

        if (isNaN(dateNaissance.getTime())) {
          results.errors.push({ ligne, erreur: "Format de date invalide" });
          continue;
        }

        // Déterminer le sexe
        const sexeNorm = (sexe || "").toString().toUpperCase();
        const sexeValue = sexeNorm.startsWith("M") ? "M" : sexeNorm.startsWith("F") ? "F" : "M";

        // Générer le matricule
        const year = new Date().getFullYear();
        const count = await prisma.eleve.count();
        const matricule = `${year}${classeNom.replace("-", "").toUpperCase()}${String(count + 1).padStart(3, "0")}`;

        // Créer l'élève
        await prisma.eleve.create({
          data: {
            matricule,
            nom: nom.toString().trim(),
            prenom: prenom.toString().trim(),
            dateNaissance,
            lieuNaissance: lieuNaissance?.toString().trim() || null,
            sexe: sexeValue,
            classeId,
            nomPere: nomPere?.toString().trim() || null,
            telephonePere: telephonePere?.toString().trim() || null,
            nomMere: nomMere?.toString().trim() || null,
            telephoneMere: telephoneMere?.toString().trim() || null,
            nomTuteur: nomTuteur?.toString().trim() || null,
            telephoneTuteur: telephoneTuteur?.toString().trim() || null,
            emailParent: emailParent?.toString().trim() || null,
            adresse: adresse?.toString().trim() || null,
            actif: true,
          },
        });

        results.success++;
      } catch (error) {
        console.error(`Erreur ligne ${ligne}:`, error);
        results.errors.push({ ligne, erreur: "Erreur lors de la création" });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: data.length,
        imported: results.success,
        errors: results.errors,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/import/eleves:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
