import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  editorAsideClass,
  editorDialogClass,
  editorGridClass,
} from "@/components/shared/app-preview";
import { hotOffersService } from "@/services/hot-offers.service";
import { apiErrorMessage } from "@/services/api-client";
import type {
  ContentStatus,
  OfferCategory,
  OfferCategoryInput,
} from "@/types/domain";
import { CategoryPreview } from "./CategoryPreview";
import { Field, STATUS_NOTE, Section, StatusSelect } from "./EditorFields";
import { ImageUrlField } from "./ImageUrlField";

/** Form state. Priority stays a string so clearing the field never snaps to 0. */
interface Draft {
  title: string;
  subtitle: string;
  imageUrl: string;
  priority: string;
  featured: boolean;
  status: ContentStatus;
}

const toDraft = (c: OfferCategory | null): Draft => ({
  title: c?.title ?? "",
  subtitle: c?.subtitle ?? "",
  imageUrl: c?.imageUrl ?? "",
  priority: String(c?.priority ?? 0),
  featured: c?.featured ?? false,
  status: c?.status ?? "DRAFT",
});

const toInput = (f: Draft): OfferCategoryInput => ({
  title: f.title.trim(),
  subtitle: f.subtitle.trim() || null,
  imageUrl: f.imageUrl.trim() || null,
  priority: Number(f.priority) || 0,
  featured: f.featured,
  status: f.status,
});

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create */
  category: OfferCategory | null;
}

export const CategoryFormDialog = ({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps): JSX.Element => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Draft>(() => toDraft(category));
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]): void =>
      setForm((current) => ({ ...current, [key]: value }));

  // List rows carry every category field, so hydration needs no fetch.
  useEffect(() => {
    if (open) setForm(toDraft(category));
  }, [open, category]);

  const save = useMutation({
    mutationFn: () => {
      const input = toInput(form);
      return category
        ? hotOffersService.updateCategory(category.id, input)
        : hotOffersService.createCategory(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hot-offers"] });
      toast.success(category ? "Category updated" : "Category created");
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
              <DialogTitle>
                {category ? "Edit category" : "New category"}
              </DialogTitle>
              <DialogDescription>
                Groups feedback offers. Its title labels every offer card in the
                app and is a filter chip on the offers website.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <form
                id="category-form"
                className="space-y-7"
                onSubmit={(event) => {
                  event.preventDefault();
                  save.mutate();
                }}
              >
                <Section title="Basics">
                  <Field
                    label="Title"
                    htmlFor="cat-title"
                    hint="Eyebrow on each of its offer cards in Hot Offers; filter chip on the website."
                  >
                    <Input
                      id="cat-title"
                      required
                      maxLength={120}
                      value={form.title}
                      onChange={(e) => set("title")(e.target.value)}
                      placeholder="Reward Zone"
                    />
                  </Field>
                  <Field
                    label="Subtitle"
                    htmlFor="cat-subtitle"
                    hint="Stored with the category — the app doesn't show it yet."
                  >
                    <Input
                      id="cat-subtitle"
                      maxLength={200}
                      value={form.subtitle}
                      onChange={(e) => set("subtitle")(e.target.value)}
                      placeholder="Test apps, share feedback, earn rewards"
                    />
                  </Field>
                </Section>

                <Section title="Media">
                  <ImageUrlField
                    label="Image"
                    value={form.imageUrl}
                    onChange={set("imageUrl")}
                    hint="Card art in this admin only — the app doesn't show it yet."
                  />
                </Section>

                <Section title="Publishing">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Field label="Status">
                      <StatusSelect
                        value={form.status}
                        onChange={set("status")}
                      />
                    </Field>
                    <Field
                      label="Priority"
                      htmlFor="cat-priority"
                      hint="Higher sorts first; featured categories lead."
                    >
                      <Input
                        id="cat-priority"
                        type="number"
                        min={0}
                        max={10_000}
                        step={1}
                        value={form.priority}
                        onChange={(e) => set("priority")(e.target.value)}
                      />
                    </Field>
                    <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm">
                      <Switch
                        checked={form.featured}
                        onCheckedChange={set("featured")}
                      />
                      Featured
                    </label>
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
                form="category-form"
                disabled={save.isPending}
              >
                {save.isPending
                  ? "Saving…"
                  : category
                    ? "Save changes"
                    : "Create category"}
              </Button>
            </div>
          </div>

          {/* ---- live preview (desktop) ---- */}
          <aside className={editorAsideClass}>
            <CategoryPreview
              draft={{ title: form.title, featured: form.featured }}
              className="h-full"
            />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};
