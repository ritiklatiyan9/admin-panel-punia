import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentCheckIcon,
  ExclamationCircleIcon,
  FlagIcon,
  GiftIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  ExportButton,
  type ExportColumn,
} from "@/components/shared/ExportButton";
import { SubmissionStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/admin.service";
import { analyticsService } from "@/services/analytics.service";
import { hotOffersService } from "@/services/hot-offers.service";
import { useAuthStore } from "@/store/auth.store";
import { formatCoins, formatDateTime, formatNumber } from "@/utils/format";
import type { AnalyticsRange } from "@/types/domain";
import {
  ACTIVITY_METRICS,
  PERIODS,
  activitySeries,
  eventLabel,
  percentage,
  type ActivityMetric,
} from "./dashboard-utils";
import { DashboardModules } from "./DashboardModules";
import { EngagementPanel } from "./EngagementPanel";
import "./dashboard.css";

const ActivityChart = lazy(() => import("./ActivityChart"));
const exportColumns: ExportColumn[] = [
  { key: "bucket", label: "Period starting (UTC)" },
  { key: "views", label: "Offer views" },
  { key: "clicks", label: "Offer clicks" },
  { key: "downloads", label: "Tracked downloads" },
];

function PanelHeader({
  title,
  description,
  action,
  id,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  id?: string;
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3 p-5 pb-4">
      <div>
        <h2 id={id} className="font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function LoadError({
  onRetry,
  children = "This data couldn't be loaded.",
}: {
  onRetry: () => void;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div
      className="flex min-h-32 flex-col items-center justify-center gap-3 p-5 text-center"
      role="status"
    >
      <ExclamationCircleIcon className="h-6 w-6 text-amber-700 dark:text-amber-400" />
      <p className="text-sm text-muted-foreground">{children}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-6 text-center">
      <ChartBarIcon className="h-8 w-8 text-muted-foreground/40" />
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  caption,
  detail,
  icon: Icon,
  to,
  loading,
  color,
}: {
  label: string;
  value: ReactNode;
  caption: string;
  detail: string;
  icon: typeof UsersIcon;
  to: string;
  loading: boolean;
  color: string;
}): JSX.Element {
  return (
    <Link
      to={to}
      className="dashboard-panel dashboard-metric group p-5"
      onClick={
        to.startsWith("#")
          ? (event) => {
              event.preventDefault();
              const target = document.getElementById(to.slice(1));
              target?.scrollIntoView({ block: "start" });
              target?.focus({ preventScroll: true });
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="rounded-lg bg-muted p-2" style={{ color }}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mt-3 flex min-h-9 flex-wrap items-baseline gap-x-2 gap-y-1">
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <>
            <span className="text-[28px] font-semibold leading-tight tracking-tight tabular-nums">
              {value}
            </span>
            <span className="text-xs text-muted-foreground">{caption}</span>
          </>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-[11px] leading-relaxed text-muted-foreground">
          {detail}
        </span>
        <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
      </div>
    </Link>
  );
}

export const DashboardPage = (): JSX.Element => {
  const name = useAuthStore(
    (state) => state.user?.name?.split(" ")[0] ?? "there",
  );
  const [showEvents, setShowEvents] = useState(false);
  const [range, setRange] = useState<AnalyticsRange>("daily");
  const [metric, setMetric] = useState<ActivityMetric | "all">("all");
  const [proofFilter, setProofFilter] = useState<"all" | "pending">("all");
  const [periodStart, setPeriodStart] = useState(() =>
    new Date(Date.now() - 14 * 86_400_000).toISOString(),
  );
  const period = PERIODS.find((item) => item.value === range)!;

  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: ({ signal }) => adminService.stats(signal),
  });
  const offers = useQuery({
    queryKey: ["hot-offers", "analytics", range],
    queryFn: ({ signal }) => hotOffersService.analytics(range, signal),
    // A previous period must never be labelled as the newly selected period.
    placeholderData: undefined,
  });
  const events = useQuery({
    queryKey: ["analytics", "summary", { from: periodStart }],
    queryFn: ({ signal }) =>
      analyticsService.summary({ from: periodStart }, signal),
    enabled: showEvents,
    placeholderData: undefined,
  });
  const recentProofs = useQuery({
    queryKey: ["hot-offers", "submissions", "dashboard", proofFilter],
    queryFn: ({ signal }) =>
      hotOffersService.listSubmissions(
        {
          page: 1,
          limit: 5,
          preview: true,
          ...(proofFilter === "pending" ? { status: "PENDING" as const } : {}),
        },
        signal,
      ),
    placeholderData: undefined,
  });

  const series = useMemo(
    () =>
      offers.data
        ? activitySeries(
            offers.data.series,
            range,
            new Date(offers.dataUpdatedAt),
          )
        : [],
    [offers.data, offers.dataUpdatedAt, range],
  );
  const topOffers = useMemo(
    () =>
      [...(offers.data?.topOffers ?? [])]
        .sort((a, b) => b.downloads - a.downloads || b.views - a.views)
        .slice(0, 5),
    [offers.data],
  );
  const topEvents = useMemo(
    () =>
      [...(events.data?.byName ?? [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [events.data],
  );
  const s = stats.data;
  const totals = offers.data?.totals;
  const pending = s
    ? s.pendingSubmissions +
      s.pendingMissionCompletions +
      s.pendingRedemptions +
      s.pendingClaims
    : undefined;
  const queries = [
    stats,
    offers,
    recentProofs,
    ...(showEvents ? [events] : []),
  ];
  const refreshing = queries.some((query) => query.isFetching);
  const failed = queries.some((query) => query.isError);
  const updatedAt = Math.min(...queries.map((query) => query.dataUpdatedAt));
  const selectRange = (value: AnalyticsRange): void => {
    setRange(value);
    setPeriodStart(
      new Date(
        Date.now() -
          PERIODS.find((item) => item.value === value)!.days * 86_400_000,
      ).toISOString(),
    );
  };
  const refresh = (): void => {
    setPeriodStart(
      new Date(Date.now() - period.days * 86_400_000).toISOString(),
    );
    [stats, offers, recentProofs].forEach((query) => {
      void query.refetch();
    });
  };

  return (
    <div className="dashboard space-y-6 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Squares2X2Icon className="h-3.5 w-3.5" />
            <span>Workspace</span>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-foreground">Overview</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            Dashboard<span className="text-primary">.</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Welcome back, {name}. Here’s what’s happening on Money Marathon.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:pt-5">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={refreshing}
            className="gap-2 rounded-lg"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Updating" : "Refresh"}
          </Button>
          <ExportButton
            rows={offers.isError || offers.isFetching ? [] : series}
            columns={exportColumns}
            fileName={`dashboard-activity-${range}`}
            title="Money Marathon · Offer activity"
            filterSummary={`${period.detail}. UTC buckets; first and current periods may be partial. Download events are tracked intent, not verified installs.`}
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold">Platform overview</h2>
          <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            All-time totals
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
          role="status"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${failed ? "bg-amber-500" : refreshing ? "bg-sky-400" : "bg-emerald-500"}`}
          />
          {failed
            ? "Some data unavailable · retry with Refresh"
            : refreshing
              ? "Syncing dashboard…"
              : updatedAt
                ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Waiting for data"}
        </span>
      </div>
      {stats.isError && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm"
          role="alert"
        >
          <span>
            Platform totals{" "}
            {s
              ? "could not be refreshed. Showing the last successful snapshot."
              : "are unavailable."}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void stats.refetch()}
          >
            Retry totals
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total users"
          value={s ? formatNumber(s.totalUsers) : "—"}
          caption="accounts"
          detail={
            s
              ? `${formatNumber(s.totalReferrals)} joined through referrals`
              : "All registered accounts"
          }
          icon={UsersIcon}
          to="/users"
          loading={stats.isLoading}
          color="var(--dashboard-green)"
        />
        <Metric
          label="Awaiting review"
          value={pending === undefined ? "—" : formatNumber(pending)}
          caption="requests"
          detail="Proofs, missions, redemptions & claims"
          icon={DocumentCheckIcon}
          to="#review-queue"
          loading={stats.isLoading}
          color="var(--status-warning)"
        />
        <Metric
          label="Wallet balances"
          value={s ? formatCoins(s.totalWalletBalance) : "—"}
          caption="coins"
          detail={
            s
              ? `${formatCoins(s.coinsInPendingRedemptions)} coins in pending redemptions`
              : "Current user wallet balances"
          }
          icon={BanknotesIcon}
          to="/wallet"
          loading={stats.isLoading}
          color="var(--dashboard-blue)"
        />
        <Metric
          label="Fulfilled redemptions"
          value={s ? formatNumber(s.fulfilledRedemptions) : "—"}
          caption="completed"
          detail="Vouchers and UPI payouts · all time"
          icon={GiftIcon}
          to="/redemptions"
          loading={stats.isLoading}
          color="var(--dashboard-purple)"
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section
          className="dashboard-panel overflow-hidden"
          aria-labelledby="activity-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
            <div>
              <h2 id="activity-title" className="font-semibold tracking-tight">
                Offer activity
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {period.detail} · UTC
              </p>
            </div>
            <div
              className="inline-flex rounded-lg border bg-muted/40 p-1"
              role="group"
              aria-label="Analytics period"
            >
              {PERIODS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={range === item.value}
                  onClick={() => selectRange(item.value)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${range === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {offers.isError && !offers.data ? (
            <LoadError onRetry={() => void offers.refetch()}>
              Offer analytics are unavailable. Other dashboard modules are still
              usable.
            </LoadError>
          ) : (
            <>
              <div className="mx-5 mb-3 grid grid-cols-3 rounded-xl border bg-muted/20">
                {ACTIVITY_METRICS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={`Show ${item.label.toLowerCase()} on chart`}
                    aria-pressed={metric === item.key}
                    onClick={() =>
                      setMetric(metric === item.key ? "all" : item.key)
                    }
                    className={`min-w-0 px-3 py-3 text-left transition-colors first:rounded-l-xl last:rounded-r-xl sm:px-4 ${metric === item.key ? "bg-muted" : "hover:bg-muted/50"}`}
                  >
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="mt-1.5 block text-xl font-semibold tracking-tight tabular-nums">
                      {offers.isLoading ? (
                        <Skeleton className="h-7 w-14" />
                      ) : totals ? (
                        formatNumber(totals[item.key])
                      ) : (
                        "—"
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 px-5 pb-1 text-[11px] text-muted-foreground">
                <span>
                  {totals
                    ? `${formatNumber(totals.uniqueUsers)} unique offer sessions`
                    : "Unique offer sessions"}
                </span>
                <button
                  type="button"
                  onClick={() => setMetric("all")}
                  aria-pressed={metric === "all"}
                  className="rounded px-2 py-1 text-primary"
                >
                  Show all series
                </button>
              </div>
              <div className="px-3">
                {offers.isLoading ? (
                  <Skeleton className="my-3 h-[250px] w-full rounded-lg" />
                ) : totals &&
                  totals.views + totals.clicks + totals.downloads > 0 ? (
                  <Suspense
                    fallback={<Skeleton className="h-[250px] w-full" />}
                  >
                    <ActivityChart
                      data={series}
                      range={range}
                      metric={metric}
                    />
                  </Suspense>
                ) : (
                  <div className="flex h-[250px] items-center justify-center">
                    <Empty>
                      No offer activity in this period. Try a longer range to
                      see earlier engagement.
                    </Empty>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-[11px] text-muted-foreground">
                <span>
                  Downloads reflect tracked intent, not verified installs.
                </span>
                <Link
                  to={`/offers?tab=analytics&range=${range}`}
                  className="inline-flex items-center gap-1 font-medium text-primary"
                >
                  Full analytics <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
              {offers.isError && (
                <p className="px-5 pb-3 text-xs text-amber-700 dark:text-amber-400">
                  Refresh failed. Showing previously loaded activity.
                </p>
              )}
              {series.length > 0 && (
                <details className="border-t text-xs">
                  <summary className="cursor-pointer px-5 py-3 text-muted-foreground">
                    View activity data{" "}
                    <span className="ml-1 text-[10px]">
                      · first and current buckets may be partial
                    </span>
                  </summary>
                  <div className="max-h-64 overflow-auto px-5 pb-4">
                    <table className="w-full text-right tabular-nums">
                      <caption className="sr-only">
                        Offer activity, {period.detail}, UTC
                      </caption>
                      <thead>
                        <tr className="border-b">
                          <th scope="col" className="py-2 text-left">
                            Period starting
                          </th>
                          <th scope="col">Views</th>
                          <th scope="col">Clicks</th>
                          <th scope="col">Downloads</th>
                        </tr>
                      </thead>
                      <tbody>
                        {series.map((row) => (
                          <tr
                            key={row.bucket}
                            className="border-b last:border-0"
                          >
                            <th
                              scope="row"
                              className="py-2 text-left font-normal"
                            >
                              {row.bucket}
                            </th>
                            <td>{formatNumber(row.views)}</td>
                            <td>{formatNumber(row.clicks)}</td>
                            <td>{formatNumber(row.downloads)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          )}
        </section>

        <section
          id="review-queue"
          tabIndex={-1}
          className="dashboard-panel scroll-mt-20"
          aria-labelledby="queue-title"
        >
          <PanelHeader
            id="queue-title"
            title="Needs attention"
            description="Your current review queue · all time"
            action={
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <ClockIcon className="h-4 w-4" />
              </span>
            }
          />
          {stats.isLoading ? (
            <div className="space-y-3 p-5 pt-0">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !s ? (
            <LoadError onRetry={() => void stats.refetch()} />
          ) : (
            <>
              <div className="px-5 pb-4">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {formatNumber(pending ?? 0)}{" "}
                  <span className="text-xs font-normal tracking-normal text-muted-foreground">
                    pending requests
                  </span>
                </p>
              </div>
              <div className="space-y-2 px-4 pb-4">
                {[
                  {
                    label: "Offer proofs",
                    hint: "Check screenshots & reward users",
                    count: s.pendingSubmissions,
                    to: "/offers?tab=proofs",
                    icon: DocumentCheckIcon,
                  },
                  {
                    label: "Mission completions",
                    hint: "Review completed tasks",
                    count: s.pendingMissionCompletions,
                    to: "/missions?tab=completions",
                    icon: FlagIcon,
                  },
                  ...(s.pendingClaims > 0
                    ? [
                        {
                          label: "Legacy claims",
                          hint: "Clear the retired campaign queue",
                          count: s.pendingClaims,
                          to: "/claims",
                          icon: ClockIcon,
                        },
                      ]
                    : []),
                ].map(({ label, hint, count, to, icon: Icon }) => (
                  <Link
                    to={to}
                    key={to}
                    className="group flex items-center gap-3 rounded-xl border border-transparent bg-muted/35 p-3 hover:border-border hover:bg-muted/70"
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">{label}</span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                        {hint}
                      </span>
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${count > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}
                    >
                      {formatNumber(count)}
                    </span>
                    <ChevronRightIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                <div className="rounded-xl bg-muted/35 p-3">
                  <div className="flex items-center gap-3">
                    <GiftIcon className="h-[18px] w-[18px] text-muted-foreground" />
                    <span className="flex-1 text-xs font-medium">
                      Redemptions & payouts
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatNumber(s.pendingRedemptions)}
                    </span>
                  </div>
                  <div className="ml-7 mt-2 flex flex-wrap gap-3 text-[11px]">
                    <Link
                      className="text-primary hover:underline"
                      to="/redemptions"
                    >
                      Vouchers <span aria-hidden="true">↗</span>
                    </Link>
                    <Link
                      className="text-primary hover:underline"
                      to="/payment-requests"
                    >
                      UPI payments <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="border-t px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
                {pending === 0 ? (
                  <span className="flex items-center gap-2 text-primary">
                    <CheckCircleIcon className="h-4 w-4" />
                    You’re all caught up.
                  </span>
                ) : (
                  "Open a queue to review requests and take action."
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="dashboard-panel" aria-labelledby="offers-title">
          <PanelHeader
            id="offers-title"
            title="Top performing offers"
            description={`Ranked by tracked downloads · ${period.label}`}
            action={
              <Link
                to="/offers"
                aria-label="View all offers"
                className="rounded-md p-1 text-muted-foreground hover:text-primary"
              >
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
            }
          />
          {offers.isLoading ? (
            <div className="space-y-3 p-5 pt-0">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-10" />
              ))}
            </div>
          ) : offers.isError && !offers.data ? (
            <LoadError onRetry={() => void offers.refetch()} />
          ) : !topOffers.length ? (
            <Empty>No offer performance recorded in this period.</Empty>
          ) : (
            <div className="overflow-x-auto px-5 pb-4">
              <table className="w-full text-xs">
                <caption className="sr-only">
                  Top five offers by tracked downloads, then views
                </caption>
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b">
                    <th scope="col" className="pb-3 text-left font-medium">
                      Offer
                    </th>
                    <th scope="col" className="pb-3 text-right font-medium">
                      Views
                    </th>
                    <th
                      scope="col"
                      className="pb-3 pl-3 text-right font-medium"
                    >
                      Downloads
                    </th>
                    <th
                      scope="col"
                      className="pb-3 pl-3 text-right font-medium"
                    >
                      CTR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topOffers.map((offer, index) => (
                    <tr key={offer.id} className="border-b last:border-0">
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className="line-clamp-2 font-medium"
                            title={offer.title}
                          >
                            {offer.title}
                          </span>
                        </div>
                      </td>
                      <td className="text-right font-medium tabular-nums">
                        {formatNumber(offer.views)}
                      </td>
                      <td className="pl-3 text-right tabular-nums text-muted-foreground">
                        {formatNumber(offer.downloads)}
                      </td>
                      <td className="pl-3 text-right tabular-nums text-primary">
                        {percentage(offer.clicks, offer.views)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-[11px]">
            <span className="text-muted-foreground">
              Click-through rate = clicks ÷ views
            </span>
            <span className="font-medium text-primary">
              {totals ? percentage(totals.clicks, totals.views) : "—"} overall
            </span>
          </div>
        </section>
        <EngagementPanel
          range={range}
          totals={totals}
          period={period.label}
          loading={offers.isLoading}
          error={offers.isError}
          retry={() => void offers.refetch()}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section
          className="dashboard-panel overflow-hidden"
          aria-labelledby="proofs-title"
        >
          <PanelHeader
            id="proofs-title"
            title="Recent offer proofs"
            description="Latest 5 submissions · independent of analytics period"
            action={
              <div
                className="flex shrink-0 rounded-lg border p-0.5"
                role="group"
                aria-label="Proof status"
              >
                {(["all", "pending"] as const).map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    aria-pressed={proofFilter === filter}
                    onClick={() => setProofFilter(filter)}
                    className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium ${proofFilter === filter ? "bg-muted" : "text-muted-foreground"}`}
                  >
                    {filter === "all" ? "All" : "Pending"}
                  </button>
                ))}
              </div>
            }
          />
          {recentProofs.isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Skeleton key={n} className="h-10" />
              ))}
            </div>
          ) : recentProofs.isError && !recentProofs.data ? (
            <LoadError onRetry={() => void recentProofs.refetch()}>
              Recent proofs couldn't be loaded.
            </LoadError>
          ) : !recentProofs.data?.items.length ? (
            <Empty>
              {proofFilter === "pending"
                ? "No pending proofs. Your review queue is clear."
                : "No proofs submitted yet. New submissions will appear here."}
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <caption className="sr-only">
                  Latest five {proofFilter === "pending" ? "pending " : ""}offer
                  proofs
                </caption>
                <thead className="border-y bg-muted/25 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-2.5 text-left font-medium"
                    >
                      User / offer
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 text-left font-medium"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-2.5 text-right font-medium"
                    >
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentProofs.data.items.map((proof) => (
                    <tr key={proof.id} className="border-b last:border-0">
                      <td className="px-5 py-3">
                        <p
                          className="max-w-56 truncate font-medium"
                          title={proof.user?.name ?? proof.user?.email}
                        >
                          {proof.user?.name ||
                            proof.user?.email ||
                            "Unknown user"}
                        </p>
                        <p
                          className="mt-1 max-w-56 truncate text-[11px] text-muted-foreground"
                          title={proof.offerTitle}
                        >
                          {proof.offerTitle}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <SubmissionStatusBadge status={proof.status} />
                      </td>
                      <td className="px-5 py-3 text-right text-[11px] text-muted-foreground">
                        <time
                          dateTime={proof.createdAt}
                          className="block min-w-24"
                        >
                          {formatDateTime(proof.createdAt)}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link
            to="/offers?tab=proofs"
            className="flex items-center justify-center gap-2 border-t py-3.5 text-xs font-medium text-primary hover:bg-muted/30"
          >
            Open proof review queue <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </section>
        <div className="space-y-5">
          <section className="dashboard-panel">
            <PanelHeader
              title="Coin overview"
              description="Current balances & pending commitments"
            />
            <div className="space-y-4 px-5 pb-5">
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">In user wallets</span>
                <span className="font-medium tabular-nums">
                  {s ? formatCoins(s.totalWalletBalance) : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                  Pending redemptions
                </span>
                <span className="font-medium tabular-nums">
                  {s ? formatCoins(s.coinsInPendingRedemptions) : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t pt-4 text-xs">
                <span className="font-medium">Combined coins</span>
                <span className="font-semibold tabular-nums">
                  {s
                    ? formatCoins(
                        s.totalWalletBalance + s.coinsInPendingRedemptions,
                      )
                    : "—"}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Coin amounts, not cash revenue. Pending excludes payouts already
                in processing.
              </p>
            </div>
          </section>
          <section className="dashboard-panel p-5">
            <div className="mb-3 flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Referral contribution</h2>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {s ? percentage(s.totalReferrals, s.totalUsers) : "—"}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {s
                ? `${formatNumber(s.totalReferrals)} of ${formatNumber(s.totalUsers)} accounts joined through a referral.`
                : "Share of registered users who joined via a referral code."}
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
              to="/referrals"
            >
              Explore referrals <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </Link>
          </section>
        </div>
      </div>

      <details
        className="dashboard-panel"
        onToggle={(event) => setShowEvents(event.currentTarget.open)}
      >
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium">
          App event analytics{" "}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Optional · loads when opened
          </span>
        </summary>
        {showEvents && (
          <section aria-labelledby="events-title">
            <PanelHeader
              id="events-title"
              title="What users are doing"
              description={`Top tracked app events · ${period.label}`}
              action={
                <Link
                  to="/analytics"
                  aria-label="View all event analytics"
                  className="rounded-md p-1 text-muted-foreground hover:text-primary"
                >
                  <ArrowUpRightIcon className="h-4 w-4" />
                </Link>
              }
            />
            {events.isLoading ? (
              <div className="space-y-5 px-5 pb-5">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-8" />
                ))}
              </div>
            ) : events.isError && !events.data ? (
              <LoadError onRetry={() => void events.refetch()}>
                App event analytics couldn't be loaded.
              </LoadError>
            ) : topEvents.length === 0 ? (
              <Empty>
                No tracked app events in this period. Offer activity is measured
                separately.
              </Empty>
            ) : (
              <div className="space-y-4 px-5 pb-5">
                {topEvents.map((event, index) => (
                  <div key={event.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate" title={event.name}>
                        {eventLabel(event.name)}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatNumber(event.count)}{" "}
                        <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                          {percentage(event.count, events.data!.totalEvents)}
                        </span>
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (event.count / (events.data!.totalEvents || 1)) * 100)}%`,
                          background: [
                            "var(--dashboard-green)",
                            "var(--dashboard-blue)",
                            "var(--dashboard-purple)",
                            "#f59e0b",
                            "#f472b6",
                          ][index],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between border-t px-5 py-3 text-[11px]">
              <span className="text-muted-foreground">
                Share of all tracked app events
              </span>
              <span className="font-medium tabular-nums">
                {events.data
                  ? `${formatNumber(events.data.totalEvents)} total`
                  : "—"}
              </span>
            </div>
          </section>
        )}
      </details>
      <DashboardModules />
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Analytics periods apply to offer activity, top offers and app events.
        Platform totals and review queues show the latest available snapshot.
      </p>
    </div>
  );
};
