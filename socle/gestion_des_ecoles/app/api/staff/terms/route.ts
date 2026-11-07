import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/request-auth";
import { TERMS_TEXT, TERMS_TITLE } from "@/lib/legal";

export async function GET() {
  return NextResponse.json({ data: { title: TERMS_TITLE, text: TERMS_TEXT } });
}

export async function POST() {
  try {
    const authResult = await requireStaff(["PROFESSEUR", "PREFET", "DIRECTEUR", "ADMIN"]);
    if (!authResult.ok) return authResult.response;

    await prisma.user.update({
      where: { id: authResult.user.id },
      data: { termsAcceptedAt: new Date() },
    });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Erreur acceptation conditions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
