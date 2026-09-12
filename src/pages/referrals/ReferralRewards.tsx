import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth.store";

export function ReferralRewards() {
  const canEdit = useAuthStore((s) => s.user?.role === "SUPER_ADMIN");
  const client = useQueryClient();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: settingsService.list,
  });
  // Keep unsaved edits through background refetches; use server values for
  // untouched fields so an admin never unknowingly overwrites another change.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const value = (key: string) =>
    draft[key] ?? settings.data?.find((s) => s.key === key)?.value ?? "";
  const edit = (key: string, v: string) =>
    setDraft((d) => ({ ...d, [key]: v }));
  const supported = settings.data?.some(
    (s) => s.key === "referral.inviteeRewardPoints",
  );
  const save = useMutation({
    mutationFn: () => settingsService.update(draft),
    onSuccess: (data) => {
      client.setQueryData(["settings"], data);
      setDraft({});
      toast.success("Referral rewards saved. New claims use these amounts.");
    },
    onError: () =>
      toast.error(
        "Could not save referral rewards. Your changes are still here; try again.",
      ),
  });
  if (settings.isPending)
    return (
      <Card className="mb-6 p-5 text-sm text-muted-foreground">
        Loading referral rewards…
      </Card>
    );
  if (settings.isError)
    return (
      <Card className="mb-6 p-5">
        <p className="mb-3 text-sm">Referral settings could not be loaded.</p>
        <Button variant="outline" onClick={() => settings.refetch()}>
          Retry
        </Button>
      </Card>
    );
  if (!supported)
    return (
      <Card className="mb-6 p-5 text-sm">
        The updated referral API must be deployed before both rewards can be
        configured.
      </Card>
    );
  const disabled = !canEdit || save.isPending;
  const valid = ["referral.rewardPoints", "referral.inviteeRewardPoints"].every(
    (key) => /^\d+$/.test(value(key)) && Number(value(key)) <= 1_000_000,
  );
  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">A reward for each side</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Credited once, when a friend applies an invitation code. Sharing
            alone does not earn coins.
          </p>
        </div>
        <Switch
          aria-label="Accept referral codes"
          checked={value("referral.enabled") === "true"}
          onCheckedChange={(checked) =>
            edit("referral.enabled", String(checked))
          }
          disabled={disabled}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className="space-y-2 text-sm font-medium"
          htmlFor="inviter-reward"
        >
          Inviter reward (coins)
          <Input
            id="inviter-reward"
            className="mt-2"
            type="number"
            min={0}
            max={1000000}
            step={1}
            value={value("referral.rewardPoints")}
            onChange={(e) => edit("referral.rewardPoints", e.target.value)}
            disabled={disabled}
          />
        </label>
        <label
          className="space-y-2 text-sm font-medium"
          htmlFor="friend-reward"
        >
          Joining friend reward (coins)
          <Input
            id="friend-reward"
            className="mt-2"
            type="number"
            min={0}
            max={1000000}
            step={1}
            value={value("referral.inviteeRewardPoints")}
            onChange={(e) =>
              edit("referral.inviteeRewardPoints", e.target.value)
            }
            disabled={disabled}
          />
        </label>
      </div>
      <p className="my-4 text-xs text-muted-foreground">
        Use whole coins from 0 to 1,000,000. Set 0 to give no reward to that
        person. Changes apply to future claims; past rewards stay unchanged.{" "}
        {value("referral.enabled") !== "true" && "New claims are paused."}
      </p>
      {!valid && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          Enter a whole coin amount between 0 and 1,000,000.
        </p>
      )}
      {canEdit ? (
        <Button
          onClick={() => save.mutate()}
          disabled={disabled || !valid || !Object.keys(draft).length}
        >
          {save.isPending ? "Saving…" : "Save referral rewards"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only a super admin can change reward settings.
        </p>
      )}
    </Card>
  );
}
