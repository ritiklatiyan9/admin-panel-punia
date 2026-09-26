import { Link } from "react-router-dom";
import { ArrowUpRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsRange, HotOffersAnalytics } from "@/types/domain";
import { formatNumber } from "@/utils/format";
import { ACTIVITY_METRICS, percentage } from "./dashboard-utils";

export function EngagementPanel({
  range,
  totals,
  period,
  loading,
  error,
  retry,
}: {
  range: AnalyticsRange;
  totals?: HotOffersAnalytics["totals"];
  period: string;
  loading: boolean;
  error: boolean;
  retry: () => void;
}): JSX.Element {
  const maximum = totals
    ? Math.max(totals.views, totals.clicks, totals.downloads, 1)
    : 1;
  return (
    <section className="dashboard-panel" aria-labelledby="engagement-title">
      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div>
          <h2 id="engagement-title" className="font-semibold tracking-tight">
            Engagement breakdown
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            From discovery to download intent · {period}
          </p>
        </div>
        <Link
          to={`/offers?tab=analytics&range=${range}`}
          aria-label="Explore offer engagement"
          className="rounded-md p-1 text-muted-foreground hover:text-primary"
        >
          <ArrowUpRightIcon className="h-4 w-4" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-5 p-5">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-10" />
          ))}
        </div>
      ) : error && !totals ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-5 text-center text-sm text-muted-foreground">
          <p>Engagement data couldn't be loaded.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            <ArrowPathIcon className="mr-2 h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-5 px-5 pb-5">
            {ACTIVITY_METRICS.map((item) => (
              <div key={item.key}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: item.color }}
                    />
                    {item.label === "Downloads"
                      ? "Download intent"
                      : item.label}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {totals ? formatNumber(totals[item.key]) : "—"}
                  </span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded bg-muted"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${((totals?.[item.key] ?? 0) / maximum) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mx-5 mb-4 grid grid-cols-2 divide-x rounded-xl border bg-muted/20">
            <div className="p-3.5">
              <p className="text-[10px] text-muted-foreground">
                Click-through rate
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {totals ? percentage(totals.clicks, totals.views) : "—"}
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] text-muted-foreground">
                Download intent / views
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {totals ? percentage(totals.downloads, totals.views) : "—"}
              </p>
            </div>
          </div>
          <p className="border-t px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Event counts, not a unique-user funnel. Repeat actions can make
            rates exceed 100%.
          </p>
        </>
      )}
    </section>
  );
}
