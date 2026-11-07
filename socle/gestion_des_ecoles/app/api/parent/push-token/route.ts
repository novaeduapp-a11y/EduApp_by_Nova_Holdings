import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

const upsertSchema = z.object({
  token: z.string().min(20).max(512),
  platform: z.enum(["ios", "android"]),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const parsed = upsertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Jeton invalide" }, { status: 400 });
    }

    const { token, platform } = parsed.data;
    if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
      return NextResponse.json({ error: "Format de jeton Expo invalide" }, { status: 400 });
    }

    const row = await prisma.devicePushToken.upsert({
      where: { token },
      create: {
        userId: authResult.user.id,
        token,
        platform,
      },
      update: {
        userId: authResult.user.id,
        platform,
      },
      select: { id: true, platform: true },
    });

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error("Erreur enregistrement push token:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const body = (await request.json().catch(() => ({}))) as { token?: string };
    const token = typeof body.token === "string" ? body.token : null;

    if (token) {
      await prisma.devicePushToken.deleteMany({
        where: { userId: authResult.user.id, token },
      });
    } else {
      await prisma.devicePushToken.deleteMany({
        where: { userId: authResult.user.id },
      });
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Erreur suppression push token:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
