import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { FiltersBar } from "@/components/shared/FiltersBar";
import {
  ExportButton,
  type ExportColumn,
} from "@/components/shared/ExportButton";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Coins } from "@/components/shared/Coins";
import { Card } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { hotOffersService } from "@/services/hot-offers.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";
import { formatDateTime } from "@/utils/format";
import { mediaUrl } from "@/utils/media-url";
import { OptimizedImage } from "@/components/shared/OptimizedImage";
import type { OfferSubmission, SubmissionStatus } from "@/types/domain";
import type { Paginated } from "@/types/api";

const PAGE_SIZE = 10;

const ProofImage = ({ src }: { src: string }): JSX.Element => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative flex h-[60vh] items-center justify-center rounded-lg bg-muted">
      {!loaded && !failed && (
        <p role="status" className="absolute text-sm text-muted-foreground">
          Loading full-size proof…
        </p>
      )}
      {failed ? (
        <p
          role="alert"
          className="p-4 text-center text-sm text-muted-foreground"
        >
          This image couldn't load. Try the full-size link below or reopen the
          preview.
        </p>
      ) : (
        <img
          src={src}
          alt="Proof"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="h-full w-full rounded-lg object-contain"
        />
      )}
    </div>
  );
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NEED_MORE_PROOF", label: "Need more proof" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All" },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "offerTitle", label: "Offer" },
  {
    key: "user",
    label: "User",
    format: (v) => (v as { name?: string } | undefined)?.name ?? "",
  },
  {
    key: "user",
    label: "Email",
    format: (v) => (v as { email?: string } | undefined)?.email ?? "",
  },
  { key: "status", label: "Status" },
  { key: "rewardAmount", label: "Coins" },
  { key: "note", label: "User note" },
  { key: "reviewNote", label: "Review note" },
  {
    key: "createdAt",
    label: "Submitted",
    format: (v) => formatDateTime(v as string | null),
  },
  {
    key: "reviewedAt",
    label: "Reviewed",
    format: (v) => formatDateTime(v as string | null),
  },
];

interface SubmissionsReviewProps {
  /** Filter by the offer's isProduct flag; omitted = all submissions (back-compat). */
  product?: boolean;
}

export const SubmissionsReview = ({
  product,
}: SubmissionsReviewProps = {}): JSX.Element => {
  const queryClient = useQueryClient();
  const canReview = useAuthStore((state) => state.user?.role === "SUPER_ADMIN");

  type NoteAction = "REJECT" | "NEED_MORE_PROOF";

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SubmissionStatus | "ALL">("PENDING");
  const [preview, setPreview] = useState<{
    id: string;
    urls: string[];
    count: number;
    index: number;
  } | null>(null);
  const [noteFor, setNoteFor] = useState<{
    submission: OfferSubmission;
    action: NoteAction;
  } | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading, isFetching, isPlaceholderData, isError, refetch } =
    useQuery({
      queryKey: ["hot-offers", "submissions", { page, status, product }],
      queryFn: ({ signal }) =>
        hotOffersService.listSubmissions(
          {
            page,
            limit: PAGE_SIZE,
            status: status === "ALL" ? undefined : status,
            product,
            preview: true,
          },
          signal,
        ),
    });

  const details = useQuery({
    queryKey: ["hot-offers", "submissions", "detail", preview?.id],
    queryFn: ({ signal }) =>
      hotOffersService.getSubmission(preview!.id, signal),
    enabled: !!preview && preview.count > preview.urls.length,
    // Never show a previous user's screenshots while another proof loads.
    placeholderData: undefined,
  });
  const previewUrls = details.data?.screenshotUrls.length
    ? details.data.screenshotUrls
    : (preview?.urls ?? []);

  useEffect(() => {
    if (
      data &&
      !isPlaceholderData &&
      !isFetching &&
      page > Math.max(1, data.meta.totalPages)
    ) {
      setPage(Math.max(1, data.meta.totalPages));
    }
  }, [data, isPlaceholderData, isFetching, page]);

  // Update the visible queue from the committed server response immediately;
  // background invalidation then replenishes the page and refreshes counts.
  const updateSubmission = (updated: OfferSubmission): void => {
    queryClient.setQueryData<Paginated<OfferSubmission>>(
      ["hot-offers", "submissions", { page, status, product }],
      (current) => {
        if (!current) return current;
        const removed =
          status !== "ALL" &&
          updated.status !== status &&
          current.items.some((item) => item.id === updated.id);
        const total = Math.max(0, current.meta.total - (removed ? 1 : 0));
        return {
          items: current.items.flatMap((item) =>
            item.id !== updated.id
              ? [item]
              : removed
                ? []
                : [{ ...item, ...updated, user: updated.user ?? item.user }],
          ),
          meta: {
            ...current.meta,
            total,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
          },
        };
      },
    );
    void queryClient.invalidateQueries({
      queryKey: ["hot-offers", "submissions"],
    });
  };

  const review = useMutation({
    mutationFn: (input: {
      id: string;
      action: "APPROVE" | "REJECT" | "NEED_MORE_PROOF";
      reviewNote?: string;
    }) =>
      hotOffersService.reviewSubmission(input.id, {
        action: input.action,
        reviewNote: input.reviewNote,
      }),
    onSuccess: (updated, input) => {
      updateSubmission(updated);
      toast.success(
        input.action === "APPROVE"
          ? "Approved — reward credited to the user"
          : input.action === "NEED_MORE_PROOF"
            ? "Asked the user for more proof"
            : "Submission rejected",
      );
      setNoteFor(null);
      setNote("");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const reopen = useMutation({
    mutationFn: (id: string) => hotOffersService.reopenSubmission(id),
    onSuccess: (updated) => {
      updateSubmission(updated);
      toast.success("Re-opened — the user can participate in this offer again");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <>
      <FiltersBar
        selects={[
          {
            key: "status",
            value: status,
            onChange: (value) => {
              setStatus(value as SubmissionStatus | "ALL");
              setPage(1);
            },
            options: STATUS_OPTIONS,
            placeholder: "Status",
            className: "sm:w-44",
          },
        ]}
      >
        <div className="ml-auto flex items-center gap-2">
          <span role="status" className="text-xs text-muted-foreground">
            {isFetching && !isLoading ? "Updating…" : ""}
          </span>
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <ArrowPathIcon className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <ExportButton
            rows={
              (isPlaceholderData
                ? []
                : (data?.items ?? [])) as unknown as Record<string, unknown>[]
            }
            columns={EXPORT_COLUMNS}
            fileName="offer-submissions"
            title="Offer submissions"
            page={page}
            filterSummary={status !== "ALL" ? `Status: ${status}` : undefined}
          />
        </div>
      </FiltersBar>

      {isError && data && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          Could not refresh proofs. Showing the last loaded page; use Refresh to
          try again.
        </p>
      )}
      <Card aria-busy={isFetching}>
        {isLoading ? (
          <TableSkeleton />
        ) : isError && !data ? (
          <EmptyState
            title="Couldn't load proofs"
            description="Check your connection and try again."
            action={<Button onClick={() => void refetch()}>Try again</Button>}
          />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No submissions"
            description="Proof screenshots submitted from the app appear here for review."
          />
        ) : (
          <>
            <ul className="divide-y">
              {data.items.map((submission) => {
                // ponytail: fallback keeps old single-image payloads working
                const shots = submission.screenshotUrls?.length
                  ? submission.screenshotUrls
                  : [submission.screenshotUrl];
                const count = submission.screenshotCount ?? shots.length;
                const openPreview = (index: number): void =>
                  setPreview({ id: submission.id, urls: shots, index, count });
                return (
                  <li
                    key={submission.id}
                    className="flex flex-wrap items-center gap-4 p-4"
                  >
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {shots.slice(0, 3).map((url, index) => (
                        <button
                          key={`${url}-${index}`}
                          type="button"
                          onClick={() => openPreview(index)}
                          className="h-20 w-20 overflow-hidden rounded-lg border bg-muted"
                          title={`View screenshot ${index + 1} of ${count}`}
                        >
                          <OptimizedImage
                            src={url}
                            size={160}
                            width={80}
                            height={80}
                            alt={`Proof ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                      {count > 3 && (
                        <button
                          type="button"
                          onClick={() => openPreview(0)}
                          className="h-20 w-20 rounded-lg border bg-muted text-sm font-medium"
                          title={`View all ${count} screenshots`}
                        >
                          +{count - 3} more
                        </button>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{submission.offerTitle}</p>
                        <SubmissionStatusBadge status={submission.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {submission.user
                          ? `${submission.user.name} · ${submission.user.email}`
                          : "Unknown user"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Reward <Coins value={submission.rewardAmount} /> ·
                        submitted {formatDateTime(submission.createdAt)}
                      </p>
                      {submission.note && (
                        <p className="mt-1 text-sm">“{submission.note}”</p>
                      )}
                      {submission.reviewNote && (
                        <p className="mt-1 text-sm text-red-500">
                          Review: {submission.reviewNote}
                        </p>
                      )}
                    </div>

                    {canReview && submission.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            review.mutate({
                              id: submission.id,
                              action: "APPROVE",
                            })
                          }
                          disabled={review.isPending || isPlaceholderData}
                        >
                          <CheckIcon className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setNoteFor({
                              submission,
                              action: "NEED_MORE_PROOF",
                            })
                          }
                          disabled={review.isPending || isPlaceholderData}
                        >
                          <QuestionMarkCircleIcon className="mr-1 h-4 w-4" />{" "}
                          Need proof
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setNoteFor({ submission, action: "REJECT" })
                          }
                          disabled={review.isPending || isPlaceholderData}
                        >
                          <XMarkIcon className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}

                    {canReview &&
                      ["APPROVED", "REJECTED", "NEED_MORE_PROOF"].includes(
                        submission.status,
                      ) && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reopen.mutate(submission.id)}
                            disabled={reopen.isPending || isPlaceholderData}
                          >
                            <ArrowPathIcon className="mr-1 h-4 w-4" /> Allow
                            again
                          </Button>
                        </div>
                      )}
                  </li>
                );
              })}
            </ul>
            <Pagination
              meta={data.meta}
              onPageChange={setPage}
              disabled={isPlaceholderData}
            />
          </>
        )}
      </Card>

      {/* Screenshot lightbox with pager */}
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Proof screenshot
              {preview && previewUrls.length > 1
                ? ` ${preview.index + 1} of ${previewUrls.length}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <>
              <ProofImage
                key={previewUrls[preview.index] ?? previewUrls[0]}
                src={mediaUrl(previewUrls[preview.index] ?? previewUrls[0])}
              />
              {details.isFetching && (
                <p role="status" className="text-sm text-muted-foreground">
                  Loading remaining screenshots…
                </p>
              )}
              {details.isError && (
                <Button
                  variant="outline"
                  onClick={() => void details.refetch()}
                >
                  Retry loading all screenshots
                </Button>
              )}
              <a
                href={mediaUrl(previewUrls[preview.index] ?? previewUrls[0])}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline underline-offset-4"
              >
                Open full-size image
              </a>
              {previewUrls.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPreview({
                        ...preview,
                        index:
                          (preview.index - 1 + previewUrls.length) %
                          previewUrls.length,
                      })
                    }
                  >
                    <ChevronLeftIcon className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPreview({
                        ...preview,
                        index: (preview.index + 1) % previewUrls.length,
                      })
                    }
                  >
                    Next <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject / need-more-proof with an optional note shown to the user */}
      <Dialog
        open={noteFor !== null}
        onOpenChange={(open) => !open && setNoteFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteFor?.action === "NEED_MORE_PROOF"
                ? "Ask for more proof"
                : "Reject submission"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="review-note">
              {noteFor?.action === "NEED_MORE_PROOF"
                ? "What should the user add? (shown to them)"
                : "Reason (optional — shown to the user)"}
            </Label>
            <Textarea
              id="review-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                noteFor?.action === "NEED_MORE_PROOF"
                  ? "e.g. Include the level screen showing your progress"
                  : "e.g. Screenshot is blurry / wrong app"
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteFor(null)}>
              Cancel
            </Button>
            <Button
              variant={
                noteFor?.action === "NEED_MORE_PROOF"
                  ? "default"
                  : "destructive"
              }
              disabled={review.isPending}
              onClick={() =>
                noteFor &&
                review.mutate({
                  id: noteFor.submission.id,
                  action: noteFor.action,
                  reviewNote: note.trim() || undefined,
                })
              }
            >
              {noteFor?.action === "NEED_MORE_PROOF"
                ? "Request more proof"
                : "Reject submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
