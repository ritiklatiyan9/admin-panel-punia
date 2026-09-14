import { API_BASE_URL } from "@/services/api-client";

/** Re-home old localhost upload links onto the API currently serving the panel. */
export const mediaUrl = (value: string): string => {
  try {
    const url = new URL(value);
    if (!url.pathname.includes("/uploads/")) return value;
    const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
    return `${apiOrigin}${url.pathname}${url.search}`;
  } catch {
    return value;
  }
};
