import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireProfesseur, requirePrefet, requireDirecteur } from "@/lib/unified-auth";
import { createEleveSchema } from "@/lib/validations/eleve";
import { generateMatricule } from "@/lib/constants";
import bcrypt from "bcryptjs";

// GET /api/eleves - Liste des élèves avec pagination et filtres
// Maintenant avec isolation école/classe pour professeurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // Pour déterminer quel check faire
    
    // Déterminer l'utilisateur et ses permissions
    let authResult;
    if (role === "PROFESSEUR") {
      authResult = await requireProfesseur();
    } else if (role === "PREFET") {
      authResult = await requirePrefet();
    } else if (role === "DIRECTEUR") {
      authResult = await requireDirecteur();
    } else {
      authResult = await requireAdmin();
    }

    if (!authResult.ok) return authResult.response;

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const classeId = searchParams.get("classeId") || "";
    const niveau = searchParams.get("niveau") || "";
    const sexe = searchParams.get("sexe") || "";
    const actif = searchParams.get("actif");

    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null,
    };

    // Isolation par école (sauf ADMIN)
    if (!authResult.user.isAdmin && authResult.user.ecoleId) {
      where.ecoleId = authResult.user.ecoleId;
    }

    // Pour les préfets, filtrer par cycle
    if ("familleCycle" in authResult.user && authResult.user.familleCycle && !authResult.user.isAdmin) {
      where.classe = {
        ...(where.classe ?? {}),
        cycle: { famille: authResult.user.familleCycle },
      };
    }

    // Pour les professeurs, filtrer par classes enseignées
    if ("affectations" in authResult.user && authResult.user.affectations && !authResult.user.isAdmin) {
      const classeIds = [...new Set(authResult.user.affectations.map((a: { classeId: string }) => a.classeId))];
      if (classeIds.length > 0) {
        where.classeId = { in: classeIds };
      } else {
        // Aucune classe assignée
        where.id = { in: [] };
      }
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { matricule: { contains: search, mode: "insensitive" } },
      ];
    }

    if (classeId) {
      where.classeId = classeId;
    }

    if (niveau) {
      where.classe = { ...(where.classe ?? {}), niveau };
    }

    if (sexe === "M" || sexe === "F") {
      where.sexe = sexe;
    }

    if (actif !== null && actif !== "") {
      where.actif = actif === "true";
    }

    const [eleves, total] = await Promise.all([
      prisma.eleve.findMany({
        where,
        include: {
          classe: {
            include: {
              cycle: true,
            },
          },
          moyennesGenerales: {
            orderBy: { periode: { numero: "desc" } },
            take: 1,
            include: {
              periode: { select: { nom: true } },
            },
          },
        },
        orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        skip,
        take: limit,
      }),
      prisma.eleve.count({ where }),
    ]);

    const elevesWithStatus = eleves.map((eleve) => {
      const derniereMoyenne = eleve.moyennesGenerales[0];
      const moyenne = derniereMoyenne?.moyenneGenerale ? Number(derniereMoyenne.moyenneGenerale) : null;
      const enDifficulte = moyenne !== null && moyenne < 10;
      
      return {
        ...eleve,
        derniereMoyenne: moyenne,
        periodeNom: derniereMoyenne?.periode?.nom || null,
        enDifficulte,
      };
    });

    return NextResponse.json({
      success: true,
      data: elevesWithStatus,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/eleves:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}

// POST /api/eleves - Créer un élève (réservé ADMIN)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const validation = createEleveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Données invalides",
            details: validation.error.issues.map((e) => ({
              field: String(e.path.join(".")),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const classe = await prisma.classe.findUnique({
      where: { id: data.classeId },
    });

    if (!classe) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Classe non trouvée" } },
        { status: 404 }
      );
    }

    // Vérifier que l'ADMIN peut créer dans cette école (ou est ADMIN global)
    if (!authResult.user.isAdmin && authResult.user.ecoleId !== classe.ecoleId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Permission refusée pour cette école" } },
        { status: 403 }
      );
    }

    const count = await prisma.eleve.count({
      where: {
        matricule: {
          startsWith: `${new Date().getFullYear()}${classe.niveau}`,
        },
      },
    });

    const matricule = generateMatricule(classe.niveau, count + 1);

    let userId: string | null = null;
    let generatedPassword: string | null = null;

    if (body.createAccount) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      generatedPassword = "";
      for (let i = 0; i < 8; i++) {
        generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      const email = `${matricule.toLowerCase()}@eleve.ecole.sn`;

      const user = await prisma.user.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          email,
          password: hashedPassword,
          role: "ELEVE",
          mustChangePassword: true, // Force password change at first login
        },
      });
      userId = user.id;
    }

    const eleve = await prisma.eleve.create({
      data: {
        ...data,
        matricule,
        dateNaissance: new Date(data.dateNaissance),
        emailParent: data.emailParent || null,
        userId,
      },
      include: {
        classe: {
          include: {
            cycle: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...eleve,
        accountCreated: !!userId,
        credentials: userId ? {
          matricule,
          password: generatedPassword,
        } : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/eleves:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
