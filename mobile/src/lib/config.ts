const supportedProtocols = new Set(["http:", "https:"]);

export function normalizeBaseUrl(raw: string | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!supportedProtocols.has(url.protocol)) return null;

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

export function getApiBaseUrl(): string {
  const baseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (!baseUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is missing or invalid. Copy mobile/.env.example to mobile/.env and set an http(s) URL."
    );
  }
  return baseUrl;
}
