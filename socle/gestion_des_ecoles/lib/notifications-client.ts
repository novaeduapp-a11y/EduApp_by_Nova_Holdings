export const NOTIFICATIONS_CHANGED_EVENT = "eduapps:notifications-changed";

/** Met à jour le badge du shell après une lecture d’alertes. */
export function emitNotificationsChanged(unread?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, {
      detail: { unread },
    })
  );
}
