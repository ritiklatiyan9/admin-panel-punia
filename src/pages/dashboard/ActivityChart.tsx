import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { AnalyticsRange, HotOffersAnalytics } from "@/types/domain";
import { formatNumber } from "@/utils/format";
import { ACTIVITY_METRICS, type ActivityMetric } from "./dashboard-utils";

const dateLabel = (bucket: string, range: AnalyticsRange): string =>
  new Date(`${bucket}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    ...(range === "monthly" ? { year: "2-digit" } : { day: "numeric" }),
    timeZone: "UTC",
  });

const ActivityTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover p-3 text-xs shadow-lg">
      <p className="mb-2 font-medium">
        {dateLabel(String(label), "daily")} · UTC
      </p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex min-w-32 items-center justify-between gap-5 py-1"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold tabular-nums">
            {formatNumber(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ActivityChart({
  data,
  range,
  metric,
}: {
  data: HotOffersAnalytics["series"];
  range: AnalyticsRange;
  metric: ActivityMetric | "all";
}): JSX.Element {
  const id = useId().replace(/:/g, "");
  const metrics = ACTIVITY_METRICS.filter(
    (item) => metric === "all" || item.key === metric,
  );
  return (
    <div
      className="h-[250px] w-full"
      role="img"
      aria-label={`Offer activity by ${range === "daily" ? "day" : range === "weekly" ? "week" : "month"}. Exact values are available in the activity data table below.`}
    >
      <ResponsiveContainer width="100%" height="100%" debounce={100}>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
          accessibilityLayer
        >
          <defs>
            {metrics.map((item) => (
              <linearGradient
                key={item.key}
                id={`${id}-${item.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={item.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="bucket"
            tickFormatter={(value: string) => dateLabel(value, range)}
            minTickGap={32}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--dashboard-muted)", fontSize: 11 }}
            dy={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--dashboard-muted)", fontSize: 11 }}
            tickFormatter={(value: number) =>
              Intl.NumberFormat("en", { notation: "compact" }).format(value)
            }
          />
          <Tooltip content={<ActivityTooltip />} />
          {metrics.map((item) => (
            <Area
              key={item.key}
              name={item.label}
              dataKey={item.key}
              type="linear"
              stroke={item.color}
              strokeWidth={2.5}
              fill={`url(#${id}-${item.key})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 3,
                stroke: "var(--dashboard-surface)",
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
