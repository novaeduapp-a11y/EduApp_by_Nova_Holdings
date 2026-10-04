import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/request-auth";
import { passwordSchema, updateOwnPassword } from "@/lib/account-security";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireStaff(["PROFESSEUR", "PREFET", "DIRECTEUR", "ADMIN"]);
    if (!authResult.ok) return authResult.response;

    const parsed = passwordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const result = await updateOwnPassword(
      authResult.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Erreur mot de passe staff:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
