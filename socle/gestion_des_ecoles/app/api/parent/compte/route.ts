import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";
import { profileSchema, updateOwnProfile } from "@/lib/account-security";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function relationLabel(relation: string) {
  if (relation === "pere") return "Père";
  if (relation === "mere") return "Mère";
  if (relation === "tuteur") return "Tuteur";
  return "Parent";
}

export async function GET() {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const [user, unread] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          adresse: true,
          photo: true,
          twoFactorEnabled: true,
          termsAcceptedAt: true,
          role: true,
          ecole: {
            select: {
              nom: true,
              nomOfficiel: true,
              ville: true,
              adresse: true,
              telephone: true,
              email: true,
            },
          },
          parentEleves: {
            where: { eleve: { deletedAt: null } },
            include: {
              eleve: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  matricule: true,
                  ecole: {
                    select: {
                      nom: true,
                      nomOfficiel: true,
                      ville: true,
                      adresse: true,
                      telephone: true,
                      email: true,
                    },
                  },
                  classe: { select: { nom: true, anneeScolaire: true } },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.notification.count({
        where: { userId: authResult.user.id, readAt: null },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    // Priorité: école du premier enfant, sinon école du compte parent (jamais le seed global).
    const ecoleEnfant = user.parentEleves[0]?.eleve.ecole;
    const ecole = ecoleEnfant || user.ecole;
    const anneeScolaire = user.parentEleves[0]?.eleve.classe.anneeScolaire || "";

    return NextResponse.json({
      data: {
        profil: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          adresse: user.adresse,
          photo: user.photo,
          twoFactorEnabled: user.twoFactorEnabled,
          termsAccepted: Boolean(user.termsAcceptedAt),
          role: "Parent",
        },
        etablissement: {
          nom: ecole?.nomOfficiel || ecole?.nom || "Établissement",
          ville: ecole?.ville || "",
          adresse: ecole?.adresse || "",
          telephone: ecole?.telephone || "",
          email: ecole?.email || "",
          anneeScolaire,
        },
        enfants: user.parentEleves.map((lien) => ({
          id: lien.eleve.id,
          nom: lien.eleve.nom,
          prenom: lien.eleve.prenom,
          matricule: lien.eleve.matricule,
          classe: lien.eleve.classe.nom,
          relation: relationLabel(lien.relation),
        })),
        notificationsNonLues: unread,
      },
    });
  } catch (error) {
    console.error("Erreur compte parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Prénom, nom et email valides requis" }, { status: 400 });
    }

    const result = await updateOwnProfile(authResult.user.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.user });
  } catch (error) {
    console.error("Erreur mise à jour profil parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
