let csrf = "";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const method = options.method || "GET";
  const r = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal: options.signal,
    headers:
      method === "GET"
        ? {}
        : { "Content-Type": "application/json", "X-Bora-CSRF": csrf },
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
  let value: any;
  try {
    value = await r.json();
  } catch {
    throw new ApiError(r.status, "Сервис не ответил. Попробуй ещё раз.");
  }
  if (!r.ok)
    throw new ApiError(
      r.status,
      value.error || "Не удалось выполнить действие.",
    );
  return value;
}
export async function session() {
  const s = await request<{
    user: { id: string; email: string } | null;
    csrf?: string;
    recovery?: boolean;
  }>("/api/auth/session");
  csrf = s.csrf || "";
  return s;
}
export async function audio(text: string, signal?: AbortSignal) {
  const r = await fetch("/api/speech", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Bora-CSRF": csrf },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!r.ok) {
    let e = await r.json();
    throw Error(e.error || "Не получилось воспроизвести.");
  }
  return URL.createObjectURL(await r.blob());
}
