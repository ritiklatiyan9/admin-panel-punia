import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  editorAsideClass,
  editorDialogClass,
  editorGridClass,
} from "@/components/shared/app-preview";
import { hotOffersService } from "@/services/hot-offers.service";
import { apiErrorMessage } from "@/services/api-client";
import type {
  ContentStatus,
  FeedbackPage,
  FeedbackPageInput,
  OfferCategory,
} from "@/types/domain";
import { Field, STATUS_NOTE, Section, StatusSelect } from "./EditorFields";
import { FeedbackPagePreview } from "./FeedbackPagePreview";
import { ImageUrlField } from "./ImageUrlField";

/** Form state. Numbers stay strings so clearing a field never snaps to 0. */
interface Draft {
  bannerUrl: string;
  title: string;
  description: string;
  benefits: string;
  rewardPoints: string;
  buttonText: string;
  buttonVisible: boolean;
  websiteUrl: string;
  status: ContentStatus;
}

const linesToList = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const toDraft = (
  page: FeedbackPage | null | undefined,
  categoryTitle: string,
): Draft => ({
  bannerUrl: page?.bannerUrl ?? "",
  title: page?.title ?? categoryTitle,
  description: page?.description ?? "",
  benefits: (page?.benefits ?? []).join("\n"),
  rewardPoints: String(page?.rewardPoints ?? 0),
  buttonText: page?.buttonText ?? "Download",
  buttonVisible: page?.buttonVisible ?? true,
  websiteUrl: page?.websiteUrl ?? "",
  status: page?.status ?? "DRAFT",
});

const toInput = (f: Draft): FeedbackPageInput => ({
  bannerUrl: f.bannerUrl.trim() || null,
  title: f.title.trim(),
  description: f.description.trim(),
  benefits: linesToList(f.benefits),
  rewardPoints: Number(f.rewardPoints) || 0,
  buttonText: f.buttonText.trim() || "Download",
  buttonVisible: f.buttonVisible,
  websiteUrl: f.websiteUrl.trim(),
  status: f.status,
});

interface FeedbackPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: OfferCategory | null;
}

/** Edits the in-app page a category opens (banner, benefits, CTA to the website). */
export const FeedbackPageDialog = ({
  open,
  onOpenChange,
  category,
}: FeedbackPageDialogProps): JSX.Element => {
  const queryClient = useQueryClient();

  // null = no page yet (create).
  const existing = useQuery({
    queryKey: ["hot-offers", "feedback-page", category?.slug],
    queryFn: () => hotOffersService.getFeedbackPage(category!.slug),
    enabled: open && category !== null,
  });

  const [form, setForm] = useState<Draft>(() =>
    toDraft(undefined, category?.title ?? ""),
  );
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]): void =>
      setForm((current) => ({ ...current, [key]: value }));

  // Hydrate once the page (or its absence) is known. Keyed on `loaded`, not
  // the data object, so a background refetch can't wipe half-typed edits.
  const loaded = existing.isSuccess;
  useEffect(() => {
    if (!open || !category || !loaded) return;
    const page = queryClient.getQueryData<FeedbackPage | null>([
      "hot-offers",
      "feedback-page",
      category.slug,
    ]);
    setForm(toDraft(page, category.title));
  }, [open, loaded, category, queryClient]);

  const save = useMutation({
    mutationFn: () =>
      hotOffersService.upsertFeedbackPage(category!.id, toInput(form)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hot-offers"] });
      toast.success("Feedback page saved");
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={editorDialogClass}
        // A stray click outside must not throw away edits; Esc and Cancel still close.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className={editorGridClass}>
          {/* ---- form ---- */}
          <div className="flex min-h-0 flex-col">
            <DialogHeader className="border-b px-6 pb-4 pt-6">
              <DialogTitle>Feedback page — {category?.title}</DialogTitle>
              <DialogDescription>
                The in-app page for this category (/hot-offers/
                {category?.slug}). Its button opens the website inside the
                app&apos;s Web Zone.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {existing.isError ? (
                <div className="flex flex-col items-start gap-3 py-6">
                  <p className="text-sm text-muted-foreground">
                    {apiErrorMessage(existing.error)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void existing.refetch()}
                  >
                    Try again
                  </Button>
                </div>
              ) : !loaded ? (
                <div className="space-y-3">
                  <Skeleton className="h-[72px] w-full" />
                  <Skeleton className="h-9 w-2/3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <form
                  id="feedback-page-form"
                  className="space-y-7"
                  onSubmit={(event) => {
                    event.preventDefault();
                    save.mutate();
                  }}
                >
                  <Section title="Banner">
                    <ImageUrlField
                      label="Banner image"
                      value={form.bannerUrl}
                      onChange={set("bannerUrl")}
                      hint="16:9 hero at the top of the page. A gift glyph shows when empty."
                    />
                  </Section>

                  <Section title="Copy">
                    <Field label="Title" htmlFor="fp-title">
                      <Input
                        id="fp-title"
                        required
                        maxLength={120}
                        value={form.title}
                        onChange={(e) => set("title")(e.target.value)}
                      />
                    </Field>
                    <Field label="Description" htmlFor="fp-desc">
                      <Textarea
                        id="fp-desc"
                        required
                        rows={4}
                        maxLength={5000}
                        value={form.description}
                        onChange={(e) => set("description")(e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Benefits"
                      htmlFor="fp-benefits"
                      hint="One per line, up to 20. Shown as a “Why you'll love it” checklist; hidden when empty."
                    >
                      <Textarea
                        id="fp-benefits"
                        rows={4}
                        value={form.benefits}
                        onChange={(e) => set("benefits")(e.target.value)}
                        placeholder={
                          "Fresh offers every week\nRewards credited after review"
                        }
                      />
                    </Field>
                  </Section>

                  <Section
                    title="Button"
                    hint="Opens the website inside the app's Web Zone as <URL>?category=<slug>&embedded=1."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Button text"
                        htmlFor="fp-button"
                        hint="Blank falls back to “Download”."
                      >
                        <Input
                          id="fp-button"
                          maxLength={40}
                          value={form.buttonText}
                          onChange={(e) => set("buttonText")(e.target.value)}
                          placeholder="Download"
                        />
                      </Field>
                      <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm">
                        <Switch
                          checked={form.buttonVisible}
                          onCheckedChange={set("buttonVisible")}
                        />
                        Show button
                      </label>
                    </div>
                    <Field label="Website URL" htmlFor="fp-url">
                      <Input
                        id="fp-url"
                        type="url"
                        required
                        maxLength={2048}
                        value={form.websiteUrl}
                        onChange={(e) => set("websiteUrl")(e.target.value)}
                        placeholder="https://offers.example.com/"
                      />
                    </Field>
                  </Section>

                  <Section title="Reward & publishing">
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Reward coins"
                        htmlFor="fp-points"
                        hint="Saved with the page — the app doesn't display it yet."
                      >
                        <Input
                          id="fp-points"
                          type="number"
                          min={0}
                          step={1}
                          value={form.rewardPoints}
                          onChange={(e) => set("rewardPoints")(e.target.value)}
                        />
                      </Field>
                      <Field label="Status">
                        <StatusSelect
                          value={form.status}
                          onChange={set("status")}
                        />
                      </Field>
                    </div>
                  </Section>
                </form>
              )}
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
                form="feedback-page-form"
                disabled={save.isPending || !loaded}
              >
                {save.isPending ? "Saving…" : "Save page"}
              </Button>
            </div>
          </div>

          {/* ---- live preview (desktop) ---- */}
          <aside className={editorAsideClass}>
            <FeedbackPagePreview
              draft={{
                bannerUrl: form.bannerUrl,
                title: form.title,
                description: form.description,
                benefits: linesToList(form.benefits),
                buttonText: form.buttonText,
                buttonVisible: form.buttonVisible,
              }}
              className="h-full"
            />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};
