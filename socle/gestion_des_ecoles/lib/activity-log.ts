import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logActivite(input: {
  userId?: string | null;
  action: string;
  table?: string | null;
  recordId?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    const headerList = headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      headerList.get("cf-connecting-ip") ||
      null;
    const userAgent = headerList.get("user-agent")?.slice(0, 280) || null;

    await prisma.logActivite.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        table: input.table ?? null,
        recordId: input.recordId ?? null,
        details: (input.details ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Journal activité:", error);
  }
}
