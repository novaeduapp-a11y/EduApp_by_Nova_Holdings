import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface Absence {
  id: string;
  eleveId: string;
  dateAbsence: string;
  periode: "MATIN" | "APRES_MIDI" | "JOURNEE";
  dureeHeures?: number;
  justifiee: boolean;
  motif?: string;
  document?: string;
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    classe: { id: string; nom: string };
  };
  matiere?: { id: string; nom: string } | null;
}

interface AbsencesMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AbsencesFilters {
  page?: number;
  limit?: number;
  eleveId?: string;
  classeId?: string;
  justifiee?: boolean | null;
  dateDebut?: string;
  dateFin?: string;
}

export function useAbsences(filters: AbsencesFilters = {}) {
  const { page = 1, limit = 20, classeId, justifiee, dateDebut, dateFin } = filters;

  return useQuery({
    queryKey: ["absences", filters],
    queryFn: async () => {
      const response = await apiGet<Absence[]>("/absences", {
        page,
        limit,
        classeId,
        justifiee: justifiee !== null ? justifiee : undefined,
        dateDebut,
        dateFin,
      });
      return {
        data: response.data || [],
        meta: response.meta as AbsencesMeta | undefined,
      };
    },
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eleveId: string;
      dateAbsence: string;
      periode?: "MATIN" | "APRES_MIDI" | "JOURNEE";
      dureeHeures?: number;
      matiereId?: string;
      justifiee?: boolean;
      motif?: string;
    }) => {
      const response = await apiPost<Absence>("/absences", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
    },
  });
}

export function useJustifyAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motif }: { id: string; motif: string }) => {
      const response = await apiPut<Absence>(`/absences/${id}`, { justifiee: true, motif });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
    },
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/absences/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absences"] });
    },
  });
}
