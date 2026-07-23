import { useState, useCallback } from "react";
import { apiMutate } from "../api/client";

interface MutationState<T> {
  mutate: (path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown) => Promise<T>;
  loading: boolean;
  error: string | null;
}

export function useMutation<T>(): MutationState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown) => {
      setLoading(true);
      setError(null);
      try {
        return await apiMutate<T>(path, method, body);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, loading, error };
}
