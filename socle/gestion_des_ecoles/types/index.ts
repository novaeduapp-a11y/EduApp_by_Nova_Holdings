import type {
  User,
  Eleve,
  Classe,
  Matiere,
  Periode,
  Evaluation,
  Note,
  Absence,
  Bulletin,
  MoyenneMatiere,
  MoyenneGenerale,
  Cycle,
  DomaineApprentissage,
  ClasseMatiere,
  Appreciation,
  Parametre,
  LogActivite,
  Notification,
} from "@prisma/client";

export type {
  User,
  Eleve,
  Classe,
  Matiere,
  Periode,
  Evaluation,
  Note,
  Absence,
  Bulletin,
  MoyenneMatiere,
  MoyenneGenerale,
  Cycle,
  DomaineApprentissage,
  ClasseMatiere,
  Appreciation,
  Parametre,
  LogActivite,
  Notification,
};

// Types étendus avec relations
export type EleveWithClasse = Eleve & {
  classe: Classe & { cycle?: Cycle | null };
};

export type EleveWithRelations = Eleve & {
  classe: Classe & { cycle?: Cycle | null };
  notes?: (Note & { evaluation: Evaluation & { matiere: Matiere } })[];
  absences?: Absence[];
  bulletins?: Bulletin[];
  moyennesMatieres?: MoyenneMatiere[];
  moyennesGenerales?: MoyenneGenerale[];
};

export type ClasseWithRelations = Classe & {
  cycle?: Cycle | null;
  eleves?: Eleve[];
  classeMatieres?: (ClasseMatiere & { matiere: Matiere })[];
  _count?: { eleves: number };
};

export type EvaluationWithRelations = Evaluation & {
  matiere: Matiere;
  classe: Classe;
  periode: Periode;
  professeur: User;
  notes?: Note[];
};

export type NoteWithRelations = Note & {
  eleve: Eleve;
  evaluation: Evaluation & { matiere: Matiere };
};

export type AbsenceWithRelations = Absence & {
  eleve: Eleve & { classe: Classe };
  matiere?: Matiere | null;
};

export type BulletinWithRelations = Bulletin & {
  eleve: Eleve & { classe: Classe };
  periode: Periode;
};

// Types pour les formulaires
export type CreateEleveInput = {
  nom: string;
  prenom: string;
  dateNaissance: Date;
  lieuNaissance?: string;
  sexe: "M" | "F";
  classeId: string;
  nomPere?: string;
  telephonePere?: string;
  nomMere?: string;
  telephoneMere?: string;
  nomTuteur?: string;
  telephoneTuteur?: string;
  emailParent?: string;
  adresse?: string;
  photo?: string;
};

export type UpdateEleveInput = Partial<CreateEleveInput> & {
  actif?: boolean;
};

export type CreateEvaluationInput = {
  titre: string;
  type: "DEVOIR" | "COMPOSITION" | "INTERROGATION" | "TP";
  matiereId: string;
  classeId: string;
  periodeId: string;
  dateEvaluation: Date;
  noteSur?: number;
  coefficient?: number;
};

export type CreateNoteInput = {
  eleveId: string;
  evaluationId: string;
  note?: number | null;
  absent?: boolean;
  commentaire?: string;
};

export type CreateAbsenceInput = {
  eleveId: string;
  dateAbsence: Date;
  periode?: "MATIN" | "APRES_MIDI" | "JOURNEE";
  dureeHeures?: number;
  matiereId?: string;
  justifiee?: boolean;
  motif?: string;
  document?: string;
};

// Types pour les réponses API
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// Types pour les statistiques
export type DashboardStats = {
  totalEleves: number;
  totalClasses: number;
  totalMatieres: number;
  totalBulletins: number;
  elevesParNiveau: { niveau: string; count: number }[];
  absencesNonJustifiees: number;
  moyenneGenerale: number;
};

export type ClasseStats = {
  effectif: number;
  moyenneClasse: number;
  tauxReussite: number;
  absencesTotal: number;
  repartitionNotes: { range: string; count: number }[];
};

// Types pour les sessions
export type SessionUser = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: "ADMIN" | "DIRECTEUR" | "PROFESSEUR" | "PARENT" | "ELEVE";
  photo?: string | null;
};
