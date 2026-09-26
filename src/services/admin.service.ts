import { apiClient } from "./api-client";
import type { ApiSuccess, Paginated } from "@/types/api";
import type { AdminStats } from "@/types/domain";
import type { Role, User } from "@/types/user";

export const adminService = {
  stats: async (signal?: AbortSignal): Promise<AdminStats> => {
    const { data } = await apiClient.get<ApiSuccess<AdminStats>>(
      "/admin/stats",
      { signal },
    );
    return data.data;
  },

  listUsers: async (
    params: {
      page: number;
      limit: number;
      search?: string;
      role?: Role;
    },
    signal?: AbortSignal,
  ): Promise<Paginated<User>> => {
    const { data } = await apiClient.get<ApiSuccess<User[]>>("/admin/users", {
      params,
      signal,
    });
    return { items: data.data, meta: data.meta! };
  },

  updateUserRole: async (id: string, role: Role): Promise<User> => {
    const { data } = await apiClient.patch<ApiSuccess<User>>(
      `/admin/users/${id}/role`,
      { role },
    );
    return data.data;
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const { data } = await apiClient.patch<ApiSuccess<User>>(
      `/admin/users/${id}/status`,
      {
        isActive,
      },
    );
    return data.data;
  },
};
