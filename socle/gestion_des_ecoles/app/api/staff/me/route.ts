import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/request-auth";
import { toStaffUser } from "@/lib/staff-auth";
import { profileSchema, updateOwnProfile } from "@/lib/account-security";

const STAFF_ROLES = ["PROFESSEUR", "PREFET", "DIRECTEUR", "ADMIN"] as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  try {
    const authResult = await requireStaff([...STAFF_ROLES]);
    if (!authResult.ok) return authResult.response;

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      include: { ecole: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    const unread = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });

    return NextResponse.json({
      data: {
        ...toStaffUser(user),
        telephone: user.telephone,
        adresse: user.adresse,
        twoFactorEnabled: user.twoFactorEnabled,
        ecole: user.ecole ? { id: user.ecole.id, nom: user.ecole.nom, ville: user.ecole.ville } : null,
        unread,
      },
    });
  } catch (error) {
    console.error("Erreur staff me:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireStaff([...STAFF_ROLES]);
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
    console.error("Erreur mise à jour profil staff:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
