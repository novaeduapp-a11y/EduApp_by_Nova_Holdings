import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";
import { profileSchema, updateOwnProfile } from "@/lib/account-security";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

function mapParams(rows: Array<{ cle: string; valeur: string | null }>) {
  const map = Object.fromEntries(rows.map((row) => [row.cle, row.valeur ?? ""]));
  return {
    nom: map.nom_etablissement || "",
    adresse: map.adresse_etablissement || "",
    telephone: map.telephone_etablissement || "",
    email: map.email_etablissement || "",
    anneeScolaire: map.annee_scolaire || "",
  };
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

    const [user, parametres, unread] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          adresse: true,
          twoFactorEnabled: true,
          role: true,
          ecole: { select: { nom: true, ville: true } },
          parentEleves: {
            where: { eleve: { deletedAt: null } },
            include: {
              eleve: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  matricule: true,
                  classe: { select: { nom: true } },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.parametre.findMany({
        where: {
          cle: {
            in: [
              "nom_etablissement",
              "adresse_etablissement",
              "telephone_etablissement",
              "email_etablissement",
              "annee_scolaire",
            ],
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

    const etablissement = mapParams(parametres);

    return NextResponse.json({
      data: {
        profil: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          adresse: user.adresse,
          twoFactorEnabled: user.twoFactorEnabled,
          role: "Parent",
        },
        etablissement: {
          nom: etablissement.nom || user.ecole?.nom || "Établissement",
          ville: user.ecole?.ville || "",
          adresse: etablissement.adresse,
          telephone: etablissement.telephone,
          email: etablissement.email,
          anneeScolaire: etablissement.anneeScolaire,
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
