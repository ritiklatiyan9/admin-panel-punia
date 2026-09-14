import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { APP } from "@/components/shared/app-preview";
import { Coins } from "@/components/shared/Coins";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";
import type { Mission } from "@/services/missions.service";
import { statusBadge } from "../hot-offers/OfferCards";

export const MissionCard = ({
  mission,
  canWrite,
  onEdit,
  onDelete,
}: {
  mission: Mission;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}): JSX.Element => (
  <Card className="flex flex-col overflow-hidden">
    {/* Missions carry no artwork; the app draws a rocket glyph, so the tile does too. */}
    <div
      className="relative flex aspect-video items-center justify-center overflow-hidden"
      style={{ background: APP.accentGradient }}
    >
      <RocketLaunchIcon className="h-10 w-10" style={{ color: APP.onAccent }} />
      <div className="absolute left-2 top-2">
        <Badge variant={statusBadge[mission.status]} className="capitalize">
          {mission.status.toLowerCase()}
        </Badge>
      </div>
    </div>

    <div className="flex flex-1 flex-col gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold">{mission.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {mission.description}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-sm">
        <span className="flex items-baseline gap-1.5">
          <Coins value={mission.rewardCoins} className="font-semibold" />
          <span className="text-xs text-muted-foreground">reward</span>
        </span>
        <span className="truncate text-xs text-muted-foreground">
          Sort order {mission.sortOrder}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
        <span className="truncate">
          Updated {formatDate(mission.updatedAt)}
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
