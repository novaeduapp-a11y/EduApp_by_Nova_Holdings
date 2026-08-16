import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: "ADMIN" | "DIRECTEUR" | "PROFESSEUR" | "PARENT";
  telephone?: string;
  adresse?: string;
  actif: boolean;
  photo?: string;
  createdAt: string;
}

interface UsersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

interface CreateUserInput {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: "ADMIN" | "DIRECTEUR" | "PROFESSEUR" | "PARENT";
  telephone?: string;
  adresse?: string;
}

interface UpdateUserInput {
  nom?: string;
  prenom?: string;
  email?: string;
  password?: string;
  role?: "ADMIN" | "DIRECTEUR" | "PROFESSEUR" | "PARENT";
  telephone?: string;
  adresse?: string;
  actif?: boolean;
}

export function useUsers(filters: UsersFilters = {}) {
  const { page = 1, limit = 10, search, role } = filters;

  return useQuery({
    queryKey: ["users", { page, limit, search, role }],
    queryFn: async () => {
      const response = await apiGet<User[]>("/users", {
        page,
        limit,
        search,
        role,
      });
      return {
        data: response.data || [],
        meta: response.meta as UsersMeta | undefined,
      };
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const response = await apiGet<User>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await apiPost<User>("/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await apiPut<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/users/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
