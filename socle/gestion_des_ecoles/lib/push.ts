import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

export type PushMessage = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function postExpoPush(
  messages: Array<{
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound: "default";
    channelId: string;
  }>
) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[push] Expo HTTP", res.status, text.slice(0, 400));
    return [] as ExpoTicket[];
  }
  const json = (await res.json()) as { data?: ExpoTicket[] };
  return json.data ?? [];
}

/** Envoie des push Expo aux utilisateurs qui ont enregistré un jeton. */
export async function sendPushToUsers(messages: PushMessage[]) {
  if (messages.length === 0) return { sent: 0 };

  const userIds = [...new Set(messages.map((m) => m.userId))];
  const tokens = await prisma.devicePushToken.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, token: true },
  });
  if (tokens.length === 0) return { sent: 0 };

  const byUser = new Map<string, typeof tokens>();
  for (const row of tokens) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  const payload: Array<{
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound: "default";
    channelId: string;
    _tokenId: string;
  }> = [];

  for (const message of messages) {
    const userTokens = byUser.get(message.userId);
    if (!userTokens?.length) continue;
    for (const row of userTokens) {
      payload.push({
        to: row.token,
        title: message.title,
        body: message.body.slice(0, 240),
        data: message.data,
        sound: "default",
        channelId: "default",
        _tokenId: row.id,
      });
    }
  }

  if (payload.length === 0) return { sent: 0 };

  const invalidTokenIds = new Set<string>();
  let sent = 0;

  for (const batch of chunk(payload, BATCH_SIZE)) {
    try {
      const tickets = await postExpoPush(
        batch.map((item) => ({
          to: item.to,
          title: item.title,
          body: item.body,
          data: item.data,
          sound: item.sound,
          channelId: item.channelId,
        }))
      );
      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          sent += 1;
          return;
        }
        const err = ticket.details?.error ?? "";
        if (err === "DeviceNotRegistered" || /not.?registered/i.test(ticket.message ?? "")) {
          invalidTokenIds.add(batch[index]._tokenId);
        } else {
          console.warn("[push] ticket error:", ticket.message ?? err);
        }
      });
    } catch (error) {
      console.error("[push] envoi échoué:", error);
    }
  }

  if (invalidTokenIds.size > 0) {
    await prisma.devicePushToken.deleteMany({
      where: { id: { in: [...invalidTokenIds] } },
    });
  }

  return { sent };
}
