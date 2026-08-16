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
const TOKEN_KEY = "eduadmins.token";
const USER_KEY = "eduadmins.user";

export type Portail = "PROFESSEUR" | "PREFET" | "DIRECTION";

export type StaffUser = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "PROFESSEUR" | "PREFET" | "DIRECTEUR";
  ecoleId: string | null;
  typeProfesseur: "MATIERE" | "PRIMAIRE" | null;
  familleCycle: "PRIMAIRE" | "COLLEGE" | "SECONDAIRE" | null;
  ecole: { id: string; nom: string; ville: string } | null;
};

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<StaffUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

export async function setSession(token: string | null, user?: StaffUser | null) {
  if (token && user) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
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

export async function loginStaff(identifier: string, password: string, portail: Portail) {
  return request<{
    data:
      | { requires2fa: true; challengeId: string; debugCode?: string }
      | { requires2fa: false; token: string; user: StaffUser };
  }>("/api/staff/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password, portail }),
  });
}

export async function verify2fa(challengeId: string, code: string) {
  return request<{ data: { token: string; user: StaffUser } }>("/api/staff/2fa", {
    method: "POST",
    body: JSON.stringify({ challengeId, code }),
  });
}

export async function fetchMe() {
  return request<{ data: StaffUser }>("/api/staff/me");
}

export async function fetchEcoles(q = "") {
  const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return request<{ data: Array<{ id: string; nom: string; ville: string }> }>(`/api/ecoles${query}`);
}

export type ProfClasse = {
  id: string;
  nom: string;
  niveau: string;
  effectif: number;
  matieres: { id: string; nom: string }[];
};

export type ProfAccueil = {
  typeProfesseur: "MATIERE" | "PRIMAIRE" | null;
  ecole: { id: string; nom: string; ville: string } | null;
  totalClasses: number;
  totalEleves: number;
  totalEvaluations: number;
  evaluationsEnAttente: number;
  classes: { id: string; nom: string; niveau: string; effectif: number; matieres: string[] }[];
  evaluations: {
    id: string;
    titre: string;
    type: string;
    classe: string;
    matiere: string;
    date: string;
    notesSaisies: number;
    effectif: number;
  }[];
};

export type ProfEvaluation = {
  id: string;
  titre: string;
  type: string;
  noteSur: number;
  coefficient: number;
  date: string;
  classe: { id: string; nom: string };
  matiere: { id: string; nom: string };
  periode: { id: string; nom: string };
  notesSaisies: number;
};

export type ProfEvaluationDetail = {
  id: string;
  titre: string;
  type: string;
  noteSur: number;
  date: string;
  classe: { id: string; nom: string };
  matiere: { id: string; nom: string };
  eleves: {
    eleveId: string;
    nom: string;
    prenom: string;
    matricule: string;
    note: number | null;
    absent: boolean;
    commentaire: string | null;
  }[];
};

export type AppelStatut = "PRESENT" | "ABSENT" | "RETARD";

export async function fetchProfAccueil() {
  return request<{ data: ProfAccueil }>("/api/staff/prof/accueil");
}

export async function fetchProfClasses() {
  return request<{ data: ProfClasse[] }>("/api/staff/prof/classes");
}

export async function fetchProfEleves(classeId: string) {
  return request<{
    data: Array<{ id: string; nom: string; prenom: string; matricule: string }>;
  }>(`/api/staff/prof/classes/${classeId}/eleves`);
}

export async function fetchProfEvaluations(classeId?: string, matiereId?: string) {
  const params = new URLSearchParams();
  if (classeId) params.set("classeId", classeId);
  if (matiereId) params.set("matiereId", matiereId);
  const query = params.toString();
  return request<{ data: ProfEvaluation[] }>(`/api/staff/prof/evaluations${query ? `?${query}` : ""}`);
}

export async function fetchProfEvaluation(id: string) {
  return request<{ data: ProfEvaluationDetail }>(`/api/staff/prof/evaluations/${id}`);
}

export async function saveProfNotes(
  evaluationId: string,
  notes: Array<{ eleveId: string; note: number | null; absent: boolean }>
) {
  return request<{ data: { saved: number } }>(`/api/staff/prof/evaluations/${evaluationId}/notes`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

export async function fetchAppel(classeId: string, date: string) {
  return request<{
    data: {
      classeId: string;
      classeNom: string;
      date: string;
      eleves: Array<{
        eleveId: string;
        nom: string;
        prenom: string;
        matricule: string;
        statut: AppelStatut;
      }>;
    };
  }>(`/api/staff/prof/appel?classeId=${encodeURIComponent(classeId)}&date=${encodeURIComponent(date)}`);
}

export async function saveAppel(
  classeId: string,
  date: string,
  lignes: Array<{ eleveId: string; statut: AppelStatut }>
) {
  return request<{ data: { saved: number } }>("/api/staff/prof/appel", {
    method: "PUT",
    body: JSON.stringify({ classeId, date, lignes }),
  });
}
