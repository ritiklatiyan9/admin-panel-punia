import { memo, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowPathIcon,
  BellSlashIcon,
  LinkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FiltersBar,
  type DateRangeValue,
} from "@/components/shared/FiltersBar";
import {
  ExportButton,
  type ExportColumn,
} from "@/components/shared/ExportButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { notificationsService } from "@/services/notifications.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";
import { formatDateTime } from "@/utils/format";
import type { PushAudience, PushLog, PushLogStatus } from "@/types/domain";

const PAGE_SIZE = 10;

const statusVariant: Record<
  PushLogStatus,
  "secondary" | "info" | "success" | "warning" | "destructive"
> = {
  QUEUED: "warning",
  SCHEDULED: "info",
  SENT: "success",
  PARTIAL: "warning",
  FAILED: "destructive",
};

const audienceLabel = (log: PushLog): string => {
  if (log.audience === "all") return "All users";
  if (log.audience === "topic") return `Topic: ${log.topic}`;
  // ponytail: history rows carry only the recipient's userId — show it short,
  // full id in the native tooltip. Resolve to email server-side if it matters.
  return `User: ${log.userId?.slice(0, 8)}…`;
};

const AudienceChip = ({ log }: { log: PushLog }): JSX.Element => {
  if (log.audience === "all") return <Badge variant="info">All users</Badge>;
  if (log.audience === "topic")
    return <Badge variant="secondary">#{log.topic}</Badge>;
  return (
    <Badge variant="outline" title={log.userId ?? undefined}>
      User {log.userId?.slice(0, 8)}…
    </Badge>
  );
};

const EXPORT_COLUMNS: ExportColumn[] = [
  {
    key: "createdAt",
    label: "Sent",
    format: (v) => formatDateTime(v as string | null),
  },
  { key: "sentBy", label: "By", format: (v) => (v as { name: string }).name },
  {
    key: "audience",
    label: "Audience",
    format: (_, row) => audienceLabel(row as unknown as PushLog),
  },
  { key: "type", label: "Type" },
  { key: "title", label: "Title" },
  { key: "body", label: "Body" },
  { key: "status", label: "Status" },
  { key: "successCount", label: "Delivered" },
  { key: "failureCount", label: "Failed" },
  {
    key: "scheduledAt",
    label: "Scheduled for",
    format: (v) => (v ? formatDateTime(v as string) : ""),
  },
  { key: "error", label: "Error" },
];

/** yyyy-MM-dd in the viewer's timezone, to match the date-range inputs. */
const localDay = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-CA");

const pending = (status: PushLogStatus): boolean =>
  status === "QUEUED" || status === "SCHEDULED";

/** Thin two-tone delivered/failed bar with the counts spelled out under it. */
const DeliveryCell = ({ log }: { log: PushLog }): JSX.Element => {
  if (pending(log.status))
    return <span className="text-sm text-muted-foreground">—</span>;
  const total = log.successCount + log.failureCount;
  const pct = (n: number): string => (total ? `${(n / total) * 100}%` : "0%");
  return (
    <div className="min-w-32">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-teal-500" style={{ width: pct(log.successCount) }} />
        <div className="bg-red-400" style={{ width: pct(log.failureCount) }} />
      </div>
      <p className="mt-1 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
        <span className="text-teal-600 dark:text-teal-400">
          {log.successCount} delivered
        </span>
        {log.failureCount > 0 && (
          <>
            {" · "}
            <span className="text-red-500">{log.failureCount} failed</span>
          </>
        )}
      </p>
    </div>
  );
};

interface RowProps {
  log: PushLog;
  canCancel: boolean;
  onResend?: (log: PushLog) => void;
  onCancel: (log: PushLog) => void;
}

// Memoized so a poll tick only re-renders rows whose data actually changed.
const HistoryRow = memo(
  ({ log, canCancel, onResend, onCancel }: RowProps): JSX.Element => (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm">
        {formatDateTime(log.createdAt)}
        <p className="text-xs text-muted-foreground">by {log.sentBy.name}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <AudienceChip log={log} />
      </TableCell>
      <TableCell className="max-w-72" title={`${log.title}\n\n${log.body}`}>
        <p className="truncate text-sm font-medium">{log.title}</p>
        <p className="truncate text-xs text-muted-foreground">{log.body}</p>
        {(log.imageUrl || log.route || log.silent) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {log.imageUrl && (
              <span className="flex items-center gap-1" title={log.imageUrl}>
                <PhotoIcon className="h-3.5 w-3.5" /> Image
              </span>
            )}
            {log.route && (
              <span className="flex items-center gap-1">
                <LinkIcon className="h-3.5 w-3.5" /> {log.route}
              </span>
            )}
            {log.silent && (
              <span className="flex items-center gap-1">
                <BellSlashIcon className="h-3.5 w-3.5" /> Silent
              </span>
            )}
          </p>
        )}
      </TableCell>
      <TableCell>
        <DeliveryCell log={log} />
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[log.status]}>
          {log.status === "QUEUED" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          )}
          {log.status}
        </Badge>
        {log.status === "SCHEDULED" && log.scheduledAt && (
          <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
            Fires {formatDateTime(log.scheduledAt)}
          </p>
        )}
        {(log.status === "PARTIAL" || log.status === "FAILED") && log.error && (
          <p className="mt-1 max-w-64 text-xs text-muted-foreground">
            {log.error}
          </p>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {log.status === "SCHEDULED" && canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => onCancel(log)}
          >
            Cancel
          </Button>
        )}
        {onResend && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResend(log)}
            title="Prefill the composer with this notification"
          >
            <ArrowPathIcon className="mr-1 h-3.5 w-3.5" /> Send again
          </Button>
        )}
      </TableCell>
    </TableRow>
  ),
);

interface HistoryTableProps {
  /** Present only when the viewer can compose (super admin). */
  onResend?: (log: PushLog) => void;
}

export const HistoryTable = ({ onResend }: HistoryTableProps): JSX.Element => {
  const queryClient = useQueryClient();
  const canCancel = useAuthStore((state) => state.user?.role === "SUPER_ADMIN");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PushLogStatus | "ALL">("ALL");
  const [audience, setAudience] = useState<PushAudience | "ALL">("ALL");
  const [search, setSearch] = useState(""); // FiltersBar debounces this ~400ms
  const [range, setRange] = useState<DateRangeValue>({ from: "", to: "" });
  const [cancelLog, setCancelLog] = useState<PushLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "history", page],
    queryFn: ({ signal }) =>
      notificationsService.history({ page, limit: PAGE_SIZE }, signal),
    // Poll only while something on this page is still in flight; stop once all have settled.
    refetchInterval: (query) =>
      query.state.data?.items.some((log) => pending(log.status)) ? 5000 : false,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => notificationsService.cancelScheduled(id),
    onSuccess: () => toast.success("Scheduled push cancelled"),
    // A 404 means it already fired — refetch either way so the row shows its real state.
    onError: (error) => toast.error(apiErrorMessage(error)),
    onSettled: () => {
      setCancelLog(null);
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "history"],
      });
    },
  });

  // The history endpoint only paginates — these filters apply to the loaded page client-side.
  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      (data?.items ?? []).filter((log) => {
        const day = localDay(log.createdAt);
        return (
          (status === "ALL" || log.status === status) &&
          (audience === "ALL" || log.audience === audience) &&
          (!range.from || day >= range.from) &&
          (!range.to || day <= range.to) &&
          (!term ||
            log.title.toLowerCase().includes(term) ||
            log.body.toLowerCase().includes(term) ||
            (log.topic ?? "").toLowerCase().includes(term))
        );
      }),
    [data, status, audience, range.from, range.to, term],
  );

  const hasFilters =
    status !== "ALL" ||
    audience !== "ALL" ||
    Boolean(term) ||
    Boolean(range.from || range.to);
  const filterSummary =
    [
      status !== "ALL" ? `Status: ${status}` : "",
      audience !== "ALL" ? `Audience: ${audience}` : "",
      term ? `Search: ${term}` : "",
      range.from || range.to
        ? `Dates: ${range.from || "…"} – ${range.to || "…"}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ") || undefined;

  const table = isLoading ? (
    <TableSkeleton />
  ) : visible.length === 0 ? (
    hasFilters ? (
      <EmptyState
        title="No sends match these filters"
        description="Try widening the date range or clearing the filters above."
      />
    ) : (
      <EmptyState
        title="No notifications sent yet"
        description="Compose your first notification above — it lands on users' devices within seconds and shows up here with its delivery outcome."
      />
    )
  ) : (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sent</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Notification</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((log) => (
            <HistoryRow
              key={log.id}
              log={log}
              canCancel={canCancel}
              onResend={onResend}
              onCancel={setCancelLog}
            />
          ))}
        </TableBody>
      </Table>
      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </>
  );

  return (
    <>
      <FiltersBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search title, body, topic…",
        }}
        selects={[
          {
            key: "status",
            value: status,
            onChange: (value) => setStatus(value as PushLogStatus | "ALL"),
            options: [
              { value: "ALL", label: "All statuses" },
              { value: "QUEUED", label: "Queued" },
              { value: "SCHEDULED", label: "Scheduled" },
              { value: "SENT", label: "Sent" },
              { value: "PARTIAL", label: "Partial" },
              { value: "FAILED", label: "Failed" },
            ],
            placeholder: "Status",
            className: "sm:w-36",
          },
          {
            key: "audience",
            value: audience,
            onChange: (value) => setAudience(value as PushAudience | "ALL"),
            options: [
              { value: "ALL", label: "All audiences" },
              { value: "all", label: "Broadcast" },
              { value: "user", label: "Single user" },
              { value: "topic", label: "Topic" },
            ],
            placeholder: "Audience",
            className: "sm:w-36",
          },
        ]}
        dateRange={{ value: range, onChange: setRange }}
        onClearAll={() => {
          setSearch("");
          setStatus("ALL");
          setAudience("ALL");
          setRange({ from: "", to: "" });
        }}
      >
        <div className="ml-auto">
          <ExportButton
            rows={visible as unknown as Record<string, unknown>[]}
            columns={EXPORT_COLUMNS}
            fileName="notification-history"
            title="Notification send history"
            page={page}
            filterSummary={filterSummary}
          />
        </div>
      </FiltersBar>
      <Card>{table}</Card>

      <ConfirmDialog
        open={cancelLog !== null}
        onOpenChange={(open) => !open && setCancelLog(null)}
        title={`Cancel "${cancelLog?.title}"?`}
        description={`Scheduled for ${formatDateTime(cancelLog?.scheduledAt ?? null)}. It will not be sent.`}
        confirmLabel="Cancel send"
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancelLog && cancel.mutate(cancelLog.id)}
      />
    </>
  );
};
