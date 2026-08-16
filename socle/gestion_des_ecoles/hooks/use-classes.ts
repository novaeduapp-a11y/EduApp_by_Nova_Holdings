import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { ClasseWithRelations } from "@/types";

interface Cycle {
  id: string;
  nom: string;
}

interface CreateClasseData {
  nom: string;
  niveau: string;
  effectifMax: number;
  cycleId: string;
  anneeScolaire: string;
}

export function useClasses(anneeScolaire?: string) {
  return useQuery({
    queryKey: ["classes", anneeScolaire],
    queryFn: async () => {
      const response = await apiGet<ClasseWithRelations[]>("/classes", {
        anneeScolaire,
      });
      return { data: response.data || [] };
    },
  });
}

export function useCycles() {
  return useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const response = await apiGet<Cycle[]>("/cycles");
      return response.data || [];
    },
  });
}

export function useCreateClasse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClasseData) => {
      const response = await apiPost<ClasseWithRelations>("/classes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateClasse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClasseData> }) => {
      const response = await apiPut<ClasseWithRelations>(`/classes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useDeleteClasse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/classes/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
