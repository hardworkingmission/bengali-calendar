import { create } from "zustand";

export type ViewMode = "month" | "year";

export interface ModalTarget {
  iso: string;
  banglaYear: number;
  banglaMonth: number;
  banglaDay: number;
}

interface CalendarState {
  mode: ViewMode;
  banglaYear: number;
  banglaMonth: number;
  yearInput: string;
  modalTarget: ModalTarget | null;
  hydrated: boolean;

  hydrate: (banglaYear: number, banglaMonth: number) => void;
  setMode: (mode: ViewMode) => void;
  goPrev: () => void;
  goNext: () => void;
  goToday: (banglaYear: number, banglaMonth: number) => void;
  setYearInput: (value: string) => void;
  jumpToYear: () => void;
  openModal: (iso: string, banglaYear: number, banglaMonth: number, banglaDay: number) => void;
  closeModal: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  mode: "month",
  banglaYear: 0,
  banglaMonth: 0,
  yearInput: "",
  modalTarget: null,
  hydrated: false,

  hydrate: (banglaYear, banglaMonth) => {
    if (get().hydrated) return;
    set({ banglaYear, banglaMonth, yearInput: String(banglaYear), hydrated: true });
  },

  setMode: (mode) => set({ mode }),

  goPrev: () => {
    const { mode, banglaMonth, banglaYear } = get();
    if (mode === "month") {
      if (banglaMonth === 0) set({ banglaMonth: 11, banglaYear: banglaYear - 1 });
      else set({ banglaMonth: banglaMonth - 1 });
    } else {
      set({ banglaYear: banglaYear - 1 });
    }
  },

  goNext: () => {
    const { mode, banglaMonth, banglaYear } = get();
    if (mode === "month") {
      if (banglaMonth === 11) set({ banglaMonth: 0, banglaYear: banglaYear + 1 });
      else set({ banglaMonth: banglaMonth + 1 });
    } else {
      set({ banglaYear: banglaYear + 1 });
    }
  },

  goToday: (banglaYear, banglaMonth) => {
    set({ banglaYear, banglaMonth, yearInput: String(banglaYear) });
  },

  setYearInput: (value) => set({ yearInput: value }),

  jumpToYear: () => {
    const v = parseInt(get().yearInput, 10);
    if (!Number.isNaN(v)) set({ banglaYear: v });
  },

  openModal: (iso, banglaYear, banglaMonth, banglaDay) => {
    set({ modalTarget: { iso, banglaYear, banglaMonth, banglaDay } });
  },

  closeModal: () => set({ modalTarget: null }),
}));
