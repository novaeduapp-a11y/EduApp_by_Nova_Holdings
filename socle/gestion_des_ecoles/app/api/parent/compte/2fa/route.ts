import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireParent } from "@/lib/request-auth";
import {
  disableOwnTwoFactor,
  enableOwnTwoFactor,
  startOwnTwoFactor,
} from "@/lib/account-security";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({
    action: z.literal("enable"),
    challengeId: z.string().min(1),
    code: z.string().min(6).max(6),
  }),
  z.object({
    action: z.literal("disable"),
    password: z.string().min(1),
  }),
]);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireParent();
    if (!authResult.ok) return authResult.response;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Action A2F incomplète" }, { status: 400 });
    }

    if (parsed.data.action === "start") {
      const data = await startOwnTwoFactor(authResult.user.id);
      return NextResponse.json({ data });
    }

    if (parsed.data.action === "enable") {
      const result = await enableOwnTwoFactor(
        authResult.user.id,
        parsed.data.challengeId,
        parsed.data.code
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ data: { twoFactorEnabled: true } });
    }

    const result = await disableOwnTwoFactor(authResult.user.id, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: { twoFactorEnabled: false } });
  } catch (error) {
    console.error("Erreur A2F parent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
