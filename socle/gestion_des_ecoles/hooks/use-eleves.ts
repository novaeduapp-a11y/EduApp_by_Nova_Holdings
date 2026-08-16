import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { EleveWithClasse, EleveWithRelations, PaginationParams } from "@/types";
import type { CreateEleveInput, UpdateEleveInput } from "@/lib/validations/eleve";

interface ElevesMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ElevesFilters extends PaginationParams {
  classeId?: string;
  actif?: boolean | null;
}

export function useEleves(filters: ElevesFilters = {}) {
  const { page = 1, limit = 10, search, classeId, actif } = filters;

  return useQuery({
    queryKey: ["eleves", { page, limit, search, classeId, actif }],
    queryFn: async () => {
      const response = await apiGet<EleveWithClasse[]>("/eleves", {
        page,
        limit,
        search,
        classeId,
        actif: actif !== null ? actif : undefined,
      });
      return {
        data: response.data || [],
        meta: response.meta as ElevesMeta | undefined,
      };
    },
  });
}

export function useEleve(id: string) {
  return useQuery({
    queryKey: ["eleve", id],
    queryFn: async () => {
      const response = await apiGet<EleveWithRelations>(`/eleves/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

interface CreateEleveResponse extends EleveWithClasse {
  accountCreated?: boolean;
  credentials?: {
    matricule: string;
    password: string;
  } | null;
}

export function useCreateEleve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEleveInput & { createAccount?: boolean }) => {
      const response = await apiPost<CreateEleveResponse>("/eleves", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
    },
  });
}

export function useUpdateEleve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEleveInput }) => {
      const response = await apiPut<EleveWithClasse>(`/eleves/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      queryClient.invalidateQueries({ queryKey: ["eleve", variables.id] });
    },
  });
}

export function useDeleteEleve() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete(`/eleves/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
    },
  });
}
