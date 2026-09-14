import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  editorAsideClass,
  editorDialogClass,
  editorGridClass,
} from "@/components/shared/app-preview";
import { campaignsService } from "@/services/campaigns.service";
import { apiErrorMessage } from "@/services/api-client";
import type { Campaign, CampaignInput, CampaignStatus } from "@/types/domain";
import { CampaignPreview, type CampaignPreviewDraft } from "./CampaignPreview";

/** Form state. Numbers stay strings so clearing a field never snaps to 0. */
interface Draft {
  title: string;
  description: string;
  rewardAmount: string;
  budget: string;
  startsAt: string;
  endsAt: string;
}

/** datetime-local value (local tz, minute precision) from an ISO string. */
const toLocalInput = (iso: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const toDraft = (c: Campaign | null): Draft => ({
  title: c?.title ?? "",
  description: c?.description ?? "",
  rewardAmount: c ? String(c.rewardAmount) : "",
  budget: c?.budget == null ? "" : String(c.budget),
  startsAt: toLocalInput(c?.startsAt ?? null),
  endsAt: toLocalInput(c?.endsAt ?? null),
});

// Blank optional fields are omitted (the API has no "clear" for budget/dates).
const toInput = (f: Draft): CampaignInput => ({
  title: f.title.trim(),
  description: f.description.trim(),
  rewardAmount: Number(f.rewardAmount),
  budget: f.budget.trim() === "" ? undefined : Number(f.budget),
  startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : undefined,
  endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined,
});

const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}): JSX.Element => (
  <section className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </section>
);

const Field = ({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}): JSX.Element => (
  <div className="space-y-1.5">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

// Status isn't editable here; it changes from the campaign card.
const STATUS_NOTE: Record<CampaignStatus, string> = {
  DRAFT: "Draft — hidden from users until you activate it from its card.",
  ACTIVE: "Live — users see your changes as soon as you save.",
  PAUSED: "Paused — hidden from users until reactivated.",
  ENDED: "Ended — hidden from users.",
};

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create. List rows carry every field, so nothing is fetched. */
  campaign: Campaign | null;
}

export const CampaignFormDialog = ({
  open,
  onOpenChange,
  campaign,
}: CampaignFormDialogProps): JSX.Element => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Draft>(() => toDraft(campaign));
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]): void =>
      setForm((current) => ({ ...current, [key]: value }));

  // `campaign` is the page's selected row, not live query data, so a
  // background refetch can't re-run this and wipe half-typed edits.
  useEffect(() => {
    if (open) setForm(toDraft(campaign));
  }, [open, campaign]);

  const save = useMutation({
    mutationFn: () => {
      const input = toInput(form);
      return campaign
        ? campaignsService.update(campaign.id, input)
        : campaignsService.create(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(campaign ? "Campaign updated" : "Campaign created");
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const preview: CampaignPreviewDraft = {
    title: form.title,
    description: form.description,
    rewardAmount: Number(form.rewardAmount) || 0,
    budget: form.budget.trim() === "" ? null : Number(form.budget),
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    status: campaign?.status ?? "DRAFT",
    createdAt: campaign?.createdAt ?? null,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={editorDialogClass}
        // A stray click outside must not throw away the form; Esc and Cancel still close.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className={editorGridClass}>
          {/* ---- form ---- */}
          <div className="flex min-h-0 flex-col">
            <DialogHeader className="border-b px-6 pb-4 pt-6">
              <DialogTitle>
                {campaign ? "Edit campaign" : "New campaign"}
              </DialogTitle>
              <DialogDescription>
                Shown on the app&apos;s Mission Board and its own mission page —
                the preview on the right is what users see.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <form
                id="campaign-form"
                className="space-y-7"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (
                    form.startsAt &&
                    form.endsAt &&
                    new Date(form.endsAt) <= new Date(form.startsAt)
                  ) {
                    toast.error("End date must be after start date");
                    return;
                  }
                  save.mutate();
                }}
              >
                <Section title="Basics">
                  <Field
                    label="Title"
                    htmlFor="cp-title"
                    hint="Card title on the Mission Board and the hero title on the mission page."
                  >
                    <Input
                      id="cp-title"
                      required
                      minLength={3}
                      maxLength={200}
                      value={form.title}
                      onChange={(e) => set("title")(e.target.value)}
                      placeholder="Summer referral bonus"
                    />
                  </Field>
                  <Field
                    label="Description"
                    htmlFor="cp-desc"
                    hint={`${form.description.length}/5000 characters · two lines on the card, full text under “Mission briefing”.`}
                  >
                    <Textarea
                      id="cp-desc"
                      required
                      rows={4}
                      maxLength={5000}
                      value={form.description}
                      onChange={(e) => set("description")(e.target.value)}
                      placeholder="What users must do to earn the reward…"
                    />
                  </Field>
                </Section>

                <Section title="Reward">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Reward coins"
                      htmlFor="cp-reward"
                      hint="Per approved claim — the bounty chip on the card and the mission page."
                    >
                      <Input
                        id="cp-reward"
                        type="number"
                        required
                        min={0.01}
                        max={1_000_000}
                        step="0.01"
                        value={form.rewardAmount}
                        onChange={(e) => set("rewardAmount")(e.target.value)}
                        placeholder="10"
                      />
                    </Field>
                    <Field
                      label="Budget coins"
                      htmlFor="cp-budget"
                      hint="Optional, informational. Users only see it as a “Featured” ribbon on the card."
                    >
                      <Input
                        id="cp-budget"
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={form.budget}
                        onChange={(e) => set("budget")(e.target.value)}
                        placeholder="∞"
                      />
                    </Field>
                  </div>
                </Section>

                <Section
                  title="Schedule"
                  hint="Both optional. Outside the window the claim button is locked even while active."
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Starts"
                      htmlFor="cp-starts"
                      hint="“Mission opens” on the timeline."
                    >
                      <Input
                        id="cp-starts"
                        type="datetime-local"
                        value={form.startsAt}
                        onChange={(e) => set("startsAt")(e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Ends"
                      htmlFor="cp-ends"
                      hint="“Ends …” on the card and hero; “Mission closes” on the timeline."
                    >
                      <Input
                        id="cp-ends"
                        type="datetime-local"
                        min={form.startsAt || undefined}
                        value={form.endsAt}
                        onChange={(e) => set("endsAt")(e.target.value)}
                      />
                    </Field>
                  </div>
                </Section>
              </form>
            </div>

            <div className="flex items-center gap-3 border-t px-6 py-4">
              <p className="mr-auto text-xs text-muted-foreground">
                {STATUS_NOTE[campaign?.status ?? "DRAFT"]}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="campaign-form"
                disabled={save.isPending}
              >
                {save.isPending
                  ? "Saving…"
                  : campaign
                    ? "Save changes"
                    : "Create campaign"}
              </Button>
            </div>
          </div>

          {/* ---- live preview (desktop) ---- */}
          <aside className={editorAsideClass}>
            <CampaignPreview draft={preview} className="h-full" />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};
