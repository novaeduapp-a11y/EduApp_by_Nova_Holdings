import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/request-auth";

const MAX_PHOTO_LENGTH = 400_000;

const photoSchema = z.object({
  photo: z
    .string()
    .max(MAX_PHOTO_LENGTH)
    .regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const parsed = photoSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Photo invalide (JPEG ou PNG, 300 Ko maximum)" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: authResult.user.id },
      data: { photo: parsed.data.photo },
    });

    return NextResponse.json({ data: { photo: parsed.data.photo } });
  } catch (error) {
    console.error("Erreur photo parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    await prisma.user.update({
      where: { id: authResult.user.id },
      data: { photo: null },
    });

    return NextResponse.json({ data: { photo: null } });
  } catch (error) {
    console.error("Erreur suppression photo parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
