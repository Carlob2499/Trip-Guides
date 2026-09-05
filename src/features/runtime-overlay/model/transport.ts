export interface JsonTransport {
  (path: string, body: unknown, signal?: AbortSignal): Promise<unknown>;
}

export function createWorkerTransport(baseUrl: string, fetchPort: typeof fetch = fetch): JsonTransport {
  const base = baseUrl.replace(/\/+$/, "");
  return async (path, body, signal) => {
    if (!base) throw new Error("runtime backend is not configured");
    const response = await fetchPort(`${base}/${path.replace(/^\/+/, "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) throw new Error(`runtime backend ${response.status}`);
    return response.json();
  };
}
