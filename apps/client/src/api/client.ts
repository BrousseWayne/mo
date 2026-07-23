const BASE = "/api";

export async function apiFetch<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch {
    throw new Error("API unreachable — is the backend running on :3100?");
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

export async function apiMutate<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("API unreachable — is the backend running on :3100?");
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed: ${res.status}`);
  }

  return json?.data as T;
}
