import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArchiveBoxXMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { FiltersBar } from "@/components/shared/FiltersBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { OptimizedImage } from "@/components/shared/OptimizedImage";
import { Pagination } from "@/components/shared/Pagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrorMessage } from "@/services/api-client";
import {
  mediaService,
  type MediaAsset,
  type MediaPurpose,
  type MediaStatus,
} from "@/services/media.service";
import { formatDate, formatDateTime } from "@/utils/format";

const PAGE_SIZE = 24;
const PROOF_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const bytes = (value: number): string =>
  value < 1024 * 1024
    ? `${Math.max(1, Math.round(value / 1024))} KB`
    : `${(value / 1024 / 1024).toFixed(1)} MB`;

interface DeleteRequest {
  assets: MediaAsset[];
  force: boolean;
}

export const MediaLibraryPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState<MediaPurpose | "ALL">("ALL");
  const [status, setStatus] = useState<MediaStatus | "ALL">("ACTIVE");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<DeleteRequest | null>(
    null,
  );

  const media = useQuery({
    queryKey: ["media", { page, search, purpose, status }],
    queryFn: ({ signal }) =>
      mediaService.list(
        {
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          purpose: purpose === "ALL" ? undefined : purpose,
          status: status === "ALL" ? undefined : status,
        },
        signal,
      ),
  });

  const deleteImages = useMutation({
    mutationFn: async (request: DeleteRequest) => ({
      request,
      results: await Promise.allSettled(
        request.assets.map((asset) =>
          mediaService.retire(asset.id, request.force),
        ),
      ),
    }),
    onSuccess: ({ request, results }) => {
      const completedIds: string[] = [];
      const conflicts: MediaAsset[] = [];
      const failures: unknown[] = [];
      results.forEach((result, index) => {
        const asset = request.assets[index];
        if (result.status === "fulfilled") completedIds.push(asset.id);
        else if (
          !request.force &&
          result.reason instanceof AxiosError &&
          result.reason.response?.status === 409
        )
          conflicts.push(asset);
        else failures.push(result.reason);
      });
      setSelectedIds((previous) => {
        const next = new Set(previous);
        completedIds.forEach((id) => next.delete(id));
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      if (completedIds.length)
        toast.success(
          `${completedIds.length} image${completedIds.length === 1 ? "" : "s"} deleted from storage`,
        );
      if (failures.length)
        toast.error(
          failures.length === 1
            ? apiErrorMessage(failures[0])
            : `${failures.length} images could not be deleted`,
        );
      if (conflicts.length) {
        setPendingDelete({ assets: conflicts, force: true });
        toast.warning(
          `${conflicts.length} image${conflicts.length === 1 ? " is" : "s are"} still in use`,
        );
      } else setPendingDelete(null);
    },
  });

  const activeOnPage =
    media.data?.items.filter((asset) => asset.status === "ACTIVE") ?? [];
  const selectedOnPage = activeOnPage.filter((asset) =>
    selectedIds.has(asset.id),
  );
  const allSelected =
    activeOnPage.length > 0 && selectedOnPage.length === activeOnPage.length;
  const resetSelection = (): void => setSelectedIds(new Set());
  const toggleAsset = (id: string): void =>
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Proof images are deleted from storage 90 days after upload. You can delete any active image sooner."
      />
      <FiltersBar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
            resetSelection();
          },
          placeholder: "Search file names…",
        }}
        selects={[
          {
            key: "purpose",
            value: purpose,
            onChange: (value) => {
              setPurpose(value as MediaPurpose | "ALL");
              setPage(1);
              resetSelection();
            },
            options: [
              { value: "ALL", label: "All image types" },
              { value: "PROOF", label: "Proofs" },
              { value: "CONTENT", label: "App content" },
              { value: "AVATAR", label: "Avatars" },
              { value: "NOTIFICATION", label: "Notifications" },
            ],
          },
          {
            key: "status",
            value: status,
            onChange: (value) => {
              setStatus(value as MediaStatus | "ALL");
              setPage(1);
              resetSelection();
            },
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "RETIRED", label: "Deleted" },
              { value: "ALL", label: "All statuses" },
            ],
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setPurpose("ALL");
          setStatus("ACTIVE");
          setPage(1);
          resetSelection();
        }}
      />
      <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {selectedOnPage.length
            ? `${selectedOnPage.length} selected on this page`
            : "Select rows to delete multiple images"}
        </span>
        {selectedOnPage.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetSelection}>
              Clear selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteImages.isPending}
              onClick={() =>
                setPendingDelete({ assets: selectedOnPage, force: false })
              }
            >
              <TrashIcon className="mr-1.5 h-4 w-4" /> Delete selected (
              {selectedOnPage.length})
            </Button>
          </div>
        )}
      </div>
      <Card className="overflow-hidden">
        {media.isLoading ? (
          <TableSkeleton rows={8} />
        ) : !media.data?.items.length ? (
          <EmptyState
            title="No managed images"
            description="New proof and admin image uploads will appear here automatically."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    aria-label="Select all active images on this page"
                    checked={allSelected}
                    ref={(element) => {
                      if (element)
                        element.indeterminate =
                          selectedOnPage.length > 0 && !allSelected;
                    }}
                    disabled={!activeOnPage.length || deleteImages.isPending}
                    onChange={(event) =>
                      setSelectedIds(
                        event.target.checked
                          ? new Set(activeOnPage.map((asset) => asset.id))
                          : new Set(),
                      )
                    }
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Deletes on</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.data.items.map((asset) => (
                <TableRow
                  key={asset.id}
                  className={
                    selectedIds.has(asset.id) ? "bg-muted/50" : undefined
                  }
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      aria-label={`Select ${asset.originalFileName ?? asset.id}`}
                      checked={selectedIds.has(asset.id)}
                      disabled={
                        asset.status !== "ACTIVE" || deleteImages.isPending
                      }
                      onChange={() => toggleAsset(asset.id)}
                    />
                  </TableCell>
                  <TableCell className="min-w-56">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {asset.status === "ACTIVE" ? (
                          <OptimizedImage
                            src={asset.url}
                            size={160}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ArchiveBoxXMarkIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="max-w-52 truncate font-medium"
                          title={asset.originalFileName ?? undefined}
                        >
                          {asset.originalFileName ?? "Unnamed image"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.provider.toUpperCase()}
                          {asset.width && asset.height
                            ? ` · ${asset.width}×${asset.height}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{asset.purpose}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        asset.status === "ACTIVE" ? "success" : "outline"
                      }
                    >
                      {asset.status === "ACTIVE" ? "Active" : "Deleted"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {bytes(asset.byteSize)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(asset.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {asset.purpose === "PROOF" && asset.status === "ACTIVE"
                      ? formatDate(
                          new Date(
                            new Date(asset.createdAt).getTime() +
                              PROOF_RETENTION_MS,
                          ).toISOString(),
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {asset.status === "ACTIVE" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteImages.isPending}
                        onClick={() =>
                          setPendingDelete({ assets: [asset], force: false })
                        }
                      >
                        <TrashIcon className="mr-1.5 h-4 w-4" /> Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {media.data && (
        <Pagination
          meta={media.data.meta}
          disabled={deleteImages.isPending}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            resetSelection();
          }}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteImages.isPending) setPendingDelete(null);
        }}
        title={
          pendingDelete?.force
            ? "Delete images still in use?"
            : `Delete ${pendingDelete?.assets.length ?? 0} image${pendingDelete?.assets.length === 1 ? "" : "s"}?`
        }
        description={
          pendingDelete?.force
            ? "These images are referenced elsewhere. Deleting them from storage will break those previews."
            : "The stored files will be deleted and their links will stop working. Images still in use will need a second confirmation."
        }
        confirmLabel={pendingDelete?.force ? "Delete anyway" : "Delete images"}
        destructive
        loading={deleteImages.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteImages.mutate(pendingDelete);
        }}
      />
    </div>
  );
};
