import {
  EllipsisHorizontalIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/react/24/outline";
import { APP } from "@/components/shared/app-preview";
import { Coins } from "@/components/shared/Coins";
import { CampaignStatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/utils/format";
import type { Campaign, CampaignStatus } from "@/types/domain";

const DAY = 86_400_000;

/** Schedule chip, only when it changes what an admin should do about the campaign. */
export const scheduleBadge = (
  startsAt: string | null,
  endsAt: string | null,
): { label: string; variant: "info" | "warning" | "destructive" } | null => {
  const now = Date.now();
  const today = new Date().toDateString();
  const label = (verb: string, iso: string): string => {
    const date = new Date(iso);
    return date.toDateString() === today
      ? `${verb} today`
      : `${verb} in ${Math.ceil((date.getTime() - now) / DAY)}d`;
  };
  if (startsAt && new Date(startsAt).getTime() > now)
    return { label: label("Starts", startsAt), variant: "info" };
  if (!endsAt) return null;
  const remaining = new Date(endsAt).getTime() - now;
  if (remaining < 0) return { label: "Ended", variant: "destructive" };
  if (remaining > 7 * DAY) return null;
  return { label: label("Ends", endsAt), variant: "warning" };
};

export const CampaignCard = ({
  campaign,
  canWrite,
  onEdit,
  onStatus,
}: {
  campaign: Campaign;
  canWrite: boolean;
  onEdit: () => void;
  onStatus: (next: CampaignStatus) => void;
}): JSX.Element => {
  const schedule = scheduleBadge(campaign.startsAt, campaign.endsAt);
  const initial = campaign.title.trim().charAt(0).toUpperCase() || "C";
  return (
    <Card className="flex flex-col overflow-hidden">
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden"
        style={{ background: APP.accentGradient }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl font-extrabold"
          style={{
            color: APP.onAccent,
            border: "1px solid rgba(255,255,255,0.35)",
          }}
        >
          {initial}
        </span>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <CampaignStatusBadge status={campaign.status} />
          {schedule && (
            <Badge variant={schedule.variant}>{schedule.label}</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{campaign.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {campaign.description}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 text-sm">
          <span className="flex items-baseline gap-1.5">
            <Coins value={campaign.rewardAmount} className="font-semibold" />
            <span className="text-xs text-muted-foreground">per claim</span>
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {campaign.budget !== null ? (
              <>
                Budget <Coins value={campaign.budget} />
              </>
            ) : (
              "No budget cap"
            )}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="truncate">
            Created {formatDate(campaign.createdAt)}
          </span>
          {canWrite && (
            <span className="flex shrink-0 items-center gap-1">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <PencilSquareIcon className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
              {campaign.status !== "ENDED" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Change status"
                    >
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {campaign.status !== "ACTIVE" && (
                      <DropdownMenuItem onSelect={() => onStatus("ACTIVE")}>
                        <PlayIcon /> Activate
                      </DropdownMenuItem>
                    )}
                    {campaign.status === "ACTIVE" && (
                      <DropdownMenuItem onSelect={() => onStatus("PAUSED")}>
                        <PauseIcon /> Pause
                      </DropdownMenuItem>
                    )}
                    {campaign.status !== "DRAFT" && (
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onSelect={() => onStatus("ENDED")}
                      >
                        <StopIcon /> End campaign
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
