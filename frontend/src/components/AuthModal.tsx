"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [previousView, setPreviousView] = useState({ open, mode });
  if (previousView.open !== open || previousView.mode !== mode) {
    setPreviousView({ open, mode });
    if (open) {
      setError(null);
      setPassword("");
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "কিছু একটা ভুল হয়েছে (something went wrong)");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="overlay no-print open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h3 style={{ fontFamily: "var(--font-display), serif", fontSize: "1.3rem" }}>
          {mode === "login" ? "লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}
        </h3>
        <p className="modal-sub">নোট বিভিন্ন ডিভাইসে সংরক্ষণ করতে অ্যাকাউন্ট ব্যবহার করুন।</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="authEmail">ইমেইল</label>
          <input
            id="authEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginTop: "4px", marginBottom: "12px" }}
          />
          <label htmlFor="authPassword">পাসওয়ার্ড</label>
          <input
            id="authPassword"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginTop: "4px" }}
          />
          {error && (
            <p style={{ color: "var(--accent-2)", fontSize: "0.8rem", marginTop: "10px" }}>{error}</p>
          )}
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              style={{ border: "none", background: "none", padding: 0, textDecoration: "underline" }}
            >
              {mode === "login" ? "নতুন অ্যাকাউন্ট? নিবন্ধন করুন" : "অ্যাকাউন্ট আছে? লগইন করুন"}
            </button>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "..." : mode === "login" ? "লগইন" : "নিবন্ধন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
