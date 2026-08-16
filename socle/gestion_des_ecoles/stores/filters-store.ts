import { create } from "zustand";

interface FiltersState {
  // Filtres élèves
  eleveFilters: {
    classeId: string;
    search: string;
    actif: boolean | null;
  };
  setEleveFilters: (filters: Partial<FiltersState["eleveFilters"]>) => void;
  resetEleveFilters: () => void;

  // Filtres notes
  noteFilters: {
    classeId: string;
    matiereId: string;
    periodeId: string;
    type: string;
  };
  setNoteFilters: (filters: Partial<FiltersState["noteFilters"]>) => void;
  resetNoteFilters: () => void;

  // Filtres absences
  absenceFilters: {
    classeId: string;
    eleveId: string;
    dateDebut: Date | null;
    dateFin: Date | null;
    justifiee: boolean | null;
  };
  setAbsenceFilters: (filters: Partial<FiltersState["absenceFilters"]>) => void;
  resetAbsenceFilters: () => void;

  // Période active
  periodeActiveId: string;
  setPeriodeActiveId: (id: string) => void;
}

const defaultEleveFilters = {
  classeId: "",
  search: "",
  actif: null,
};

const defaultNoteFilters = {
  classeId: "",
  matiereId: "",
  periodeId: "",
  type: "",
};

const defaultAbsenceFilters = {
  classeId: "",
  eleveId: "",
  dateDebut: null,
  dateFin: null,
  justifiee: null,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  eleveFilters: defaultEleveFilters,
  setEleveFilters: (filters) =>
    set((state) => ({
      eleveFilters: { ...state.eleveFilters, ...filters },
    })),
  resetEleveFilters: () => set({ eleveFilters: defaultEleveFilters }),

  noteFilters: defaultNoteFilters,
  setNoteFilters: (filters) =>
    set((state) => ({
      noteFilters: { ...state.noteFilters, ...filters },
    })),
  resetNoteFilters: () => set({ noteFilters: defaultNoteFilters }),

  absenceFilters: defaultAbsenceFilters,
  setAbsenceFilters: (filters) =>
    set((state) => ({
      absenceFilters: { ...state.absenceFilters, ...filters },
    })),
  resetAbsenceFilters: () => set({ absenceFilters: defaultAbsenceFilters }),

  periodeActiveId: "",
  setPeriodeActiveId: (periodeActiveId) => set({ periodeActiveId }),
}));
