import {
  PencilSquareIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Artwork } from "@/components/shared/app-preview";
import { Coins } from "@/components/shared/Coins";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { ContentStatus, HotOffer } from "@/types/domain";

export const OFFER_GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

export const statusBadge: Record<
  ContentStatus,
  "secondary" | "success" | "outline"
> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ARCHIVED: "outline",
};

/** Expiry chip, only when it changes what an admin should do about the item. */
export const expiryBadge = (
  iso: string | null,
): { label: string; variant: "warning" | "destructive" } | null => {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: "Expired", variant: "destructive" };
  if (days <= 7)
    return {
      label: days === 0 ? "Ends today" : `Ends in ${days}d`,
      variant: "warning",
    };
  return null;
};

/** Six placeholder cards while a grid loads. */
export const OfferCardSkeletons = (): JSX.Element => (
  <div className={OFFER_GRID}>
    {Array.from({ length: 6 }, (_, index) => (
      <Card key={index} className="overflow-hidden">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Card>
    ))}
  </div>
);

export const OfferCard = ({
  offer,
  canWrite,
  onEdit,
  onDelete,
}: {
  offer: HotOffer;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}): JSX.Element => {
  const expiry = expiryBadge(offer.expiresAt);
  const photoLike = !!offer.thumbnailUrl;
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video overflow-hidden bg-muted/60">
        <div className={cn("h-full w-full", !photoLike && "p-5")}>
          <Artwork
            sources={[offer.thumbnailUrl, offer.logoUrl, offer.brandLogoUrl]}
            fit={photoLike ? "cover" : "contain"}
            fallback={
              <div className="flex h-full items-center justify-center">
                <PhotoIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            }
          />
        </div>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge variant={statusBadge[offer.status]} className="capitalize">
            {offer.status.toLowerCase()}
          </Badge>
          {expiry && <Badge variant={expiry.variant}>{expiry.label}</Badge>}
        </div>
        <div className="absolute right-2 top-2 flex gap-1">
          {offer.trending && <Badge variant="warning">Trending</Badge>}
          {offer.featured && (
            <Badge className="bg-card text-primary shadow-sm">Featured</Badge>
          )}
        </div>
        {offer.brandLogoUrl && (
          <img
            src={offer.brandLogoUrl}
            alt=""
            className="absolute bottom-2 left-2 h-9 w-9 rounded-full border bg-card object-contain p-0.5 shadow-sm"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{offer.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {offer.shortDescription}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 text-sm">
          <span className="flex items-baseline gap-1.5">
            <Coins value={offer.rewardAmount} className="font-semibold" />
            <span className="text-xs text-muted-foreground">credited</span>
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {offer.appName ?? offer.category.title}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="truncate">Added {formatDate(offer.createdAt)}</span>
          {canWrite && (
            <span className="flex shrink-0 items-center gap-1">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <PencilSquareIcon className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDelete}
                title="Delete"
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
