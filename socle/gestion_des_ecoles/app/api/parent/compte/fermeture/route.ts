import { NextRequest, NextResponse } from "next/server";
import { requireParent } from "@/lib/request-auth";
import { closeAccountSchema, closeOwnAccount } from "@/lib/account-security";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const parsed = closeAccountSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }

    const result = await closeOwnAccount(authResult.user.id, parsed.data.mode, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: { mode: parsed.data.mode } });
  } catch (error) {
    console.error("Erreur fermeture compte parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
