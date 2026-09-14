import { apiClient } from "./api-client";
import type { ApiSuccess, Paginated } from "@/types/api";
import type {
  AnalyticsRange,
  ContentStatus,
  FeedbackPage,
  FeedbackPageInput,
  FraudOverview,
  HotOffer,
  HotOfferDetails,
  HotOfferInput,
  HotOffersAnalytics,
  OfferCategory,
  OfferCategoryInput,
  OfferSubmission,
  SubmissionStatus,
} from "@/types/domain";

const BASE = "/hot-offers/admin";

export const hotOffersService = {
  // ---- categories ----

  listCategories: async (): Promise<OfferCategory[]> => {
    const { data } = await apiClient.get<ApiSuccess<OfferCategory[]>>(
      `${BASE}/categories`,
    );
    return data.data;
  },

  createCategory: async (input: OfferCategoryInput): Promise<OfferCategory> => {
    const { data } = await apiClient.post<ApiSuccess<OfferCategory>>(
      `${BASE}/categories`,
      input,
    );
    return data.data;
  },

  updateCategory: async (
    id: string,
    input: OfferCategoryInput,
  ): Promise<OfferCategory> => {
    const { data } = await apiClient.put<ApiSuccess<OfferCategory>>(
      `${BASE}/categories/${id}`,
      input,
    );
    return data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/categories/${id}`);
  },

  // ---- feedback pages ----

  getFeedbackPage: async (
    categorySlug: string,
  ): Promise<FeedbackPage | null> => {
    const { data } = await apiClient.get<ApiSuccess<FeedbackPage | null>>(
      `${BASE}/categories/${categorySlug}/feedback-page`,
    );
    return data.data;
  },

  upsertFeedbackPage: async (
    categoryId: string,
    input: FeedbackPageInput,
  ): Promise<FeedbackPage> => {
    const { data } = await apiClient.put<ApiSuccess<FeedbackPage>>(
      `${BASE}/categories/${categoryId}/feedback-page`,
      input,
    );
    return data.data;
  },

  // ---- offers ----

  listOffers: async (
    params: {
      page: number;
      limit: number;
      search?: string;
      category?: string;
      status?: ContentStatus;
      /** true = product offers only, false = feedback offers only, omitted = all. */
      product?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<Paginated<HotOffer>> => {
    const { data } = await apiClient.get<ApiSuccess<HotOffer[]>>(
      `${BASE}/offers`,
      {
        params,
        signal,
      },
    );
    return { items: data.data, meta: data.meta! };
  },

  getOffer: async (id: string): Promise<HotOfferDetails> => {
    const { data } = await apiClient.get<ApiSuccess<HotOfferDetails>>(
      `${BASE}/offers/${id}`,
    );
    return data.data;
  },

  createOffer: async (input: HotOfferInput): Promise<HotOfferDetails> => {
    const { data } = await apiClient.post<ApiSuccess<HotOfferDetails>>(
      `${BASE}/offers`,
      input,
    );
    return data.data;
  },

  updateOffer: async (
    id: string,
    input: HotOfferInput,
  ): Promise<HotOfferDetails> => {
    const { data } = await apiClient.put<ApiSuccess<HotOfferDetails>>(
      `${BASE}/offers/${id}`,
      input,
    );
    return data.data;
  },

  deleteOffer: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/offers/${id}`);
  },

  // ---- proof submissions ----

  listSubmissions: async (
    params: {
      page: number;
      limit: number;
      status?: SubmissionStatus;
      /** Filter by the submission's offer.isProduct; omitted = all. */
      product?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<Paginated<OfferSubmission>> => {
    const { data } = await apiClient.get<ApiSuccess<OfferSubmission[]>>(
      `${BASE}/submissions`,
      {
        params,
        signal,
      },
    );
    return { items: data.data, meta: data.meta! };
  },

  reviewSubmission: async (
    id: string,
    input: {
      action: "APPROVE" | "REJECT" | "NEED_MORE_PROOF";
      reviewNote?: string;
    },
  ): Promise<OfferSubmission> => {
    const { data } = await apiClient.patch<ApiSuccess<OfferSubmission>>(
      `${BASE}/submissions/${id}/review`,
      input,
    );
    return data.data;
  },

  /** Let the user participate in this offer again (finished -> CANCELLED). */
  reopenSubmission: async (id: string): Promise<OfferSubmission> => {
    const { data } = await apiClient.patch<ApiSuccess<OfferSubmission>>(
      `${BASE}/submissions/${id}/reopen`,
    );
    return data.data;
  },

  // ---- fraud detection ----

  fraudOverview: async (): Promise<FraudOverview> => {
    const { data } = await apiClient.get<ApiSuccess<FraudOverview>>(
      `${BASE}/fraud`,
    );
    return data.data;
  },

  // ---- analytics ----

  analytics: async (range: AnalyticsRange): Promise<HotOffersAnalytics> => {
    const { data } = await apiClient.get<ApiSuccess<HotOffersAnalytics>>(
      `${BASE}/analytics`,
      {
        params: { range },
      },
    );
    return data.data;
  },

  // ---- shared upload (returns a hosted URL for image fields) ----

  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<ApiSuccess<{ url: string }>>(
      "/uploads?purpose=CONTENT",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60_000,
      },
    );
    return data.data.url;
  },
};
