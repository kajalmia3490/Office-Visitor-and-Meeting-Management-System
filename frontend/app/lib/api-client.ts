const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? `API request failed (${response.status})`);
  }
  return body?.data ?? body;
}
