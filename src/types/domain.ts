export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  budget: number | null;
  status: CampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  createdById: string;
  createdAt: string;
}

export interface CampaignInput {
  title: string;
  description: string;
  rewardAmount: number;
  budget?: number;
  startsAt?: string;
  endsAt?: string;
}

export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Claim {
  id: string;
  campaignId: string;
  campaignTitle: string;
  userId: string;
  userEmail: string;
  status: ClaimStatus;
  rewardAmount: number;
  note: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  balance: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  reference: string | null;
  description: string | null;
  createdAt: string;
}

export type NotificationType = "SYSTEM" | "CAMPAIGN" | "CLAIM" | "WALLET";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  route: string | null;
  readAt: string | null;
  createdAt: string;
}

export type PushAudience = "all" | "user" | "topic";

export interface SendNotificationInput {
  audience: PushAudience;
  userId?: string;
  topic?: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string;
  route?: string;
  silent?: boolean;
  scheduledAt?: string;
}

export type PushLogStatus = "QUEUED" | "SCHEDULED" | "SENT" | "PARTIAL" | "FAILED";

export interface PushLog {
  id: string;
  audience: PushAudience;
  userId: string | null;
  topic: string | null;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  route: string | null;
  silent: boolean;
  scheduledAt: string | null;
  status: PushLogStatus;
  successCount: number;
  failureCount: number;
  error: string | null;
  sentBy: { id: string; name: string; email: string };
  createdAt: string;
}

export interface AnalyticsSummary {
  totalEvents: number;
  byName: { name: string; count: number }[];
}

// ---- Hot Offers CMS ----

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface OfferCategory {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  priority: number;
  featured: boolean;
  status: ContentStatus;
  hasFeedbackPage: boolean;
  offerCount: number;
  createdAt: string;
}

export interface OfferCategoryInput {
  slug?: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  priority: number;
  featured: boolean;
  status: ContentStatus;
}

export type OfferDifficulty = "EASY" | "MEDIUM" | "HARD";

/** What a user who completed the offer (APPROVED submission) sees in the app. */
export type CompletedBehavior = "SHOW" | "HIDE" | "SHOW_COMPLETED";

export interface HotOffer {
  id: string;
  slug: string;
  title: string;
  appName: string | null;
  logoUrl: string | null;
  thumbnailUrl: string | null;
  shortDescription: string;
  rewardAmount: number;
  rewardCoins: number;
  rewardLabel: string | null;
  difficulty: OfferDifficulty;
  estimatedTime: string | null;
  rating: number | null;
  featured: boolean;
  trending: boolean;
  isProduct: boolean;
  brandLogoUrl: string | null;
  expiresAt: string | null;
  priority: number;
  status: ContentStatus;
  completedBehavior: CompletedBehavior;
  category: { id: string; slug: string; title: string };
  createdAt: string;
}

export interface HotOfferDetails extends HotOffer {
  bannerUrl: string | null;
  description: string;
  taskDescription: string | null;
  features: string[];
  instructions: string[];
  requirements: string[];
  terms: string | null;
  warning: string | null;
  playStoreUrl: string;
  maxUsers: number | null;
  maxRewards: number | null;
  dailyLimit: number | null;
}

export interface HotOfferInput {
  categoryId: string;
  slug?: string;
  title: string;
  appName?: string | null;
  logoUrl?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  shortDescription: string;
  description: string;
  taskDescription?: string | null;
  features: string[];
  instructions: string[];
  requirements: string[];
  terms?: string | null;
  warning?: string | null;
  rewardAmount: number;
  rewardCoins: number;
  rewardLabel?: string | null;
  difficulty: OfferDifficulty;
  estimatedTime?: string | null;
  rating?: number | null;
  playStoreUrl: string;
  featured: boolean;
  trending: boolean;
  isProduct?: boolean;
  brandLogoUrl?: string | null;
  expiresAt?: string | null;
  maxUsers?: number | null;
  maxRewards?: number | null;
  dailyLimit?: number | null;
  completedBehavior?: CompletedBehavior;
  priority: number;
  status: ContentStatus;
}

export type SubmissionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEED_MORE_PROOF"
  | "CANCELLED";

export interface OfferSubmission {
  screenshotCount?: number;
  id: string;
  offerId: string;
  offerTitle: string;
  offerSlug: string;
  offerThumbnailUrl: string | null;
  screenshotUrl: string;
  /** All proof images, newest first (multi-screenshot submissions). */
  screenshotUrls: string[];
  note: string | null;
  status: SubmissionStatus;
  reviewNote: string | null;
  rewardAmount: number;
  reviewedAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface FraudOverview {
  flagThreshold: number;
  flaggedUsers: {
    user: { id: string; name: string; email: string };
    score: number;
    events: number;
    flagged: boolean;
  }[];
  recentLogs: {
    id: string;
    type: string;
    score: number;
    detail: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }[];
}

export type AnalyticsRange = "daily" | "weekly" | "monthly";

export interface HotOffersAnalytics {
  totals: {
    views: number;
    clicks: number;
    downloads: number;
    uniqueUsers: number;
    ctr: number;
    conversionRate: number;
  };
  topOffers: { id: string; slug: string; title: string; views: number; clicks: number; downloads: number }[];
  topCategories: { id: string; slug: string; title: string; views: number; clicks: number; downloads: number }[];
  series: { bucket: string; views: number; clicks: number; downloads: number }[];
}

export interface AdminStats {
  totalUsers: number;
  activeCampaigns: number;
  pendingClaims: number;
  approvedClaims: number;
  totalWalletBalance: number;
  pendingSubmissions: number;
  pendingRedemptions: number;
  coinsInPendingRedemptions: number;
  fulfilledRedemptions: number;
  pendingMissionCompletions: number;
  totalReferrals: number;
}
