import { create } from "zustand";
import * as api from "@/lib/api";

const TOKEN_KEY = "bn-calendar-token";

export interface AuthUser {
  id: number;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  initializing: true,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    set({ initialized: true });

    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      set({ initializing: false });
      return;
    }
    try {
      const { user } = await api.fetchMe(saved);
      set({ token: saved, user, initializing: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ initializing: false });
    }
  },

  login: async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    set({ token: res.token, user: res.user });
  },

  register: async (email, password) => {
    const res = await api.register(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    set({ token: res.token, user: res.user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));
