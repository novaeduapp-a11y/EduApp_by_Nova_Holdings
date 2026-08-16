import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

function getApiUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  const isLoopback = /localhost|127\.0\.0\.1/.test(env);
  if (!isLoopback) return env.replace(/\/$/, "");

  const host = (Constants.expoConfig?.hostUri ?? "").split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:3000`;
  }
  return env.replace(/\/$/, "");
}
const TOKEN_KEY = "eduparent.token";
const USER_KEY = "eduparent.user";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<ParentUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParentUser;
  } catch {
    return null;
  }
}

export async function setToken(token: string | null, user?: ParentUser | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, { ...init, headers });
  } catch {
    throw new Error("Réseau indisponible. iPhone et Mac doivent être sur le même Wi-Fi.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "Une erreur est survenue");
  }
  return body as T;
}

export type ParentUser = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
};

export type Enfant = {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  photo: string | null;
  classe: string;
  cycle: string | null;
  relation: string;
};

export async function login(identifier: string, password: string) {
  const body = await request<{ data: { token: string; user: ParentUser } }>(
    "/api/mobile/login",
    {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }
  );
  await setToken(body.data.token, body.data.user);
  return body.data.user;
}

export async function fetchEnfants() {
  const body = await request<{ data: Enfant[] }>("/api/parent/enfants");
  return body.data;
}

export async function fetchNotes(eleveId: string) {
  return request<{
    data: {
      notes: Array<{
        id: string;
        valeur: number | null;
        noteMax: number;
        evaluation: string;
        type: string;
        date: string;
        matiere: string;
        periode: string;
        coefficient: number;
      }>;
      moyennesMatieres: Array<{ matiere: string; moyenne: number | null; periode: string }>;
      moyennesGenerales: Array<{
        moyenne: number | null;
        rang: number | null;
        mention: string | null;
        periode: string;
      }>;
    };
  }>(`/api/parent/enfants/${eleveId}/notes`);
}

export async function fetchAbsences(eleveId: string) {
  return request<{
    data: {
      absences: Array<{
        id: string;
        date: string;
        periode: string;
        heures: number | null;
        motif: string | null;
        justifiee: boolean;
        matiere: string | null;
      }>;
      stats: { total: number; justifiees: number; nonJustifiees: number };
    };
  }>(`/api/parent/enfants/${eleveId}/absences`);
}

export async function fetchBulletins(eleveId: string) {
  return request<{
    data: Array<{
      id: string;
      periode: string;
      moyenne: number | null;
      rang: number | null;
      mention: string | null;
      dateGeneration: string;
      classe: string;
      fichierPdf: string | null;
    }>;
  }>(`/api/parent/enfants/${eleveId}/bulletins`);
}

export async function downloadBulletinPdf(eleveId: string, bulletinId: string, filename: string): Promise<string> {
  const FileSystem = await import("expo-file-system/legacy");
  const token = await getToken();
  const API_URL = getApiUrl();
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error("Stockage indisponible sur cet appareil");

  try {
    const result = await FileSystem.downloadAsync(
      `${API_URL}/api/parent/enfants/${eleveId}/bulletins/${bulletinId}/pdf`,
      `${cacheDir}${filename}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (result.status !== 200) {
      throw new Error("Impossible de télécharger le bulletin");
    }
    return result.uri;
  } catch (err) {
    if (err instanceof Error && err.message !== "Impossible de télécharger le bulletin") {
      throw new Error("Réseau indisponible. Vérifiez votre connexion.");
    }
    throw err;
  }
}

export async function fetchAccueil(eleveId: string) {
  return request<{
    data: {
      notesRecentes: Array<{
        id: string;
        valeur: number | null;
        matiere: string;
        evaluation: string;
      }>;
      absences: { total: number; nonJustifiees: number };
      moyenne: { valeur: number | null; periode: string; mention: string | null } | null;
      notificationsNonLues: number;
      coursDuJour: Array<{ matiere: string; horaire: string; salle: string | null }>;
    };
  }>(`/api/parent/enfants/${eleveId}/accueil`);
}

export async function fetchNotifications() {
  return request<{
    data: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      readAt: string | null;
      createdAt: string;
    }>;
  }>("/api/parent/notifications");
}

export async function markNotificationsRead(payload: { ids?: string[]; all?: boolean }) {
  return request<{ data: { unread: number } }>("/api/parent/notifications", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchEmploiDuTemps(eleveId: string) {
  return request<{
    data: {
      semaine: Array<{
        jour: "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI";
        label: string;
        cours: Array<{
          matiere: string;
          horaire: string;
          salle: string | null;
          professeur: string | null;
        }>;
      }>;
    };
  }>(`/api/parent/enfants/${eleveId}/emploi-du-temps`);
}

export async function fetchMessagerie(eleveId: string) {
  return request<{
    data: {
      fils: Array<{
        id: string;
        professeur: string;
        matiere: string | null;
        dernierMessage: string | null;
        date: string | null;
        nonLus: number;
      }>;
    };
  }>(`/api/parent/enfants/${eleveId}/messagerie`);
}
