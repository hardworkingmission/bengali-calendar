const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export interface AuthResponse {
  token: string;
  user: { id: number; email: string };
}

export function register(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(token: string) {
  return request<{ user: { id: number; email: string } }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function fetchNotes(token: string) {
  return request<{ notes: Record<string, string> }>("/notes", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function saveNote(token: string, date: string, text: string) {
  return request<{ date: string; text: string }>(`/notes/${date}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text }),
  });
}

export function fetchVapidPublicKey() {
  return request<{ publicKey: string }>("/push/vapid-public-key");
}

export function subscribePush(token: string, subscription: PushSubscriptionJSON) {
  return request<{ ok: true }>("/push/subscribe", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(subscription),
  });
}

export function unsubscribePush(token: string, endpoint: string) {
  return request<{ ok: true }>("/push/unsubscribe", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint }),
  });
}

export interface Reminder {
  id: number;
  note_date: string;
  remind_at: string;
  message: string;
  sent: 0 | 1;
}

export function fetchReminders(token: string) {
  return request<{ reminders: Reminder[] }>("/reminders", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createReminder(token: string, date: string, remindAtIso: string, message: string) {
  return request<Reminder>("/reminders", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ date, remindAt: remindAtIso, message }),
  });
}

export function deleteReminder(token: string, id: number) {
  return request<{ ok: true }>(`/reminders/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
