import { apiClient } from "./api-client";
import type { ApiSuccess, Paginated } from "@/types/api";

export type MediaPurpose = "PROOF" | "CONTENT" | "AVATAR" | "NOTIFICATION";
export type MediaStatus = "ACTIVE" | "RETIRED";

export interface MediaAsset {
  id: string;
  url: string;
  provider: "s3" | "cloudinary" | "local";
  purpose: MediaPurpose;
  status: MediaStatus;
  originalFileName: string | null;
  mimeType: string;
  byteSize: number;
  originalByteSize: number;
  width: number | null;
  height: number | null;
  uploadedById: string | null;
  retiredAt: string | null;
  createdAt: string;
}

export const mediaService = {
  list: async (
    params: {
      page: number;
      limit: number;
      purpose?: MediaPurpose;
      status?: MediaStatus;
      search?: string;
    },
    signal?: AbortSignal,
  ): Promise<Paginated<MediaAsset>> => {
    const { data } = await apiClient.get<ApiSuccess<MediaAsset[]>>(
      "/uploads/admin",
      {
        params,
        signal,
      },
    );
    return { items: data.data, meta: data.meta! };
  },

  retire: async (id: string, force = false): Promise<void> => {
    await apiClient.delete(`/uploads/admin/${id}`, { params: { force } });
  },
};
