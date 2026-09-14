import { apiClient } from "./api-client";
import type { ApiSuccess, Paginated } from "@/types/api";
import type {
  AppNotification,
  PushLog,
  SendNotificationInput,
} from "@/types/domain";

export const notificationsService = {
  list: async (
    params: {
      page: number;
      limit: number;
      unreadOnly?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<Paginated<AppNotification>> => {
    const { data } = await apiClient.get<ApiSuccess<AppNotification[]>>(
      "/notifications",
      {
        params,
        signal,
      },
    );
    return { items: data.data, meta: data.meta! };
  },

  unreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<ApiSuccess<{ count: number }>>(
      "/notifications/unread-count",
    );
    return data.data.count;
  },

  markRead: async (id: string): Promise<AppNotification> => {
    const { data } = await apiClient.patch<ApiSuccess<AppNotification>>(
      `/notifications/${id}/read`,
    );
    return data.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post("/notifications/read-all");
  },

  /** Super-admin sender: single user, FCM topic, or broadcast to all users. */
  send: async (input: SendNotificationInput): Promise<void> => {
    await apiClient.post("/notifications/send", input);
  },

  /** Cancel a SCHEDULED push before it fires (super admin). 404 once it has left SCHEDULED. */
  cancelScheduled: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/history/${id}`);
  },

  /** Admin send history with delivery outcomes. */
  history: async (
    params: { page: number; limit: number },
    signal?: AbortSignal,
  ): Promise<Paginated<PushLog>> => {
    const { data } = await apiClient.get<ApiSuccess<PushLog[]>>(
      "/notifications/history",
      {
        params,
        signal,
      },
    );
    return { items: data.data, meta: data.meta! };
  },
};
