import { useMemo, useState } from "react";
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
import { campaignsService } from "@/services/campaigns.service";
import { apiErrorMessage } from "@/services/api-client";
import { isAdminRole, useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/utils/format";
import type { Campaign, CampaignStatus } from "@/types/domain";
import { OFFER_GRID, OfferCardSkeletons } from "../hot-offers/OfferCards";
import { CampaignCard } from "./CampaignCards";
import { CampaignFormDialog } from "./CampaignFormDialog";

const PAGE_SIZE = 12;
type StatusFilter = CampaignStatus | "ALL";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ENDED", label: "Ended" },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status" },
  { key: "rewardAmount", label: "Reward coins" },
  { key: "budget", label: "Budget coins" },
  {
    key: "startsAt",
    label: "Starts",
    format: (v) => formatDate(v as string | null),
  },
  {
    key: "endsAt",
    label: "Ends",
    format: (v) => formatDate(v as string | null),
  },
  {
    key: "createdAt",
    label: "Created",
    format: (v) => formatDate(v as string | null),
  },
];

export const CampaignsPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  // Every campaign write is adminOnly on the API (ADMIN or SUPER_ADMIN).
  const canWrite = useAuthStore((state) => isAdminRole(state.user));

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [ending, setEnding] = useState<Campaign | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", { page, status, limit: PAGE_SIZE }],
    queryFn: ({ signal }) =>
      campaignsService.list(
        {
          page,
          limit: PAGE_SIZE,
          status: status === "ALL" ? undefined : status,
        },
        signal,
      ),
  });

  // The backend has no campaign text search; filter the current page client-side.
  const visible = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return term
      ? data.items.filter((campaign) =>
          campaign.title.toLowerCase().includes(term),
        )
      : data.items;
  }, [data, search]);

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: CampaignStatus }) =>
      campaignsService.changeStatus(id, next),
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setEnding(null);
      toast.success(`Campaign is now ${campaign.status}`);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const openCreate = (): void => {
    setEditing(null);
    setFormOpen(true);
  };

  const hasFilters = search.trim() !== "" || status !== "ALL";

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Reward campaigns users claim from the app's Mission Board."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <PlusIcon className="mr-1.5 h-4 w-4" /> New campaign
            </Button>
          ) : undefined
        }
      />

      <FiltersBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search by title…",
        }}
        selects={[
          {
            key: "status",
            value: status,
            onChange: (value) => {
              setStatus(value as StatusFilter);
              setPage(1);
            },
            options: STATUS_OPTIONS,
            placeholder: "Status",
            className: "sm:w-40",
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setStatus("ALL");
          setPage(1);
        }}
      >
        <div className="ml-auto">
          <ExportButton
            rows={visible as unknown as Record<string, unknown>[]}
            columns={EXPORT_COLUMNS}
            fileName="campaigns"
            title="Campaigns"
            page={page}
            filterSummary={
              [
                status !== "ALL" ? `Status: ${status}` : "",
                search.trim() ? `Search: ${search.trim()}` : "",
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          />
        </div>
      </FiltersBar>

      {isLoading ? (
        <OfferCardSkeletons />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            title={hasFilters ? "No campaigns match" : "No campaigns yet"}
            description={
              hasFilters
                ? "Try a different search or status."
                : "Create the first campaign — it reaches the app's Mission Board once activated."
            }
            action={
              canWrite && !hasFilters ? (
                <Button onClick={openCreate}>
                  <PlusIcon className="mr-1.5 h-4 w-4" /> New campaign
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className={OFFER_GRID}>
          {visible.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              canWrite={canWrite}
              onEdit={() => {
                setEditing(campaign);
                setFormOpen(true);
              }}
              onStatus={(next) =>
                next === "ENDED"
                  ? setEnding(campaign)
                  : statusMutation.mutate({ id: campaign.id, next })
              }
            />
          ))}
        </div>
      )}
      {/* Search only filters the loaded page, so paging stays available while it's active. */}
      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <CampaignFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        campaign={editing}
      />
      <ConfirmDialog
        open={ending !== null}
        onOpenChange={(open) => !open && setEnding(null)}
        title={`End "${ending?.title}"?`}
        description="Ended campaigns can't be reactivated; it disappears from the Mission Board immediately."
        confirmLabel="End campaign"
        destructive
        loading={statusMutation.isPending}
        onConfirm={() =>
          ending && statusMutation.mutate({ id: ending.id, next: "ENDED" })
        }
      />
    </div>
  );
};
