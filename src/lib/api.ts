// Cliente HTTP del lado del navegador. Nunca pongas secrets acá.
export async function api<T = unknown>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...init } = options;
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : init.body,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return data;
}
