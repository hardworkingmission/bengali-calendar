"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { gregorianToBangla, isoDate, GREG_MONTH_EN, MONTHS_BN, toBn, addDays, banglaMonthStart } from "@/lib/banglaCalendar";
import { buildFestivalIndex } from "@/lib/festivals";
import { useAuthStore } from "@/store/authStore";
import { useNotesStore } from "@/store/notesStore";
import { useCalendarStore } from "@/store/calendarStore";
import { useReminderStore } from "@/store/reminderStore";
import { Legend } from "./Legend";
import { MonthGrid } from "./MonthGrid";
import { YearGrid } from "./YearGrid";
import { Sidebar } from "./Sidebar";
import { DateModal } from "./DateModal";
import { AuthModal } from "./AuthModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Footer } from "./Footer";

export function CalendarApp() {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => isoDate(today), [today]);
  const todayBangla = useMemo(() => gregorianToBangla(today), [today]);

  const hydrate = useCalendarStore((s) => s.hydrate);
  useLayoutEffect(() => {
    hydrate(todayBangla.year, todayBangla.month);
  }, [hydrate, todayBangla.year, todayBangla.month]);

  const mode = useCalendarStore((s) => s.mode);
  const banglaYear = useCalendarStore((s) => s.banglaYear);
  const banglaMonth = useCalendarStore((s) => s.banglaMonth);
  const yearInput = useCalendarStore((s) => s.yearInput);
  const modalTarget = useCalendarStore((s) => s.modalTarget);
  const setMode = useCalendarStore((s) => s.setMode);
  const goPrev = useCalendarStore((s) => s.goPrev);
  const goNext = useCalendarStore((s) => s.goNext);
  const goToday = useCalendarStore((s) => s.goToday);
  const setYearInput = useCalendarStore((s) => s.setYearInput);
  const jumpToYear = useCalendarStore((s) => s.jumpToYear);
  const openModal = useCalendarStore((s) => s.openModal);
  const closeModal = useCalendarStore((s) => s.closeModal);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const initAuth = useAuthStore((s) => s.init);

  const notes = useNotesStore((s) => s.notes);
  const syncing = useNotesStore((s) => s.syncing);
  const setNote = useNotesStore((s) => s.setNote);
  const loadGuestNotes = useNotesStore((s) => s.loadGuestNotes);
  const syncWithToken = useNotesStore((s) => s.syncWithToken);

  const remindersByDate = useReminderStore((s) => s.remindersByDate);
  const pushEnabled = useReminderStore((s) => s.pushEnabled);
  const pushBusy = useReminderStore((s) => s.pushBusy);
  const pushError = useReminderStore((s) => s.pushError);
  const loadReminders = useReminderStore((s) => s.loadReminders);
  const clearReminders = useReminderStore((s) => s.clearReminders);
  const enablePush = useReminderStore((s) => s.enablePush);
  const addReminder = useReminderStore((s) => s.addReminder);
  const removeReminder = useReminderStore((s) => s.removeReminder);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (token) syncWithToken(token);
    else loadGuestNotes();
  }, [token, syncWithToken, loadGuestNotes]);

  useEffect(() => {
    if (token) loadReminders(token);
    else clearReminders();
  }, [token, loadReminders, clearReminders]);

  const festivalsByDate = useMemo(() => buildFestivalIndex(banglaYear), [banglaYear]);

  const monthInfo = useMemo(() => banglaMonthStart(banglaYear, banglaMonth), [banglaYear, banglaMonth]);
  const monthEnd = useMemo(() => addDays(monthInfo.start, monthInfo.daysInMonth - 1), [monthInfo]);

  const modalFestivals = modalTarget ? festivalsByDate[modalTarget.iso] || [] : [];
  const todayFestivals = festivalsByDate[todayIso] || [];
  const modalReminders = modalTarget ? remindersByDate[modalTarget.iso] || [] : [];

  return (
    <div className="wrap">
      <div className="alpona" />
      <header className="top">
        <div className="brand">
          <h1>বাংলা পঞ্জিকা</h1>
          <p>বাংলাদেশ সংশোধিত বঙ্গাব্দ অনুযায়ী · পহেলা বৈশাখ প্রতি বছর ১৪ এপ্রিল</p>
        </div>
        <div className="header-actions no-print">
          <button
            type="button"
            className="icon"
            onClick={() => goToday(todayBangla.year, todayBangla.month)}
            title="আজকের তারিখে যান"
          >
            ⦿ আজ
          </button>
          <button type="button" className="icon" onClick={() => window.print()} title="প্রিন্ট করুন">
            ⎙ প্রিন্ট
          </button>
          {user ? (
            <button
              type="button"
              className="avatar-btn"
              onClick={() => setConfirmLogoutOpen(true)}
              title={`${user.email} · লগআউট করতে ক্লিক করুন`}
              aria-label={`${user.email}, লগআউট করতে ক্লিক করুন`}
            >
              {syncing ? "…" : user.email.charAt(0).toUpperCase()}
            </button>
          ) : (
            <button type="button" className="icon" onClick={() => setAuthModalOpen(true)}>
              লগইন / নিবন্ধন
            </button>
          )}
        </div>
      </header>

      <div className="navbar no-print">
        <div className="navcluster">
          <button type="button" className="icon" aria-label="আগের মাস" onClick={goPrev}>
            ←
          </button>
          <button
            type="button"
            className={mode === "month" ? "toggle-active" : ""}
            onClick={() => setMode("month")}
          >
            মাস
          </button>
          <button type="button" className={mode === "year" ? "toggle-active" : ""} onClick={() => setMode("year")}>
            বছর
          </button>
        </div>
        <div className="center-title">
          {mode === "month" ? (
            <>
              <p className="bn-month">
                {MONTHS_BN[banglaMonth]} {toBn(banglaYear)}
              </p>
              <p className="greg-span">
                {GREG_MONTH_EN[monthInfo.start.getMonth()]} {monthInfo.start.getDate()}, {monthInfo.start.getFullYear()}{" "}
                – {GREG_MONTH_EN[monthEnd.getMonth()]} {monthEnd.getDate()}, {monthEnd.getFullYear()}
              </p>
            </>
          ) : (
            <>
              <p className="bn-month">বঙ্গাব্দ {toBn(banglaYear)}</p>
              <p className="greg-span">
                এপ্রিল {banglaYear + 593} – এপ্রিল {banglaYear + 594}
              </p>
            </>
          )}
        </div>
        <div className="navcluster">
          <div className="yearjump">
            <label htmlFor="yearInput" style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
              বঙ্গাব্দ
            </label>
            <input
              type="number"
              id="yearInput"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && jumpToYear()}
            />
            <button type="button" onClick={jumpToYear}>
              যান
            </button>
          </div>
          <button type="button" className="icon" aria-label="পরের মাস" onClick={goNext}>
            →
          </button>
        </div>
      </div>

      <Legend />

      <div className="layout">
        <div className="card">
          {mode === "month" ? (
            <MonthGrid
              banglaYear={banglaYear}
              banglaMonth={banglaMonth}
              todayIso={todayIso}
              festivalsByDate={festivalsByDate}
              notes={notes}
              onSelectDate={openModal}
            />
          ) : (
            <YearGrid
              banglaYear={banglaYear}
              todayIso={todayIso}
              festivalsByDate={festivalsByDate}
              onSelectDate={openModal}
            />
          )}
        </div>

        <Sidebar
          today={today}
          todayBangla={todayBangla}
          todayFestivals={todayFestivals}
          notes={notes}
          signedIn={!!user}
        />
      </div>

      <Footer />

      <DateModal
        target={modalTarget}
        festivals={modalFestivals}
        initialNote={modalTarget ? notes[modalTarget.iso] || "" : ""}
        onClose={closeModal}
        onSave={(date, text) => setNote(token, date, text)}
        signedIn={!!user}
        reminders={modalReminders}
        pushEnabled={pushEnabled}
        pushBusy={pushBusy}
        pushError={pushError}
        onEnablePush={() => token && enablePush(token)}
        onAddReminder={(time, message) => {
          if (!token || !modalTarget) return;
          const localDateTime = new Date(`${modalTarget.iso}T${time}:00`);
          addReminder(token, modalTarget.iso, localDateTime.toISOString(), message);
        }}
        onDeleteReminder={(id) => {
          if (!token || !modalTarget) return;
          removeReminder(token, id, modalTarget.iso);
        }}
      />

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <ConfirmDialog
        open={confirmLogoutOpen}
        title="লগআউট করবেন?"
        message={user ? `${user.email} থেকে লগআউট করা হবে।` : undefined}
        confirmLabel="লগআউট"
        onConfirm={() => {
          logout();
          setConfirmLogoutOpen(false);
        }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </div>
  );
}
