import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownTrayIcon,
  CursorArrowRaysIcon,
  EyeIcon,
  FireIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FiltersBar } from "@/components/shared/FiltersBar";
import {
  ExportButton,
  type ExportColumn,
} from "@/components/shared/ExportButton";
import { StatCard } from "@/components/shared/StatCard";
import { Segmented } from "@/components/shared/app-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hotOffersService } from "@/services/hot-offers.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";
import { formatDateTime } from "@/utils/format";
import type {
  AnalyticsRange,
  ContentStatus,
  HotOffer,
  OfferCategory,
} from "@/types/domain";
import { CategoryCard } from "./CategoryCards";
import { OFFER_GRID, OfferCard, OfferCardSkeletons } from "./OfferCards";

const CategoryFormDialog = lazy(() =>
  import("./CategoryFormDialog").then((m) => ({
    default: m.CategoryFormDialog,
  })),
);
const OfferFormDialog = lazy(() =>
  import("./OfferFormDialog").then((m) => ({ default: m.OfferFormDialog })),
);
const SubmissionsReview = lazy(() =>
  import("./SubmissionsReview").then((m) => ({ default: m.SubmissionsReview })),
);
const RewardSettings = lazy(() =>
  import("./RewardSettings").then((m) => ({ default: m.RewardSettings })),
);
const FraudDetection = lazy(() =>
  import("./FraudDetection").then((m) => ({ default: m.FraudDetection })),
);

const PAGE_SIZE = 12;

// The one admin module for everything users earn from (was Hot Offers + App
// Offers + Campaigns). The tab lives in ?tab= so other pages can deep-link.
const VIEWS = [
  "offers",
  "proofs",
  "categories",
  "analytics",
  "fraud",
  "settings",
] as const;
type View = (typeof VIEWS)[number];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PUBLISHED", label: "Live" },
  { value: "DRAFT", label: "Draft (hidden)" },
  { value: "ARCHIVED", label: "Archived (hidden)" },
];

type Where = "ALL" | "HOME" | "LIST";
const WHERE_OPTIONS: { value: Where; label: string }[] = [
  { value: "ALL", label: "All placements" },
  { value: "HOME", label: "Featured on Home" },
  { value: "LIST", label: "Feedback Zone only" },
];

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  daily: "Last 14 days",
  weekly: "Last 12 weeks",
  monthly: "Last 12 months",
};

const CATEGORY_COLUMNS: ExportColumn[] = [
  { key: "title", label: "Title" },
  { key: "slug", label: "Slug" },
  { key: "subtitle", label: "Subtitle" },
  { key: "priority", label: "Priority" },
  { key: "offerCount", label: "Offers" },
  { key: "featured", label: "Featured", format: (v) => (v ? "Yes" : "No") },
  { key: "status", label: "Status" },
  {
    key: "createdAt",
    label: "Created",
    format: (v) => formatDateTime(v as string | null),
  },
];

const OFFER_COLUMNS: ExportColumn[] = [
  { key: "title", label: "Title" },
  { key: "appName", label: "App" },
  {
    key: "category",
    label: "Category",
    format: (v) => (v as { title: string }).title,
  },
  { key: "rewardAmount", label: "Coins earned" },
  { key: "rewardCoins", label: "Coins shown in app" },
  { key: "isProduct", label: "On Home", format: (v) => (v ? "Yes" : "No") },
  { key: "difficulty", label: "Difficulty" },
  { key: "priority", label: "Priority" },
  { key: "featured", label: "Featured", format: (v) => (v ? "Yes" : "No") },
  { key: "trending", label: "Trending", format: (v) => (v ? "Yes" : "No") },
  { key: "status", label: "Status" },
  {
    key: "expiresAt",
    label: "Expires",
    format: (v) => formatDateTime(v as string | null),
  },
  {
    key: "createdAt",
    label: "Created",
    format: (v) => formatDateTime(v as string | null),
  },
];

const SERIES_COLUMNS: ExportColumn[] = [
  { key: "bucket", label: "Bucket" },
  { key: "views", label: "Views" },
  { key: "clicks", label: "Clicks" },
  { key: "downloads", label: "Downloads" },
];

/** Tab count badge, shown once that tab's data is loaded. */
const Count = ({ value }: { value: number | undefined }): JSX.Element | null =>
  value == null ? null : (
    <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
      {value}
    </span>
  );

export const HotOffersPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canWrite = user?.role === "SUPER_ADMIN";

  const [params, setParams] = useSearchParams();
  const tab = params.get("tab");
  const view: View = VIEWS.find((v) => v === tab) ?? "offers";
  const setView = (next: View): void =>
    setParams(next === "offers" ? {} : { tab: next }, { replace: true });

  // categories state
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OfferCategory | null>(
    null,
  );
  const [deleteCategory, setDeleteCategory] = useState<OfferCategory | null>(
    null,
  );

  // offers state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "ALL">(
    "ALL",
  );
  const [where, setWhere] = useState<Where>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [offerDialog, setOfferDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<HotOffer | null>(null);
  const [deleteOffer, setDeleteOffer] = useState<HotOffer | null>(null);

  // analytics state
  const requestedRange = params.get("range");
  const range: AnalyticsRange =
    requestedRange === "weekly" || requestedRange === "monthly"
      ? requestedRange
      : "daily";
  const setRange = (next: AnalyticsRange): void => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.set("range", next);
        return updated;
      },
      { replace: true },
    );
  };

  const categories = useQuery({
    queryKey: ["hot-offers", "categories"],
    queryFn: ({ signal }) => hotOffersService.listCategories(signal),
    enabled: view === "offers" || view === "categories",
  });

  const offers = useQuery({
    queryKey: [
      "hot-offers",
      "offers",
      { page, search, statusFilter, where, categoryFilter, limit: PAGE_SIZE },
    ],
    queryFn: ({ signal }) =>
      hotOffersService.listOffers(
        {
          page,
          limit: PAGE_SIZE,
          // FiltersBar already debounces the search input.
          search: search.trim() || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          category: categoryFilter === "ALL" ? undefined : categoryFilter,
          product: where === "ALL" ? undefined : where === "HOME",
        },
        signal,
      ),
    enabled: view === "offers",
  });

  // Tab badge only. Lives under ["hot-offers","submissions"], so reviewing a
  // proof (which invalidates that prefix) refreshes it.
  const pendingProofs = useQuery({
    queryKey: ["hot-offers", "submissions", "pending-count"],
    queryFn: ({ signal }) =>
      hotOffersService.submissionCount({ status: "PENDING" }, signal),
  });

  const analytics = useQuery({
    queryKey: ["hot-offers", "analytics", range],
    queryFn: () => hotOffersService.analytics(range),
    enabled: view === "analytics",
  });

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ["hot-offers"] });
  };

  const removeCategory = useMutation({
    mutationFn: (id: string) => hotOffersService.deleteCategory(id),
    onSuccess: () => {
      invalidate();
      setDeleteCategory(null);
      toast.success("Category deleted");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const removeOffer = useMutation({
    mutationFn: (id: string) => hotOffersService.deleteOffer(id),
    onSuccess: () => {
      invalidate();
      setDeleteOffer(null);
      toast.success("Offer deleted");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const openCreateCategory = (): void => {
    setEditingCategory(null);
    setCategoryDialog(true);
  };
  const openCreateOffer = (): void => {
    setEditingOffer(null);
    setOfferDialog(true);
  };

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    where !== "ALL" ||
    categoryFilter !== "ALL";
  const percent = (value: number): string => `${(value * 100).toFixed(1)}%`;

  return (
    <div>
      <PageHeader
        title="Offers"
        description="Apps and tasks users complete for coins. Live offers show in the app's Feedback Zone and Explore; switch on “Home” to also feature one on the Home screen."
        actions={
          canWrite ? (
            view === "categories" ? (
              <Button onClick={openCreateCategory}>
                <PlusIcon className="mr-1.5 h-4 w-4" /> New category
              </Button>
            ) : view === "offers" ? (
              <Button onClick={openCreateOffer}>
                <PlusIcon className="mr-1.5 h-4 w-4" /> Add offer
              </Button>
            ) : undefined
          ) : undefined
        }
      />

      <div className="mb-4 max-w-full overflow-x-auto whitespace-nowrap">
        <Segmented
          size="md"
          value={view}
          onChange={setView}
          options={[
            {
              id: "offers",
              label: (
                <>
                  Offers
                  <Count value={offers.data?.meta.total} />
                </>
              ),
            },
            {
              id: "proofs",
              label: (
                <>
                  Proofs to review
                  <Count value={pendingProofs.data} />
                </>
              ),
            },
            {
              id: "categories",
              label: (
                <>
                  Categories
                  <Count value={categories.data?.length} />
                </>
              ),
            },
            { id: "analytics", label: "Analytics" },
            { id: "fraud", label: "Fraud" },
            { id: "settings", label: "Settings" },
          ]}
        />
      </div>

      {view === "offers" && (
        <>
          <FiltersBar
            search={{
              value: search,
              onChange: (value) => {
                setSearch(value);
                setPage(1);
              },
              placeholder: "Search offers…",
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
              {
                key: "where",
                value: where,
                onChange: (value) => {
                  setWhere(value as Where);
                  setPage(1);
                },
                options: WHERE_OPTIONS,
                placeholder: "Placement",
              },
              {
                key: "category",
                value: categoryFilter,
                onChange: (value) => {
                  setCategoryFilter(value);
                  setPage(1);
                },
                options: [
                  { value: "ALL", label: "All categories" },
                  ...(categories.data ?? []).map((c) => ({
                    value: c.slug,
                    label: c.title,
                  })),
                ],
                placeholder: "Category",
              },
            ]}
            onClearAll={() => {
              setSearch("");
              setStatusFilter("ALL");
              setWhere("ALL");
              setCategoryFilter("ALL");
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
                fileName="offers"
                title="Offers"
                page={page}
                filterSummary={
                  [
                    statusFilter !== "ALL" ? `Status: ${statusFilter}` : "",
                    where !== "ALL"
                      ? `Placement: ${WHERE_OPTIONS.find((w) => w.value === where)?.label}`
                      : "",
                    categoryFilter !== "ALL"
                      ? `Category: ${
                          categories.data?.find(
                            (c) => c.slug === categoryFilter,
                          )?.title ?? categoryFilter
                        }`
                      : "",
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
                title={hasFilters ? "No offers match" : "No offers yet"}
                description={
                  hasFilters
                    ? "Try a different search or filter."
                    : "Add your first offer — it goes live in the app's Feedback Zone as soon as you save."
                }
                action={
                  canWrite && !hasFilters ? (
                    <Button onClick={openCreateOffer}>
                      <PlusIcon className="mr-1.5 h-4 w-4" /> Add offer
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

      {view === "proofs" && (
        <Suspense fallback={<TableSkeleton />}>
          <SubmissionsReview />
        </Suspense>
      )}

      {view === "categories" && (
        <>
          <FiltersBar>
            <p className="text-sm text-muted-foreground">
              Categories are the small label above an offer&apos;s title in the
              app and the filter chips on the website.
            </p>
            <div className="ml-auto">
              <ExportButton
                rows={
                  (categories.data ?? []) as unknown as Record<
                    string,
                    unknown
                  >[]
                }
                columns={CATEGORY_COLUMNS}
                fileName="offer-categories"
                title="Offer categories"
              />
            </div>
          </FiltersBar>

          {categories.isLoading ? (
            <OfferCardSkeletons />
          ) : !categories.data || categories.data.length === 0 ? (
            <Card>
              <EmptyState
                title="No categories yet"
                description="Offers need a category — create one (e.g. “Feedback Zone”) before adding offers."
                action={
                  canWrite ? (
                    <Button onClick={openCreateCategory}>
                      <PlusIcon className="mr-1.5 h-4 w-4" /> New category
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className={OFFER_GRID}>
              {categories.data.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  canWrite={canWrite}
                  onEdit={() => {
                    setEditingCategory(category);
                    setCategoryDialog(true);
                  }}
                  onDelete={() => setDeleteCategory(category)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === "fraud" && (
        <Suspense fallback={<TableSkeleton />}>
          <FraudDetection />
        </Suspense>
      )}

      {view === "settings" && (
        <Suspense fallback={<TableSkeleton />}>
          <RewardSettings />
        </Suspense>
      )}

      {view === "analytics" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              value={range}
              onValueChange={(value) => setRange(value as AnalyticsRange)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Last 14 days</SelectItem>
                <SelectItem value="weekly">Last 12 weeks</SelectItem>
                <SelectItem value="monthly">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton
              rows={
                (analytics.data?.series ?? []) as unknown as Record<
                  string,
                  unknown
                >[]
              }
              columns={SERIES_COLUMNS}
              fileName="offers-analytics"
              title="Offers analytics timeline"
              filterSummary={`Range: ${RANGE_LABELS[range]}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Views"
              value={analytics.data?.totals.views ?? 0}
              icon={EyeIcon}
              loading={analytics.isLoading}
            />
            <StatCard
              label="Clicks"
              value={analytics.data?.totals.clicks ?? 0}
              icon={CursorArrowRaysIcon}
              hint={
                analytics.data
                  ? `CTR ${percent(analytics.data.totals.ctr)}`
                  : undefined
              }
              loading={analytics.isLoading}
            />
            <StatCard
              label="Downloads"
              value={analytics.data?.totals.downloads ?? 0}
              icon={ArrowDownTrayIcon}
              hint={
                analytics.data
                  ? `Conversion ${percent(analytics.data.totals.conversionRate)}`
                  : undefined
              }
              loading={analytics.isLoading}
            />
            <StatCard
              label="Unique users"
              value={analytics.data?.totals.uniqueUsers ?? 0}
              icon={UsersIcon}
              loading={analytics.isLoading}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(["topOffers", "topCategories"] as const).map((key) => (
              <Card key={key} className="p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <FireIcon className="h-4 w-4 text-orange-500" />
                  {key === "topOffers" ? "Top offers" : "Top categories"}
                </p>
                {analytics.isLoading ? (
                  <TableSkeleton />
                ) : !analytics.data || analytics.data[key].length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No events in this range yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Downloads</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.data[key].map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="max-w-48 truncate text-sm">
                            {row.title}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {row.views}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {row.clicks}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {row.downloads}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            ))}
          </div>

          {analytics.data && analytics.data.series.length > 0 && (
            <Card className="p-4">
              <p className="mb-3 text-sm font-semibold">Timeline</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Downloads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.data.series.map((row) => (
                    <TableRow key={row.bucket}>
                      <TableCell className="text-sm">{row.bucket}</TableCell>
                      <TableCell className="text-right text-sm">
                        {row.views}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.clicks}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.downloads}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {categoryDialog && (
        <Suspense fallback={<p role="status">Loading category editor…</p>}>
          <CategoryFormDialog
            open={categoryDialog}
            onOpenChange={setCategoryDialog}
            category={editingCategory}
          />
        </Suspense>
      )}
      {offerDialog && (
        <Suspense fallback={<p role="status">Loading offer editor…</p>}>
          <OfferFormDialog
            open={offerDialog}
            onOpenChange={setOfferDialog}
            categories={categories.data ?? []}
            offer={editingOffer}
          />
        </Suspense>
      )}
      <ConfirmDialog
        open={deleteCategory !== null}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        title={`Delete "${deleteCategory?.title}"?`}
        description="Soft delete — the category and its offers disappear from the app and website."
        confirmLabel="Delete"
        destructive
        loading={removeCategory.isPending}
        onConfirm={() =>
          deleteCategory && removeCategory.mutate(deleteCategory.id)
        }
      />
      <ConfirmDialog
        open={deleteOffer !== null}
        onOpenChange={(open) => !open && setDeleteOffer(null)}
        title={`Delete "${deleteOffer?.title}"?`}
        description="Soft delete — the offer disappears from the app and website."
        confirmLabel="Delete"
        destructive
        loading={removeOffer.isPending}
        onConfirm={() => deleteOffer && removeOffer.mutate(deleteOffer.id)}
      />
    </div>
  );
};
