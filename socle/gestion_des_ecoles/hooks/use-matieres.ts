import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface Domaine {
  id: string;
  nom: string;
  code: string;
}

interface Matiere {
  id: string;
  nom: string;
  code: string;
  coefficient: number;
  domaineId: string;
  domaine?: Domaine;
}

interface DomaineWithMatieres extends Domaine {
  matieres: Matiere[];
}

// Hook pour récupérer les matières
export function useMatieres() {
  return useQuery({
    queryKey: ["matieres"],
    queryFn: async () => {
      const response = await apiGet<Matiere[]>("/matieres");
      return response.data;
    },
  });
}

// Hook pour récupérer les domaines avec leurs matières
export function useDomaines() {
  return useQuery({
    queryKey: ["domaines"],
    queryFn: async () => {
      const response = await apiGet<DomaineWithMatieres[]>("/domaines");
      return response.data;
    },
  });
}

// Hook pour créer une matière
export function useCreateMatiere() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nom: string; code: string; coefficient: number; domaineId: string }) => {
      const response = await apiPost<Matiere>("/matieres", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
    },
  });
}

// Hook pour modifier une matière
export function useUpdateMatiere() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Matiere> }) => {
      const response = await apiPut<Matiere>(`/matieres/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
    },
  });
}

// Hook pour supprimer une matière
export function useDeleteMatiere() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/matieres/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matieres"] });
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
    },
  });
}
