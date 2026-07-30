import { create } from "zustand";
import * as api from "@/lib/api";
import { pushSupported, subscribeToPush } from "@/lib/push";

interface ReminderState {
  remindersByDate: Record<string, api.Reminder[]>;
  pushEnabled: boolean;
  pushBusy: boolean;
  pushError: string | null;

  loadReminders: (token: string) => Promise<void>;
  clearReminders: () => void;
  enablePush: (token: string) => Promise<void>;
  addReminder: (token: string, date: string, remindAtIso: string, message: string) => Promise<void>;
  removeReminder: (token: string, id: number, date: string) => Promise<void>;
}

function groupByDate(reminders: api.Reminder[]): Record<string, api.Reminder[]> {
  const grouped: Record<string, api.Reminder[]> = {};
  for (const r of reminders) {
    (grouped[r.note_date] ||= []).push(r);
  }
  return grouped;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  remindersByDate: {},
  pushEnabled: false,
  pushBusy: false,
  pushError: null,

  loadReminders: async (token) => {
    try {
      const { reminders } = await api.fetchReminders(token);
      set({ remindersByDate: groupByDate(reminders) });
    } catch {
      // best-effort; leave whatever was already loaded
    }

    if (pushSupported()) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const existing = await registration?.pushManager.getSubscription();
        set({ pushEnabled: !!existing });
      } catch {
        set({ pushEnabled: false });
      }
    }
  },

  clearReminders: () => set({ remindersByDate: {}, pushEnabled: false }),

  enablePush: async (token) => {
    if (!pushSupported()) {
      set({ pushError: "এই ব্রাউজারে পুশ নোটিফিকেশন সমর্থিত নয় (push notifications not supported)" });
      return;
    }
    set({ pushBusy: true, pushError: null });
    try {
      const { publicKey } = await api.fetchVapidPublicKey();
      const subscription = await subscribeToPush(publicKey);
      await api.subscribePush(token, subscription.toJSON());
      set({ pushEnabled: true });
    } catch (err) {
      set({ pushError: err instanceof Error ? err.message : "রিমাইন্ডার চালু করা যায়নি" });
    } finally {
      set({ pushBusy: false });
    }
  },

  addReminder: async (token, date, remindAtIso, message) => {
    const created = await api.createReminder(token, date, remindAtIso, message);
    set((state) => ({
      remindersByDate: {
        ...state.remindersByDate,
        [date]: [...(state.remindersByDate[date] || []), created],
      },
    }));
  },

  removeReminder: async (token, id, date) => {
    const prev = get().remindersByDate[date] || [];
    set((state) => ({
      remindersByDate: { ...state.remindersByDate, [date]: prev.filter((r) => r.id !== id) },
    }));
    try {
      await api.deleteReminder(token, id);
    } catch {
      set((state) => ({ remindersByDate: { ...state.remindersByDate, [date]: prev } }));
    }
  },
}));
