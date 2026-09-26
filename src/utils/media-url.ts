import { API_BASE_URL } from "@/services/api-client";

/** Re-home old localhost upload links onto the API currently serving the panel. */
export const mediaUrl = (value: string, size?: 160 | 640): string => {
  try {
    const url = new URL(value, window.location.origin);
    if (!url.pathname.includes("/uploads/")) return value;
    const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
    const managed = /\/uploads\/[0-9a-f-]{36}\/content$/i.test(url.pathname);
    const legacyLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    // Artwork can also use third-party URLs whose paths happen to contain
    // /uploads/. Those must continue loading from their original host.
    if (!managed && !legacyLocal && url.origin !== apiOrigin) return value;
    if (size && managed) {
      url.searchParams.set("size", String(size));
    }
    return `${apiOrigin}${url.pathname}${url.search}`;
  } catch {
    return value;
  }
};
