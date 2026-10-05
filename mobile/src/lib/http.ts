export class ApiRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type HttpOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

const networkErrorMessage =
  "Could not reach the Belmont server. Check your connection and try again.";

export function joinUrl(baseUrl: string, path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${suffix}`;
}

export function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const value = (payload as { error?: unknown }).error;
    if (typeof value === "string" && value.trim()) return value;
  }
  return `Request failed with status ${status}.`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: HttpOptions = {}
): Promise<T> {
  const { method = "GET", body, token, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(joinUrl(baseUrl, path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw new ApiRequestError(0, networkErrorMessage, { cause: error });
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      extractErrorMessage(payload, response.status)
    );
  }

  return payload as T;
}
