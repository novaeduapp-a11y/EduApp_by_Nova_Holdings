import { useEffect, useRef } from "react";
import { useRouter, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import { useSession } from "@/context/session";
import { ensureNotificationHandler } from "@/lib/push";

function responseKey(response: Notifications.NotificationResponse) {
  return (
    response.notification.request.identifier ||
    `${response.notification.date}:${response.actionIdentifier}`
  );
}

/** Écoute les taps push et rafraîchit les badges à la réception. */
export function PushBootstrap() {
  const { user, refresh, selectChild } = useSession();
  const router = useRouter();
  const refreshRef = useRef(refresh);
  const selectChildRef = useRef(selectChild);
  const routerRef = useRef(router);
  const handledKeys = useRef(new Set<string>());

  refreshRef.current = refresh;
  selectChildRef.current = selectChild;
  routerRef.current = router;

  useEffect(() => {
    if (!user) return;
    ensureNotificationHandler();

    const openFromData = (data: Record<string, unknown> | undefined) => {
      void refreshRef.current().catch(() => undefined);
      const eleveId = typeof data?.eleveId === "string" ? data.eleveId : null;
      if (eleveId) selectChildRef.current(eleveId);

      const type = typeof data?.type === "string" ? data.type : "";
      if (type === "message" && eleveId && typeof data?.filId === "string") {
        routerRef.current.push({
          pathname: "/conversation",
          params: { filId: data.filId, eleveId },
        } as Href);
        return;
      }
      routerRef.current.push("/notifications" as Href);
    };

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const key = responseKey(response);
      if (handledKeys.current.has(key)) return;
      handledKeys.current.add(key);
      try {
        const raw = response.notification.request.content.data;
        const data =
          raw && typeof raw === "object" && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : undefined;
        openFromData(data);
      } catch (error) {
        console.warn("[push] ouverture notification:", error);
      } finally {
        void Notifications.clearLastNotificationResponseAsync();
      }
    };

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // Bandeau système déjà géré par setNotificationHandler — on met juste à jour les badges.
      void refreshRef.current().catch(() => undefined);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(handleResponse);

    void Notifications.getLastNotificationResponseAsync()
      .then(handleResponse)
      .catch(() => undefined);

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user]);

  return null;
}
