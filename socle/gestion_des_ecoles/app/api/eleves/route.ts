import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagement, requireStaff } from "@/lib/permissions";
import { createEleveSchema } from "@/lib/validations/eleve";
import { generateMatricule } from "@/lib/constants";
import bcrypt from "bcryptjs";

// GET /api/eleves - Liste des élèves avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireStaff();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const classeId = searchParams.get("classeId") || "";
    const actif = searchParams.get("actif");

    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null,
    };

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

    // Ajouter le statut "en difficulté" pour chaque élève
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

// POST /api/eleves - Créer un élève
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireManagement();
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

    // Récupérer la classe pour générer le matricule
    const classe = await prisma.classe.findUnique({
      where: { id: data.classeId },
    });

    if (!classe) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Classe non trouvée" } },
        { status: 404 }
      );
    }

    // Compter les élèves pour générer le matricule
    const count = await prisma.eleve.count({
      where: {
        matricule: {
          startsWith: `${new Date().getFullYear()}${classe.niveau}`,
        },
      },
    });

    const matricule = generateMatricule(classe.niveau, count + 1);

    // Créer le compte utilisateur si demandé
    let userId: string | null = null;
    let generatedPassword: string | null = null;

    if (body.createAccount) {
      // Générer un mot de passe aléatoire
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      generatedPassword = "";
      for (let i = 0; i < 8; i++) {
        generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      const email = `${matricule.toLowerCase()}@eleve.ecole.sn`;

      // Créer le compte utilisateur
      const user = await prisma.user.create({
        data: {
          nom: data.nom,
          prenom: data.prenom,
          email,
          password: hashedPassword,
          role: "ELEVE",
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
