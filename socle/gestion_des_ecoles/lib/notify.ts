import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";

export type NotifyItem = {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

function dataAsRecord(data: Prisma.InputJsonValue | undefined): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return {};
}

/** Persiste les notifications in-app puis envoie un push Expo aux appareils inscrits. */
export async function notifyUsers(items: NotifyItem[]) {
  if (items.length === 0) return { created: 0, pushed: 0 };

  await prisma.notification.createMany({
    data: items.map((item) => ({
      userId: item.userId,
      type: item.type,
      title: item.title,
      message: item.message,
      ...(item.data !== undefined ? { data: item.data } : {}),
    })),
  });

  const { sent } = await sendPushToUsers(
    items.map((item) => ({
      userId: item.userId,
      title: item.title,
      body: item.message,
      data: { type: item.type, ...dataAsRecord(item.data) },
    }))
  );

  return { created: items.length, pushed: sent };
}

export async function notifyUser(item: NotifyItem) {
  return notifyUsers([item]);
}
