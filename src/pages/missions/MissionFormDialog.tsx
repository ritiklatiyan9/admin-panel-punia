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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  editorAsideClass,
  editorDialogClass,
  editorGridClass,
} from "@/components/shared/app-preview";
import {
  missionsService,
  type Mission,
  type MissionInput,
} from "@/services/missions.service";
import { apiErrorMessage } from "@/services/api-client";
import type { ContentStatus } from "@/types/domain";
import { MissionPreview } from "./MissionPreview";

/** Form state. Numbers stay strings so clearing a field never snaps to 0. */
interface Draft {
  title: string;
  description: string;
  rewardCoins: string;
  sortOrder: string;
  status: ContentStatus;
}

const toDraft = (m: Mission | null): Draft => ({
  title: m?.title ?? "",
  description: m?.description ?? "",
  rewardCoins: m ? String(m.rewardCoins) : "",
  sortOrder: String(m?.sortOrder ?? 0),
  status: m?.status ?? "DRAFT",
});

const toInput = (f: Draft): MissionInput => ({
  title: f.title.trim(),
  description: f.description.trim(),
  rewardCoins: Number(f.rewardCoins) || 0,
  sortOrder: Number(f.sortOrder) || 0,
  status: f.status,
});

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): JSX.Element => (
  <section className="space-y-3">
    <h3 className="text-sm font-semibold">{title}</h3>
    {children}
  </section>
);

const Field = ({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
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

const STATUS_NOTE: Record<ContentStatus, string> = {
  DRAFT: "Saved as a draft — hidden from users.",
  PUBLISHED: "Visible on the Mission Board as soon as you save.",
  ARCHIVED: "Archived — hidden from users.",
};

interface MissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create; list rows carry every field, so there is no details fetch. */
  mission: Mission | null;
}

export const MissionFormDialog = ({
  open,
  onOpenChange,
  mission,
}: MissionFormDialogProps): JSX.Element => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Draft>(() => toDraft(mission));
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]): void =>
      setForm((current) => ({ ...current, [key]: value }));

  // `mission` is the row captured on click, not live query data, so a
  // background refetch of the list can't wipe half-typed edits.
  useEffect(() => {
    if (open) setForm(toDraft(mission));
  }, [open, mission]);

  const save = useMutation({
    mutationFn: () => {
      const input = toInput(form);
      return mission
        ? missionsService.update(mission.id, input)
        : missionsService.create(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success(mission ? "Mission updated" : "Mission created");
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={editorDialogClass}
        // A stray click outside must not throw away a long form; Esc and Cancel still close.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className={editorGridClass}>
          {/* ---- form ---- */}
          <div className="flex min-h-0 flex-col">
            <DialogHeader className="border-b px-6 pb-4 pt-6">
              <DialogTitle>
                {mission ? "Edit mission" : "New mission"}
              </DialogTitle>
              <DialogDescription>
                One card on the Mission Board — the preview on the right is what
                users see. Only published missions are visible.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <form
                id="mission-form"
                className="space-y-7"
                onSubmit={(event) => {
                  event.preventDefault();
                  save.mutate();
                }}
              >
                <Section title="Basics">
                  <Field
                    label="Title"
                    htmlFor="mi-title"
                    hint="Card heading on the board, up to 2 lines."
                  >
                    <Input
                      id="mi-title"
                      required
                      maxLength={200}
                      value={form.title}
                      onChange={(e) => set("title")(e.target.value)}
                      placeholder="Follow us on Instagram"
                    />
                  </Field>
                  <Field
                    label="Description"
                    htmlFor="mi-desc"
                    hint={`${form.description.length}/5000 characters · under the title, up to 3 lines on the card`}
                  >
                    <Textarea
                      id="mi-desc"
                      required
                      rows={4}
                      maxLength={5000}
                      value={form.description}
                      onChange={(e) => set("description")(e.target.value)}
                      placeholder="What the user must do to complete the mission…"
                    />
                  </Field>
                </Section>

                <Section title="Reward & publishing">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Field
                      label="Reward coins"
                      htmlFor="mi-coins"
                      hint="The +coins chip on the card; credited when a completion is approved."
                    >
                      <Input
                        id="mi-coins"
                        type="number"
                        required
                        min={0}
                        max={1_000_000}
                        step="0.01"
                        value={form.rewardCoins}
                        onChange={(e) => set("rewardCoins")(e.target.value)}
                        placeholder="50"
                      />
                    </Field>
                    <Field
                      label="Sort order"
                      htmlFor="mi-sort"
                      hint="Lower numbers show first; ties are newest first."
                    >
                      <Input
                        id="mi-sort"
                        type="number"
                        required
                        step={1}
                        value={form.sortOrder}
                        onChange={(e) => set("sortOrder")(e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Status"
                      hint="Only published missions reach the app."
                    >
                      <Select
                        value={form.status}
                        onValueChange={(value) =>
                          set("status")(value as ContentStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </Section>
              </form>
            </div>

            <div className="flex items-center gap-3 border-t px-6 py-4">
              <p className="mr-auto text-xs text-muted-foreground">
                {STATUS_NOTE[form.status]}
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
                form="mission-form"
                disabled={save.isPending}
              >
                {save.isPending
                  ? "Saving…"
                  : mission
                    ? "Save changes"
                    : "Create mission"}
              </Button>
            </div>
          </div>

          {/* ---- live preview (desktop) ---- */}
          <aside className={editorAsideClass}>
            <MissionPreview
              draft={{
                title: form.title,
                description: form.description,
                rewardCoins: Number(form.rewardCoins) || 0,
              }}
              className="h-full"
            />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};
