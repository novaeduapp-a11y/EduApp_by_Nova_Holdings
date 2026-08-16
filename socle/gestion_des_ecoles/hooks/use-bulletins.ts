"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Bulletin {
  id: string;
  eleveId: string;
  periodeId: string;
  eleve: string;
  matricule: string;
  classe: string;
  periode: string;
  moyenne: number | null;
  rang: number | null;
  mention: string | null;
  tokenQr: string;
  date: string;
  generePar: string | null;
}

interface BulletinFilters {
  classeId?: string;
  periodeId?: string;
  search?: string;
}

export function useBulletins(filters: BulletinFilters = {}) {
  return useQuery({
    queryKey: ["bulletins", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.classeId) params.append("classeId", filters.classeId);
      if (filters.periodeId) params.append("periodeId", filters.periodeId);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/bulletins?${params.toString()}`);
      const data = await response.json();
      return { data: (data.data || []) as Bulletin[] };
    },
  });
}

interface GenerateBulletinParams {
  eleveId: string;
  periodeId: string;
}

interface BulletinData {
  ecole: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
  };
  eleve: {
    nom: string;
    prenom: string;
    matricule: string;
    dateNaissance: string;
    classe: string;
    effectif: number;
  };
  periode: {
    nom: string;
    anneeScolaire: string;
  };
  notes: {
    matiere: string;
    note: number;
    noteSur: number;
    coefficient: number;
    moyenne: number;
    appreciation: string;
  }[];
  moyenneGenerale: number;
  rang: number;
  mention: string;
  appreciationGenerale: string;
  qrCodeUrl: string;
  dateGeneration: string;
}

export function useGenerateBulletin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateBulletinParams): Promise<{ bulletin: Bulletin; bulletinData: BulletinData }> => {
      const response = await fetch("/api/bulletins/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erreur lors de la génération");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] });
    },
  });
}

export function useGenerateBulletinsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { eleveIds: string[]; periodeId: string }): Promise<{ success: number; failed: number; results: { eleveId: string; success: boolean; error?: string }[] }> => {
      const results: { eleveId: string; success: boolean; error?: string }[] = [];
      let success = 0;
      let failed = 0;

      for (const eleveId of params.eleveIds) {
        try {
          const response = await fetch("/api/bulletins/generer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eleveId, periodeId: params.periodeId }),
          });

          if (response.ok) {
            results.push({ eleveId, success: true });
            success++;
          } else {
            const error = await response.json();
            results.push({ eleveId, success: false, error: error.error?.message });
            failed++;
          }
        } catch (error) {
          results.push({ eleveId, success: false, error: String(error) });
          failed++;
        }
      }

      return { success, failed, results };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] });
    },
  });
}
