import {
  PencilSquareIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Artwork } from "@/components/shared/app-preview";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";
import type { OfferCategory } from "@/types/domain";
import { statusBadge } from "./OfferCards";

/** Same anatomy as OfferCard; reuse OFFER_GRID / OfferCardSkeletons around it. */
export const CategoryCard = ({
  category,
  canWrite,
  onEdit,
  onDelete,
}: {
  category: OfferCategory;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}): JSX.Element => {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video overflow-hidden bg-muted/60">
        <Artwork
          sources={[category.imageUrl]}
          fit="cover"
          fallback={
            <div className="flex h-full items-center justify-center">
              <TagIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          }
        />
        <div className="absolute left-2 top-2">
          <Badge variant={statusBadge[category.status]} className="capitalize">
            {category.status.toLowerCase()}
          </Badge>
        </div>
        {category.featured && (
          <Badge className="absolute right-2 top-2 bg-card text-primary shadow-sm">
            Featured
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{category.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {category.subtitle ?? "No subtitle"}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-1.5 text-xs">
          <Badge variant="secondary">
            {category.offerCount}{" "}
            {category.offerCount === 1 ? "offer" : "offers"}
          </Badge>
          <span className="ml-auto truncate font-mono text-muted-foreground">
            {category.slug}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="truncate">
            Added {formatDate(category.createdAt)}
          </span>
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
