import { create } from "zustand";
import * as api from "@/lib/api";

const STORAGE_KEY = "bn-calendar-notes";

function readLocalNotes(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function writeLocalNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore persistence failures (e.g. private browsing)
  }
}

interface NotesState {
  notes: Record<string, string>;
  syncing: boolean;
  uploadedGuestNotesForToken: string | null;
  loadGuestNotes: () => void;
  syncWithToken: (token: string) => Promise<void>;
  setNote: (token: string | null, isoDate: string, text: string) => void;
}

/**
 * Guest (no token): notes live only in localStorage.
 * Signed in: notes are fetched from / saved to the MySQL-backed API.
 * On the first sign-in, any local guest notes are uploaded so nothing is lost.
 */
export const useNotesStore = create<NotesState>((set, get) => ({
  notes: {},
  syncing: false,
  uploadedGuestNotesForToken: null,

  loadGuestNotes: () => {
    set({ notes: readLocalNotes() });
  },

  syncWithToken: async (token) => {
    const { uploadedGuestNotesForToken } = get();
    set({ syncing: true });
    try {
      const guestNotes = uploadedGuestNotesForToken === token ? {} : readLocalNotes();
      const guestEntries = Object.entries(guestNotes);

      const { notes: remoteNotes } = await api.fetchNotes(token);

      if (guestEntries.length) {
        await Promise.all(
          guestEntries
            .filter(([date]) => !(date in remoteNotes))
            .map(([date, text]) => api.saveNote(token, date, text)),
        );
        set({ uploadedGuestNotesForToken: token });
      }

      set({ notes: { ...guestNotes, ...remoteNotes } });
    } catch {
      set({ notes: readLocalNotes() });
    } finally {
      set({ syncing: false });
    }
  },

  setNote: (token, isoDate, text) => {
    const next = { ...get().notes };
    if (text.trim()) next[isoDate] = text.trim();
    else delete next[isoDate];
    set({ notes: next });

    if (token) {
      api.saveNote(token, isoDate, text).catch(() => {
        /* best-effort; UI already reflects the optimistic update */
      });
    } else {
      writeLocalNotes(next);
    }
  },
}));
