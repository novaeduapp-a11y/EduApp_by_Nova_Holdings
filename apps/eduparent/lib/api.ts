import Constants from "expo-constants";
import { storageGet, storageRemove, storageSet } from "@/lib/storage";

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
  return storageGet(TOKEN_KEY);
}

export async function getStoredUser(): Promise<ParentUser | null> {
  const raw = await storageGet(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParentUser;
  } catch {
    return null;
  }
}

export async function setToken(token: string | null, user?: ParentUser | null): Promise<void> {
  if (token) {
    await storageSet(TOKEN_KEY, token);
    if (user) await storageSet(USER_KEY, JSON.stringify(user));
  } else {
    await storageRemove(TOKEN_KEY);
    await storageRemove(USER_KEY);
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
  const body = await request<{
    data:
      | { requires2fa: true; challengeId: string; debugCode?: string }
      | { requires2fa?: false; token: string; user: ParentUser };
  }>("/api/mobile/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
  if ("requires2fa" in body.data && body.data.requires2fa) {
    return {
      requires2fa: true as const,
      challengeId: body.data.challengeId,
      debugCode: body.data.debugCode,
    };
  }
  await setToken(body.data.token, body.data.user);
  return { requires2fa: false as const, user: body.data.user };
}

export async function verifyParent2fa(challengeId: string, code: string) {
  const body = await request<{ data: { token: string; user: ParentUser } }>("/api/mobile/2fa", {
    method: "POST",
    body: JSON.stringify({ challengeId, code }),
  });
  await setToken(body.data.token, body.data.user);
  return body.data.user;
}

export async function updateCompte(payload: {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string | null;
  adresse?: string | null;
}) {
  return request<{
    data: { prenom: string; nom: string; email: string; telephone: string | null; adresse: string | null };
  }>("/api/parent/compte", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateComptePassword(currentPassword: string, newPassword: string) {
  return request<{ data: { ok: boolean } }>("/api/parent/compte/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function updateCompte2fa(
  payload:
    | { action: "start" }
    | { action: "enable"; challengeId: string; code: string }
    | { action: "disable"; password: string }
) {
  return request<{
    data: { challengeId?: string; debugCode?: string; twoFactorEnabled?: boolean };
  }>("/api/parent/compte/2fa", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
        kind: "ABSENCE" | "RETARD";
        matiere: string | null;
        trimestre: string;
      }>;
      stats: { total: number; retards: number; justifiees: number; nonJustifiees: number };
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

export async function fetchBulletin(eleveId: string, bulletinId: string) {
  return request<{
    data: {
      id: string;
      ecole: { nom: string; adresse: string; telephone: string; email: string };
      eleve: {
        nom: string;
        prenom: string;
        matricule: string;
        dateNaissance: string;
        classe: string;
        effectif: number;
      };
      periode: { nom: string; anneeScolaire: string };
      notes: Array<{
        matiere: string;
        note: number;
        noteSur: number;
        coefficient: number;
        moyenne: number;
        appreciation: string;
      }>;
      moyenneGenerale: number;
      rang: number;
      mention: string;
      appreciationGenerale: string;
      dateGeneration: string;
    };
  }>(`/api/parent/enfants/${eleveId}/bulletins/${bulletinId}`);
}

export async function fetchCompte() {
  return request<{
    data: {
      profil: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        telephone: string | null;
        adresse?: string | null;
        twoFactorEnabled?: boolean;
        role: string;
      };
      etablissement: {
        nom: string;
        ville: string;
        adresse: string;
        telephone: string;
        email: string;
        anneeScolaire: string;
      };
      enfants: Array<{
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
        classe: string;
        relation: string;
      }>;
      notificationsNonLues: number;
    };
  }>("/api/parent/compte");
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
      absences: { total: number; retards: number; nonJustifiees: number };
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
      data: { eleveId?: string; filId?: string; bulletinId?: string; date?: string } | null;
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
        id: string | null;
        professeurId: string;
        professeur: string;
        matiere: string | null;
        dernierMessage: string | null;
        date: string | null;
        nonLus: number;
      }>;
    };
  }>(`/api/parent/enfants/${eleveId}/messagerie`);
}

export async function startConversation(eleveId: string, professeurId: string, corps: string) {
  return request<{ data: { filId: string; messageId: string } }>(
    `/api/parent/enfants/${eleveId}/messagerie`,
    { method: "POST", body: JSON.stringify({ professeurId, corps }) }
  );
}

export async function fetchConversation(eleveId: string, filId: string) {
  return request<{
    data: {
      id: string;
      professeur: string;
      matiere: string | null;
      messages: Array<{
        id: string;
        auteurId: string;
        auteur: string;
        role: string;
        corps: string;
        createdAt: string;
      }>;
    };
  }>(`/api/parent/enfants/${eleveId}/messagerie/${filId}`);
}

export async function replyToFil(eleveId: string, filId: string, corps: string) {
  return request<{ data: { id: string } }>(`/api/parent/enfants/${eleveId}/messagerie/${filId}`, {
    method: "POST",
    body: JSON.stringify({ corps }),
  });
}
