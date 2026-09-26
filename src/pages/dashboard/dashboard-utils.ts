import type { AnalyticsRange, HotOffersAnalytics } from "@/types/domain";

export const PERIODS: {
  value: AnalyticsRange;
  label: string;
  days: number;
  detail: string;
}[] = [
  {
    value: "daily",
    label: "14 days",
    days: 14,
    detail: "Daily activity · last 14 days",
  },
  {
    value: "weekly",
    label: "12 weeks",
    days: 84,
    detail: "Weekly activity · last 12 weeks",
  },
  {
    value: "monthly",
    label: "12 months",
    days: 365,
    detail: "Monthly activity · last 365 days",
  },
];

export type ActivityMetric = "views" | "clicks" | "downloads";
export const ACTIVITY_METRICS: {
  key: ActivityMetric;
  label: string;
  color: string;
}[] = [
  { key: "views", label: "Views", color: "var(--dashboard-green)" },
  { key: "clicks", label: "Clicks", color: "var(--dashboard-blue)" },
  { key: "downloads", label: "Downloads", color: "var(--dashboard-purple)" },
];

export const percentage = (part: number, total: number): string =>
  total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "—";

export const eventLabel = (name: string): string =>
  name
    .replace(/[_.:-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/** The API groups in UTC. Fill absent buckets, never interpolate activity. */
export const activitySeries = (
  rows: HotOffersAnalytics["series"],
  range: AnalyticsRange,
  now: Date,
): HotOffersAnalytics["series"] => {
  const days = PERIODS.find((period) => period.value === range)!.days;
  const start = new Date(now.getTime() - days * 86_400_000);
  start.setUTCHours(0, 0, 0, 0);
  if (range === "weekly")
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  if (range === "monthly") start.setUTCDate(1);
  const byDate = new Map(rows.map((row) => [row.bucket.slice(0, 10), row]));
  const result: HotOffersAnalytics["series"] = [];
  for (const cursor = new Date(start); cursor <= now;) {
    const bucket = cursor.toISOString().slice(0, 10);
    result.push(
      byDate.get(bucket) ?? { bucket, views: 0, clicks: 0, downloads: 0 },
    );
    if (range === "monthly") cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + (range === "weekly" ? 7 : 1));
  }
  return result;
};
