"use client";

import { useEffect, useState } from "react";
import { GREG_MONTH_EN, MONTHS_BN, toBn, WEEKDAYS_BN_FULL } from "@/lib/banglaCalendar";
import type { Festival } from "@/lib/festivals";
import type { ModalTarget } from "@/store/calendarStore";
import type { Reminder } from "@/lib/api";
import { CategoryDot } from "./CategoryDot";

interface DateModalProps {
  target: ModalTarget | null;
  festivals: Festival[];
  initialNote: string;
  onClose: () => void;
  onSave: (iso: string, text: string) => void;

  signedIn: boolean;
  reminders: Reminder[];
  pushEnabled: boolean;
  pushBusy: boolean;
  pushError: string | null;
  onEnablePush: () => void;
  onAddReminder: (time: string, message: string) => void;
  onDeleteReminder: (id: number) => void;
}

function formatReminderTime(remindAtUtc: string): string {
  const d = new Date(`${remindAtUtc.replace(" ", "T")}Z`);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DateModal({
  target,
  festivals,
  initialNote,
  onClose,
  onSave,
  signedIn,
  reminders,
  pushEnabled,
  pushBusy,
  pushError,
  onEnablePush,
  onAddReminder,
  onDeleteReminder,
}: DateModalProps) {
  const [note, setNote] = useState(initialNote);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderMessage, setReminderMessage] = useState("");

  useEffect(() => {
    setNote(initialNote);
    setReminderMessage("");
  }, [initialNote, target]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!target) return null;

  const gdate = new Date(`${target.iso}T00:00:00`);

  function handleAddReminder() {
    if (!reminderTime || !reminderMessage.trim()) return;
    onAddReminder(reminderTime, reminderMessage.trim());
    setReminderMessage("");
  }

  return (
    <div
      className="overlay no-print open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h3>
          {toBn(target.banglaDay)} {MONTHS_BN[target.banglaMonth]} {toBn(target.banglaYear)}
        </h3>
        <p className="modal-sub">
          {WEEKDAYS_BN_FULL[gdate.getDay()]} · {GREG_MONTH_EN[gdate.getMonth()]} {gdate.getDate()},{" "}
          {gdate.getFullYear()}
        </p>
        <div className="festlist">
          {festivals.length ? (
            festivals.map((f) => (
              <span className="fest-chip" key={f.name}>
                <CategoryDot category={f.category} />
                {f.name}
              </span>
            ))
          ) : (
            <span className="empty-hint">এই দিনে কোনো উৎসব নেই</span>
          )}
        </div>
        <label htmlFor="modalNote">নোট</label>
        <textarea
          id="modalNote"
          placeholder="এই তারিখের জন্য একটি নোট লিখুন..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="reminder-section">
          <label>রিমাইন্ডার</label>

          {!signedIn && <p className="empty-hint">রিমাইন্ডার পেতে লগইন করুন।</p>}

          {signedIn && !pushEnabled && (
            <button type="button" onClick={onEnablePush} disabled={pushBusy}>
              {pushBusy ? "চালু হচ্ছে…" : "রিমাইন্ডার চালু করুন"}
            </button>
          )}

          {signedIn && pushError && <p style={{ color: "var(--accent-2)", fontSize: "0.78rem" }}>{pushError}</p>}

          {signedIn && pushEnabled && (
            <>
              {reminders.length > 0 && (
                <ul className="reminder-list">
                  {reminders.map((r) => (
                    <li key={r.id} className="reminder-item">
                      <span className="reminder-time">{formatReminderTime(r.remind_at)}</span>
                      <span className="reminder-message">{r.message}</span>
                      <button
                        type="button"
                        className="reminder-remove"
                        onClick={() => onDeleteReminder(r.id)}
                        aria-label="রিমাইন্ডার মুছুন"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="reminder-add">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  aria-label="সময়"
                />
                <input
                  type="text"
                  placeholder="রিমাইন্ডার বার্তা"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddReminder()}
                />
                <button type="button" onClick={handleAddReminder} disabled={!reminderMessage.trim()}>
                  + যোগ করুন
                </button>
              </div>
            </>
          )}
        </div>

        <div className="row">
          <button type="button" onClick={onClose}>
            বন্ধ করুন
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => {
              onSave(target.iso, note);
              onClose();
            }}
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
