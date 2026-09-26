import { apiClient } from "./api-client";
import type { ApiSuccess, Paginated } from "@/types/api";

export interface CpxTransaction {
  id: string;
  transId: string;
  status: "COMPLETED" | "REVERSED";
  coins: number;
  amountUsd: number | null;
  offerId: string | null;
  type: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

export const cpxService = {
  list: async (
    params: { page: number; limit: number; status?: string; search?: string },
    signal?: AbortSignal,
  ): Promise<Paginated<CpxTransaction>> => {
    const { data } = await apiClient.get<ApiSuccess<CpxTransaction[]>>("/cpx/admin/transactions", {
      params,
      signal,
    });
    return { items: data.data, meta: data.meta! };
  },
};
