import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArchiveBoxXMarkIcon, CloudIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { FiltersBar } from "@/components/shared/FiltersBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiErrorMessage } from "@/services/api-client";
import {
  mediaService,
  type MediaAsset,
  type MediaPurpose,
  type MediaStatus,
} from "@/services/media.service";
import { formatDateTime } from "@/utils/format";

const PAGE_SIZE = 24;
const bytes = (value: number): string =>
  value < 1024 * 1024
    ? `${Math.max(1, Math.round(value / 1024))} KB`
    : `${(value / 1024 / 1024).toFixed(1)} MB`;

export const MediaLibraryPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState<MediaPurpose | "ALL">("ALL");
  const [status, setStatus] = useState<MediaStatus | "ALL">("ACTIVE");
  const [retire, setRetire] = useState<{
    asset: MediaAsset;
    force: boolean;
  } | null>(null);

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

  const remove = useMutation({
    mutationFn: ({ asset, force }: { asset: MediaAsset; force: boolean }) =>
      mediaService.retire(asset.id, force),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      setRetire(null);
      toast.success("Image retired and removed from storage");
    },
    onError: (error) => {
      if (
        error instanceof AxiosError &&
        error.response?.status === 409 &&
        retire
      ) {
        setRetire({ ...retire, force: true });
        toast.warning(
          "This image is still in use. Review the permanent-retirement warning.",
        );
        return;
      }
      toast.error(apiErrorMessage(error));
    },
  });

  const saved = (asset: MediaAsset): number =>
    Math.max(0, asset.originalByteSize - asset.byteSize);

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Private managed images for proofs and app content. Uploads are optimized before storage; retirement removes the stored object."
      />

      <FiltersBar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
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
            },
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "RETIRED", label: "Retired" },
              { value: "ALL", label: "All statuses" },
            ],
          },
        ]}
        onClearAll={() => {
          setSearch("");
          setPurpose("ALL");
          setStatus("ACTIVE");
          setPage(1);
        }}
      />

      {media.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-xl border bg-muted"
            />
          ))}
        </div>
      ) : !media.data?.items.length ? (
        <Card>
          <EmptyState
            title="No managed images"
            description="New proof and admin image uploads will appear here automatically."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {media.data.items.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  {asset.status === "ACTIVE" ? (
                    <img
                      src={asset.url}
                      alt={asset.originalFileName ?? `${asset.purpose} image`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ArchiveBoxXMarkIcon className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    <Badge
                      variant={
                        asset.status === "ACTIVE" ? "success" : "outline"
                      }
                    >
                      {asset.status}
                    </Badge>
                    <Badge variant="secondary">{asset.purpose}</Badge>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p
                      className="truncate text-sm font-semibold"
                      title={asset.originalFileName ?? undefined}
                    >
                      {asset.originalFileName ?? "Unnamed image"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {asset.width && asset.height
                        ? `${asset.width}×${asset.height} · `
                        : ""}
                      {bytes(asset.byteSize)} · saved {bytes(saved(asset))}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CloudIcon className="h-3.5 w-3.5" />{" "}
                      {asset.provider.toUpperCase()}
                    </span>
                    <span>{formatDateTime(asset.createdAt)}</span>
                  </div>
                  {asset.status === "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => setRetire({ asset, force: false })}
                    >
                      <ArchiveBoxXMarkIcon className="mr-1.5 h-4 w-4" /> Retire
                      image
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Pagination meta={media.data.meta} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={retire !== null}
        onOpenChange={(open) => !open && setRetire(null)}
        title={
          retire?.force
            ? "Permanently retire an image that is in use?"
            : "Retire this image?"
        }
        description={
          retire?.force
            ? "The file is referenced elsewhere. Permanent retirement deletes it from storage and those previews will stop working. Continue only after reviewing the affected content."
            : "The stored file will be deleted and its stable URL will stop resolving. Images still in use require a second explicit confirmation."
        }
        confirmLabel={retire?.force ? "Delete anyway" : "Retire image"}
        destructive
        loading={remove.isPending}
        onConfirm={() => retire && remove.mutate(retire)}
      />
    </div>
  );
};
