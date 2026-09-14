import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FiltersBar } from "@/components/shared/FiltersBar";
import {
  ExportButton,
  type ExportColumn,
} from "@/components/shared/ExportButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { missionsService, type Mission } from "@/services/missions.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";
import { formatDateTime } from "@/utils/format";
import type { ContentStatus } from "@/types/domain";
import { Segmented } from "@/components/shared/app-preview";
import { OFFER_GRID, OfferCardSkeletons } from "../hot-offers/OfferCards";
import { MissionCard } from "./MissionCards";
import { MissionFormDialog } from "./MissionFormDialog";
import { CompletionsReview } from "./CompletionsReview";
import { GameSettings } from "./GameSettings";

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "rewardCoins", label: "Coins" },
  { key: "status", label: "Status" },
  { key: "sortOrder", label: "Sort order" },
  {
    key: "updatedAt",
    label: "Updated",
    format: (v) => formatDateTime(v as string | null),
  },
  {
    key: "createdAt",
    label: "Created",
    format: (v) => formatDateTime(v as string | null),
  },
];

type Tab = "missions" | "completions" | "game";

export const MissionsPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const canWrite = useAuthStore((state) => state.user?.role === "SUPER_ADMIN");

  const [tab, setTab] = useState<Tab>("missions");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "ALL">(
    "ALL",
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [deleting, setDeleting] = useState<Mission | null>(null);

  const missions = useQuery({
    queryKey: ["missions", "admin"],
    queryFn: missionsService.list,
    enabled: tab === "missions",
  });

  const remove = useMutation({
    mutationFn: (id: string) => missionsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["missions"] });
      setDeleting(null);
      toast.success("Mission deleted");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const openCreate = (): void => {
    setEditing(null);
    setFormOpen(true);
  };

  // ponytail: /missions/admin returns the whole list (no query params), so
  // search, status and paging are client-side; move server-side if it grows.
  const needle = search.trim().toLowerCase();
  const filtered = (missions.data ?? []).filter(
    (mission) =>
      (statusFilter === "ALL" || mission.status === statusFilter) &&
      (needle === "" ||
        mission.title.toLowerCase().includes(needle) ||
        mission.description.toLowerCase().includes(needle)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  );

  const hasFilters = search.trim() !== "" || statusFilter !== "ALL";
  const filterSummary =
    [
      statusFilter !== "ALL" ? `Status: ${statusFilter}` : "",
      search.trim() ? `Search: ${search.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" · ") || undefined;

  return (
    <div>
      <PageHeader
        title="Mission Board"
        description="Missions users complete for coins, their review queue, and the tic-tac-toe game."
        actions={
          canWrite && tab === "missions" ? (
            <Button onClick={openCreate}>
              <PlusIcon className="mr-1.5 h-4 w-4" /> New mission
            </Button>
          ) : undefined
        }
      />

      <Segmented
        className="mb-4"
        size="md"
        value={tab}
        onChange={setTab}
        options={[
          {
            id: "missions",
            label: (
              <>
                Missions
                {missions.data && (
                  <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                    {filtered.length}
                  </span>
                )}
              </>
            ),
          },
          { id: "completions", label: "Completions" },
          { id: "game", label: "Game (Tic-Tac-Toe)" },
        ]}
      />

      {tab === "missions" && (
        <>
          <FiltersBar
            search={{
              value: search,
              onChange: (value) => {
                setSearch(value);
                setPage(1);
              },
              placeholder: "Search missions…",
            }}
            selects={[
              {
                key: "status",
                value: statusFilter,
                onChange: (value) => {
                  setStatusFilter(value as ContentStatus | "ALL");
                  setPage(1);
                },
                options: STATUS_OPTIONS,
                placeholder: "Status",
                className: "sm:w-40",
              },
            ]}
            onClearAll={() => {
              setSearch("");
              setStatusFilter("ALL");
              setPage(1);
            }}
          >
            <div className="ml-auto">
              <ExportButton
                rows={filtered as unknown as Record<string, unknown>[]}
                columns={EXPORT_COLUMNS}
                fileName="missions"
                title="Missions"
                filterSummary={filterSummary}
              />
            </div>
          </FiltersBar>

          {missions.isLoading ? (
            <OfferCardSkeletons />
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                title={hasFilters ? "No missions match" : "No missions yet"}
                description={
                  hasFilters
                    ? "Try a different search or status."
                    : "Create the first mission — it shows on the Mission Board once published."
                }
                action={
                  canWrite && !hasFilters ? (
                    <Button onClick={openCreate}>
                      <PlusIcon className="mr-1.5 h-4 w-4" /> New mission
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <>
              <div className={OFFER_GRID}>
                {pageItems.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    canWrite={canWrite}
                    onEdit={() => {
                      setEditing(mission);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(mission)}
                  />
                ))}
              </div>
              <Pagination
                meta={{
                  page: current,
                  limit: PAGE_SIZE,
                  total: filtered.length,
                  totalPages,
                }}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      {tab === "completions" && <CompletionsReview />}

      {tab === "game" && <GameSettings />}

      <MissionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mission={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.title}"?`}
        description="Soft delete — the mission disappears from the app and this list. Existing completions keep their history."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
};
