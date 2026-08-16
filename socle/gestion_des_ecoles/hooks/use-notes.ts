import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";

interface Evaluation {
  id: string;
  titre: string;
  type: string;
  dateEvaluation: string;
  noteSur: number;
  coefficient: number;
  matiere: { id: string; nom: string; code: string };
  classe: { id: string; nom: string };
  periode: { id: string; nom: string };
  _count?: { notes: number };
}

interface Note {
  id: string;
  eleveId: string;
  evaluationId: string;
  note: number | null;
  absent: boolean;
  commentaire?: string;
  eleve: { id: string; nom: string; prenom: string; matricule: string };
}

interface NoteInput {
  eleveId: string;
  note: number | null;
  absent: boolean;
  commentaire?: string;
}

export function useEvaluations(filters: { classeId?: string; matiereId?: string; periodeId?: string } = {}) {
  return useQuery({
    queryKey: ["evaluations", filters],
    queryFn: async () => {
      const response = await apiGet<Evaluation[]>("/evaluations", filters);
      return { data: response.data || [] };
    },
  });
}

export function useEvaluation(id: string | null) {
  return useQuery({
    queryKey: ["evaluation", id],
    queryFn: async () => {
      const response = await fetch(`/api/evaluations/${id}`);
      const data = await response.json();
      return data.data as Evaluation & { notes: { eleveId: string; note: number | null; absent: boolean; commentaire?: string; eleve: { id: string; nom: string; prenom: string; matricule: string } }[] };
    },
    enabled: !!id,
  });
}

export function useNotes(evaluationId: string) {
  return useQuery({
    queryKey: ["notes", evaluationId],
    queryFn: async () => {
      const response = await apiGet<Note[]>("/notes", { evaluationId });
      return { data: response.data || [] };
    },
    enabled: !!evaluationId,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      titre: string;
      type: string;
      matiereId: string;
      classeId: string;
      periodeId: string;
      dateEvaluation: string;
      noteSur?: number;
      coefficient?: number;
    }) => {
      const response = await apiPost<Evaluation>("/evaluations", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

export function useSaveNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ evaluationId, notes }: { evaluationId: string; notes: NoteInput[] }) => {
      const response = await apiPost<Note[]>("/notes", { evaluationId, notes });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes", variables.evaluationId] });
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

interface Matiere {
  id: string;
  nom: string;
  code: string;
  coefficient: number;
  couleur?: string;
  domaine?: { id: string; nom: string };
}

interface Periode {
  id: string;
  nom: string;
  numero: number;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
}

export function useMatieres() {
  return useQuery({
    queryKey: ["matieres"],
    queryFn: async () => {
      const response = await apiGet<Matiere[]>("/matieres");
      return { data: response.data || [] };
    },
  });
}

export function usePeriodes() {
  return useQuery({
    queryKey: ["periodes"],
    queryFn: async () => {
      const response = await apiGet<Periode[]>("/periodes");
      return { data: response.data || [] };
    },
  });
}
