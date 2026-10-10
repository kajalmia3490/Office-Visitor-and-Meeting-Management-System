import { apiRequest } from "./api-client";

export type FetchResult<T> = {
  data: T;
  source: "api" | "mock";
};

export function listPayload(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  const record = (value ?? {}) as Record<string, unknown>;
  const items = record.items ?? record.results ?? record.data;
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

export async function fetchWithFallback<T>(
  path: string,
  mock: T,
  options?: RequestInit,
): Promise<FetchResult<T>> {
  try {
    const data = await apiRequest<T>(path, options);
    return { data, source: "api" };
  } catch {
    return { data: mock, source: "mock" };
  }
}

export async function fetchListWithFallback(
  path: string,
  mock: Record<string, unknown>[],
): Promise<FetchResult<Record<string, unknown>[]>> {
  try {
    const data = await apiRequest<unknown>(path);
    return { data: listPayload(data), source: "api" };
  } catch {
    return { data: mock, source: "mock" };
  }
}
