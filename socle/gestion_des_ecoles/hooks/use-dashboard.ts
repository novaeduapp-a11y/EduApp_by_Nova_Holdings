import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface DashboardStats {
  totalEleves: number;
  totalClasses: number;
  totalMatieres: number;
  totalEvaluations: number;
  absencesNonJustifiees: number;
  elevesActifs: number;
  tauxReussiteGlobal: number;
  elevesEnDifficulte: number;
}

interface CycleCount {
  cycle: string;
  count: number;
}

interface Activity {
  id: string;
  description: string;
  date: string;
}

interface Alert {
  type: string;
  message: string;
  link: string;
}

interface TauxReussiteClasse {
  classe: string;
  classeId: string;
  effectif: number;
  elevesEvalues: number;
  elevesReussis: number;
  tauxReussite: number;
}

interface EleveEnDifficulte {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  moyenne: string | null;
  periode: string;
}

interface ElevesEnDifficulteParClasse {
  classe: string;
  classeId: string;
  effectif: number;
  enDifficulte: number;
  pourcentage: number;
}

interface DashboardData {
  stats: DashboardStats;
  elevesParCycle: CycleCount[];
  tauxReussiteParClasse: TauxReussiteClasse[];
  elevesEnDifficulte: EleveEnDifficulte[];
  elevesEnDifficulteParClasse: ElevesEnDifficulteParClasse[];
  activitesRecentes: {
    inscriptions: Activity[];
    absences: Activity[];
  };
  alertes: Alert[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await apiGet<DashboardData>("/dashboard");
      return response.data;
    },
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });
}
