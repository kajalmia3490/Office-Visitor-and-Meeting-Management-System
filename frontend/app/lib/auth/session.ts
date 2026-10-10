import { DEMO_USER } from "./demo-config";

export const SESSION_STORAGE_KEY = "officeflow_demo_session";
export const AUTH_COOKIE_NAME = "demo_auth";
export const SESSION_CHANGE_EVENT = "officeflow-session-change";

export function notifySessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }
}

export function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${AUTH_COOKIE_NAME}=1`));
}

/** Client-side auth check (localStorage + cookie mirror). */
export function isClientAuthenticated(): boolean {
  return Boolean(readSession()) || hasAuthCookie();
}

export type DemoSession = {
  email: string;
  name: string;
  role: "admin" | "reception" | "security" | "employee" | "management";
};

export function readSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: DemoSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  notifySessionChange();
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
  notifySessionChange();
}

export function createDemoSession(): DemoSession {
  return { ...DEMO_USER };
}
