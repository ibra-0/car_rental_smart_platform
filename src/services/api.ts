export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok)
    throw new Error(`Request failed (${response.status}). Please try again.`);
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
