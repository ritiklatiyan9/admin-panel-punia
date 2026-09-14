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
import { hotOffersService } from "@/services/hot-offers.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";
import { formatDateTime } from "@/utils/format";
import type { ContentStatus, HotOffer } from "@/types/domain";
import { Segmented } from "@/components/shared/app-preview";
import { OfferFormDialog } from "../hot-offers/OfferFormDialog";
import {
  OFFER_GRID,
  OfferCard,
  OfferCardSkeletons,
} from "../hot-offers/OfferCards";
import { SubmissionsReview } from "../hot-offers/SubmissionsReview";

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const OFFER_COLUMNS: ExportColumn[] = [
  { key: "title", label: "Title" },
  { key: "appName", label: "App" },
  {
    key: "category",
    label: "Category",
    format: (v) => (v as { title: string }).title,
  },
  { key: "rewardAmount", label: "Coins credited" },
  { key: "rewardCoins", label: "Coins shown in app" },
  { key: "featured", label: "Featured", format: (v) => (v ? "Yes" : "No") },
  { key: "status", label: "Status" },
  {
    key: "createdAt",
    label: "Created",
    format: (v) => formatDateTime(v as string | null),
  },
];

export const AppOffersPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const canWrite = useAuthStore((state) => state.user?.role === "SUPER_ADMIN");

  const [view, setView] = useState<"offers" | "submissions">("offers");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "ALL">(
    "ALL",
  );
  const [offerDialog, setOfferDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<HotOffer | null>(null);
  const [deleteOffer, setDeleteOffer] = useState<HotOffer | null>(null);

  // Needed by OfferFormDialog's category picker.
  const categories = useQuery({
    queryKey: ["hot-offers", "categories"],
    queryFn: hotOffersService.listCategories,
  });

  const offers = useQuery({
    queryKey: [
      "hot-offers",
      "offers",
      { page, search, statusFilter, product: true, limit: PAGE_SIZE },
    ],
    queryFn: ({ signal }) =>
      hotOffersService.listOffers(
        {
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          product: true,
        },
        signal,
      ),
    enabled: view === "offers",
  });

  const removeOffer = useMutation({
    mutationFn: (id: string) => hotOffersService.deleteOffer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hot-offers"] });
      setDeleteOffer(null);
      toast.success("Offer deleted");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const openCreate = (): void => {
    setEditingOffer(null);
    setOfferDialog(true);
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "ALL";
  const total = offers.data?.meta.total;

  return (
    <div>
      <PageHeader
        title="App Offers"
        description="Brand and product offers users see on the app home rail, the Explore grid and inside the Web Zone."
        actions={
          canWrite && view === "offers" ? (
            <Button onClick={openCreate}>
              <PlusIcon className="mr-1.5 h-4 w-4" /> New app offer
            </Button>
          ) : undefined
        }
      />

      <Segmented
        className="mb-4"
        size="md"
        value={view}
        onChange={setView}
        options={[
          {
            id: "offers",
            label: (
              <>
                Offers
                {total != null && (
                  <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                    {total}
                  </span>
                )}
              </>
            ),
          },
          { id: "submissions", label: "Submissions" },
        ]}
      />

      {view === "offers" && (
        <>
          <FiltersBar
            search={{
              value: search,
              onChange: (value) => {
                setSearch(value);
                setPage(1);
              },
              placeholder: "Search app offers…",
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
                rows={
                  (offers.data?.items ?? []) as unknown as Record<
                    string,
                    unknown
                  >[]
                }
                columns={OFFER_COLUMNS}
                fileName="app-offers"
                title="App Offers"
                page={page}
                filterSummary={
                  [
                    statusFilter !== "ALL" ? `Status: ${statusFilter}` : "",
                    search.trim() ? `Search: ${search.trim()}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
              />
            </div>
          </FiltersBar>

          {offers.isLoading ? (
            <OfferCardSkeletons />
          ) : !offers.data || offers.data.items.length === 0 ? (
            <Card>
              <EmptyState
                title={hasFilters ? "No offers match" : "No app offers yet"}
                description={
                  hasFilters
                    ? "Try a different search or status."
                    : "Create the first product offer — it shows on the app home rail once published."
                }
                action={
                  canWrite && !hasFilters ? (
                    <Button onClick={openCreate}>
                      <PlusIcon className="mr-1.5 h-4 w-4" /> New app offer
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <>
              <div className={OFFER_GRID}>
                {offers.data.items.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    canWrite={canWrite}
                    onEdit={() => {
                      setEditingOffer(offer);
                      setOfferDialog(true);
                    }}
                    onDelete={() => setDeleteOffer(offer)}
                  />
                ))}
              </div>
              <Pagination meta={offers.data.meta} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {view === "submissions" && <SubmissionsReview product />}

      <OfferFormDialog
        open={offerDialog}
        onOpenChange={setOfferDialog}
        categories={categories.data ?? []}
        offer={editingOffer}
        lockProduct
      />
      <ConfirmDialog
        open={deleteOffer !== null}
        onOpenChange={(open) => !open && setDeleteOffer(null)}
        title={`Delete "${deleteOffer?.title}"?`}
        description="Soft delete — the offer disappears from the app home rail and Explore."
        confirmLabel="Delete"
        destructive
        loading={removeOffer.isPending}
        onConfirm={() => deleteOffer && removeOffer.mutate(deleteOffer.id)}
      />
    </div>
  );
};
