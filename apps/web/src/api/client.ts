const BASE = "/api";

export async function apiFetch<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch {
    throw new Error("API unreachable — is the backend running on :3000?");
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`API returned non-JSON (${res.status}). Is the backend running?`);
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed: ${res.status}`);
  }

  return json.data as T;
}
