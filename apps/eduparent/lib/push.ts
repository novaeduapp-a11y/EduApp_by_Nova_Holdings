import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { deletePushToken, registerPushToken } from "@/lib/api";

let cachedToken: string | null = null;
let handlerReady = false;

/** À appeler au runtime (pas au chargement du module) pour éviter un crash natif au boot iOS. */
export function ensureNotificationHandler() {
  if (handlerReady) return;
  handlerReady = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.warn("[push] handler impossible:", error);
  }
}

function projectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId ??
    null
  );
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "EduParent",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1A5FD4",
  });
}

/** Demande la permission et enregistre le jeton Expo auprès de l’API. */
export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) return null;
    ensureNotificationHandler();

    await ensureAndroidChannel();

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== "granted") {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== "granted") return null;

    const id = projectId();
    if (!id) {
      console.warn("[push] projectId EAS manquant");
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId: id });
    const token = tokenResponse.data;
    if (!token) return null;

    cachedToken = token;
    await registerPushToken(token, Platform.OS === "ios" ? "ios" : "android");
    return token;
  } catch (error) {
    console.warn("[push] enregistrement impossible:", error);
    return null;
  }
}

export async function unregisterPushNotifications() {
  try {
    const token = cachedToken;
    cachedToken = null;
    await deletePushToken(token ?? undefined);
  } catch {
    /* ignore */
  }
}

export function getCachedPushToken() {
  return cachedToken;
}
