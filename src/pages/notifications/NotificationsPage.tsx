import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { FiltersBar } from "@/components/shared/FiltersBar";
import {
  ExportButton,
  type ExportColumn,
} from "@/components/shared/ExportButton";
import { Segmented } from "@/components/shared/app-preview";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notificationsService } from "@/services/notifications.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import type { NotificationType, PushLog } from "@/types/domain";
import { Composer } from "./Composer";
import { HistoryTable } from "./HistoryTable";

const PAGE_SIZE = 10;

const typeBadge: Record<
  NotificationType,
  "secondary" | "info" | "warning" | "success"
> = {
  SYSTEM: "secondary",
  CAMPAIGN: "info",
  CLAIM: "warning",
  WALLET: "success",
};

const TYPE_OPTIONS = [
  { value: "ALL", label: "All types" },
  { value: "SYSTEM", label: "System" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "CLAIM", label: "Claim" },
  { value: "WALLET", label: "Wallet" },
];

const INBOX_COLUMNS: ExportColumn[] = [
  {
    key: "createdAt",
    label: "Received",
    format: (v) => formatDateTime(v as string | null),
  },
  { key: "type", label: "Type" },
  { key: "title", label: "Title" },
  { key: "body", label: "Body" },
  {
    key: "readAt",
    label: "Read",
    format: (v) => (v ? formatDateTime(v as string) : "Unread"),
  },
];

/** The admin's own notification inbox (the sidebar unread badge links here). */
const InboxView = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { page, unreadOnly }],
    queryFn: ({ signal }) =>
      notificationsService.list({ page, limit: PAGE_SIZE, unreadOnly }, signal),
  });

  // unreadOnly is the only API filter — type/search filter the loaded page client-side.
  const term = search.trim().toLowerCase();
  const visible = (data?.items ?? []).filter(
    (notification) =>
      (typeFilter === "ALL" || notification.type === typeFilter) &&
      (!term ||
        notification.title.toLowerCase().includes(term) ||
        notification.body.toLowerCase().includes(term)),
  );

  const markRead = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <>
      <FiltersBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search title or body…",
        }}
        selects={[
          {
            key: "read",
            value: unreadOnly ? "UNREAD" : "ALL",
            onChange: (value) => {
              setUnreadOnly(value === "UNREAD");
              setPage(1);
            },
            options: [
              { value: "ALL", label: "Read & unread" },
              { value: "UNREAD", label: "Unread only" },
            ],
            placeholder: "Read state",
            className: "sm:w-40",
          },
          {
            key: "type",
            value: typeFilter,
            onChange: (value) =>
              setTypeFilter(value as NotificationType | "ALL"),
            options: TYPE_OPTIONS,
            placeholder: "Type",
            className: "sm:w-40",
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setTypeFilter("ALL");
          setUnreadOnly(false);
          setPage(1);
        }}
      >
        <div className="ml-auto">
          <ExportButton
            rows={visible as unknown as Record<string, unknown>[]}
            columns={INBOX_COLUMNS}
            fileName="notifications-inbox"
            title="Notifications inbox"
            page={page}
            filterSummary={
              [
                unreadOnly ? "Unread only" : "",
                typeFilter !== "ALL" ? `Type: ${typeFilter}` : "",
                term ? `Search: ${term}` : "",
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          />
        </div>
      </FiltersBar>

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No notifications"
            description={
              unreadOnly ? "You're all caught up." : "Nothing here yet."
            }
          />
        ) : (
          <>
            <ul className="divide-y">
              {visible.map((notification) => {
                const unread = notification.readAt === null;
                return (
                  <li
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-4",
                      unread && "bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-2 h-2 w-2 shrink-0 rounded-full",
                        unread ? "bg-primary" : "bg-transparent",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            unread ? "font-semibold" : "font-medium",
                          )}
                        >
                          {notification.title}
                        </p>
                        <Badge variant={typeBadge[notification.type]}>
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    {unread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate(notification.id)}
                        disabled={markRead.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {data && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </Card>
    </>
  );
};

export const NotificationsPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  // The server enforces SUPER_ADMIN on /send — this just hides a composer that would 403.
  const canSend = useAuthStore((state) => state.user?.role === "SUPER_ADMIN");

  const [view, setView] = useState<"send" | "inbox">("send");
  const [prefill, setPrefill] = useState<PushLog | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Same key/fn as the Topbar and Sidebar bell — react-query dedupes, no extra request.
  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsService.unreadCount,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  // Stable so memoized history rows don't re-render on every page render.
  const resend = useCallback((log: PushLog): void => {
    setPrefill({ ...log }); // new identity each click → the composer re-hydrates
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Compose pushes to your users and track delivery — plus your own inbox."
        actions={
          view === "inbox" && (
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckIcon className="mr-1.5 h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />

      <Segmented
        className="mb-4"
        size="md"
        value={view}
        onChange={setView}
        options={[
          { id: "send", label: "Send" },
          {
            id: "inbox",
            label: (
              <>
                Inbox
                {unread.data != null && unread.data > 0 && (
                  <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                    {unread.data}
                  </span>
                )}
              </>
            ),
          },
        ]}
      />

      {view === "send" ? (
        <>
          {canSend && (
            // scroll-mt clears the sticky topbar when "Send again" scrolls here.
            <div ref={composerRef} className="scroll-mt-20">
              <Composer prefill={prefill} />
            </div>
          )}
          <HistoryTable onResend={canSend ? resend : undefined} />
        </>
      ) : (
        <InboxView />
      )}
    </div>
  );
};
