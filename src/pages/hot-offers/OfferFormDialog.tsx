import { useEffect, useState, type ReactNode } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hotOffersService } from "@/services/hot-offers.service";
import { apiErrorMessage } from "@/services/api-client";
import type {
  CompletedBehavior,
  ContentStatus,
  HotOffer,
  HotOfferDetails,
  HotOfferInput,
  OfferCategory,
  OfferDifficulty,
} from "@/types/domain";
import { ImageUrlField } from "./ImageUrlField";
import { OfferPreview, type OfferPreviewDraft } from "./OfferPreview";

/** Form state. Numbers stay strings so clearing a field never snaps to 0. */
interface Draft {
  categoryId: string;
  title: string;
  appName: string;
  shortDescription: string;
  description: string;
  taskDescription: string;
  features: string;
  instructions: string;
  requirements: string;
  terms: string;
  warning: string;
  rewardAmount: string;
  rewardCoins: string;
  rewardLabel: string;
  difficulty: OfferDifficulty;
  estimatedTime: string;
  rating: string;
  playStoreUrl: string;
  logoUrl: string;
  thumbnailUrl: string;
  bannerUrl: string;
  brandLogoUrl: string;
  featured: boolean;
  trending: boolean;
  isProduct: boolean;
  expiresAt: string;
  maxUsers: string;
  maxRewards: string;
  dailyLimit: string;
  priority: string;
  status: ContentStatus;
  completedBehavior: CompletedBehavior;
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

const linesToList = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const str = (value: number | null | undefined): string =>
  value == null ? "" : String(value);
const numOrNull = (value: string): number | null =>
  value.trim() === "" ? null : Number(value);

const toDraft = (
  d: HotOfferDetails | undefined,
  fallbackCategoryId: string,
  lockProduct: boolean,
): Draft => ({
  categoryId: d?.category.id ?? fallbackCategoryId,
  title: d?.title ?? "",
  appName: d?.appName ?? "",
  shortDescription: d?.shortDescription ?? "",
  description: d?.description ?? "",
  taskDescription: d?.taskDescription ?? "",
  features: (d?.features ?? []).join("\n"),
  instructions: (d?.instructions ?? []).join("\n"),
  requirements: (d?.requirements ?? []).join("\n"),
  terms: d?.terms ?? "",
  warning: d?.warning ?? "",
  rewardAmount: str(d?.rewardAmount ?? 0),
  rewardCoins: str(d?.rewardCoins ?? 0),
  rewardLabel: d?.rewardLabel ?? "",
  difficulty: d?.difficulty ?? "EASY",
  estimatedTime: d?.estimatedTime ?? "",
  rating: str(d?.rating),
  playStoreUrl: d?.playStoreUrl ?? "",
  logoUrl: d?.logoUrl ?? "",
  thumbnailUrl: d?.thumbnailUrl ?? "",
  bannerUrl: d?.bannerUrl ?? "",
  brandLogoUrl: d?.brandLogoUrl ?? "",
  featured: d?.featured ?? false,
  trending: d?.trending ?? false,
  isProduct: lockProduct || (d?.isProduct ?? false),
  expiresAt: toLocalInput(d?.expiresAt ?? null),
  maxUsers: str(d?.maxUsers),
  maxRewards: str(d?.maxRewards),
  dailyLimit: str(d?.dailyLimit),
  priority: str(d?.priority ?? 0),
  status: d?.status ?? "DRAFT",
  completedBehavior: d?.completedBehavior ?? "SHOW",
});

const toInput = (f: Draft, lockProduct: boolean): HotOfferInput => ({
  categoryId: f.categoryId,
  title: f.title.trim(),
  appName: f.appName.trim() || null,
  shortDescription: f.shortDescription.trim(),
  description: f.description.trim(),
  taskDescription: f.taskDescription.trim() || null,
  features: linesToList(f.features),
  instructions: linesToList(f.instructions),
  requirements: linesToList(f.requirements),
  terms: f.terms.trim() || null,
  warning: f.warning.trim() || null,
  rewardAmount: Number(f.rewardAmount) || 0,
  rewardCoins: Number(f.rewardCoins) || 0,
  rewardLabel: f.rewardLabel.trim() || null,
  difficulty: f.difficulty,
  estimatedTime: f.estimatedTime.trim() || null,
  rating: numOrNull(f.rating),
  playStoreUrl: f.playStoreUrl.trim(),
  logoUrl: f.logoUrl.trim() || null,
  thumbnailUrl: f.thumbnailUrl.trim() || null,
  bannerUrl: f.bannerUrl.trim() || null,
  featured: f.featured,
  trending: f.trending,
  isProduct: lockProduct || f.isProduct,
  brandLogoUrl: f.brandLogoUrl.trim() || null,
  expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
  maxUsers: numOrNull(f.maxUsers),
  maxRewards: numOrNull(f.maxRewards),
  dailyLimit: numOrNull(f.dailyLimit),
  completedBehavior: f.completedBehavior,
  priority: Number(f.priority) || 0,
  status: f.status,
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

const STATUS_NOTE: Record<ContentStatus, string> = {
  DRAFT: "Saved as a draft — hidden from users.",
  PUBLISHED: "Visible to users as soon as you save.",
  ARCHIVED: "Archived — hidden from users.",
};

interface OfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: OfferCategory[];
  /** null = create; otherwise the list row — full details are fetched here. */
  offer: HotOffer | null;
  /** App Offers module: force isProduct=true and surface the brand logo first. */
  lockProduct?: boolean;
}

export const OfferFormDialog = ({
  open,
  onOpenChange,
  categories,
  offer,
  lockProduct = false,
}: OfferFormDialogProps): JSX.Element => {
  const queryClient = useQueryClient();

  const details = useQuery({
    queryKey: ["hot-offers", "offer", offer?.id],
    queryFn: () => hotOffersService.getOffer(offer!.id),
    enabled: open && offer !== null,
  });

  const fallbackCategoryId = offer?.category.id ?? categories[0]?.id ?? "";
  const [form, setForm] = useState<Draft>(() =>
    toDraft(undefined, fallbackCategoryId, lockProduct),
  );
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]): void =>
      setForm((current) => ({ ...current, [key]: value }));

  // Hydrate when the dialog opens and the full offer is available (list rows
  // lack the long fields). Keyed on `loaded`, not the data object, so a
  // background refetch can't wipe half-typed edits.
  const loaded = offer === null || details.isSuccess;
  useEffect(() => {
    if (!open || !loaded) return;
    const data = offer
      ? queryClient.getQueryData<HotOfferDetails>([
          "hot-offers",
          "offer",
          offer.id,
        ])
      : undefined;
    setForm(toDraft(data, fallbackCategoryId, lockProduct));
  }, [open, loaded, offer, queryClient, fallbackCategoryId, lockProduct]);

  const save = useMutation({
    mutationFn: () => {
      const input = toInput(form, lockProduct);
      return offer
        ? hotOffersService.updateOffer(offer.id, input)
        : hotOffersService.createOffer(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hot-offers"] });
      toast.success(offer ? "Offer updated" : "Offer created");
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const isProduct = lockProduct || form.isProduct;
  const preview: OfferPreviewDraft = {
    title: form.title,
    appName: form.appName,
    categoryTitle:
      categories.find((category) => category.id === form.categoryId)?.title ??
      "",
    description: form.description,
    features: linesToList(form.features),
    instructions: linesToList(form.instructions),
    requirements: linesToList(form.requirements),
    terms: form.terms,
    warning: form.warning,
    rewardAmount: Number(form.rewardAmount) || 0,
    rewardCoins: Number(form.rewardCoins) || 0,
    rewardLabel: form.rewardLabel,
    difficulty: form.difficulty,
    estimatedTime: form.estimatedTime,
    rating: numOrNull(form.rating),
    logoUrl: form.logoUrl,
    thumbnailUrl: form.thumbnailUrl,
    bannerUrl: form.bannerUrl,
    brandLogoUrl: form.brandLogoUrl,
    featured: form.featured,
    trending: form.trending,
    isProduct,
  };

  const noun = lockProduct ? "app offer" : "offer";

  const brandLogoField = (
    <ImageUrlField
      label="Brand logo"
      value={form.brandLogoUrl}
      onChange={set("brandLogoUrl")}
      hint="Brand chip on the offer page; home card art when there is no thumbnail."
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[92vh] max-h-[92vh] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0"
        // A stray click outside must not throw away a long form; Esc and Cancel still close.
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* ---- form ---- */}
          <div className="flex min-h-0 flex-col">
            <DialogHeader className="border-b px-6 pb-4 pt-6">
              <DialogTitle>
                {offer ? `Edit ${noun}` : `New ${noun}`}
              </DialogTitle>
              <DialogDescription>
                {lockProduct
                  ? "Shown on the app home rail, the Explore grid and its own offer page — the preview on the right is what users see."
                  : "One offer powers an Explore card and its offer page, ending at its Play Store URL."}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {offer && details.isError ? (
                <div className="flex flex-col items-start gap-3 py-6">
                  <p className="text-sm text-muted-foreground">
                    {apiErrorMessage(details.error)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void details.refetch()}
                  >
                    Try again
                  </Button>
                </div>
              ) : offer && !loaded ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-2/3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <form
                  id="offer-form"
                  className="space-y-7"
                  onSubmit={(event) => {
                    event.preventDefault();
                    save.mutate();
                  }}
                >
                  <Section title="Basics">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Category">
                        <Select
                          value={form.categoryId}
                          onValueChange={set("categoryId")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="App / brand name" htmlFor="of-app">
                        <Input
                          id="of-app"
                          maxLength={120}
                          value={form.appName}
                          onChange={(e) => set("appName")(e.target.value)}
                          placeholder="e.g. Zepto"
                        />
                      </Field>
                    </div>
                    <Field label="Title" htmlFor="of-title">
                      <Input
                        id="of-title"
                        required
                        maxLength={140}
                        value={form.title}
                        onChange={(e) => set("title")(e.target.value)}
                        placeholder="e.g. Order groceries on Zepto"
                      />
                    </Field>
                    <Field
                      label="Card description (short)"
                      htmlFor="of-short"
                      hint={`${form.shortDescription.length}/200 characters · shown under the title on cards`}
                    >
                      <Input
                        id="of-short"
                        required
                        maxLength={200}
                        value={form.shortDescription}
                        onChange={(e) =>
                          set("shortDescription")(e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Full description" htmlFor="of-desc">
                      <Textarea
                        id="of-desc"
                        required
                        rows={4}
                        maxLength={10_000}
                        value={form.description}
                        onChange={(e) => set("description")(e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Task (what the user must do to earn)"
                      htmlFor="of-task"
                    >
                      <Textarea
                        id="of-task"
                        rows={2}
                        maxLength={2000}
                        value={form.taskDescription}
                        onChange={(e) => set("taskDescription")(e.target.value)}
                        placeholder="e.g. Install and place your first order within 3 days"
                      />
                    </Field>
                  </Section>

                  <Section
                    title="Media"
                    hint="Upload or paste a URL. The preview updates as each image loads."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      {lockProduct && (
                        <div className="sm:col-span-2">{brandLogoField}</div>
                      )}
                      <ImageUrlField
                        label="Thumbnail (card art)"
                        value={form.thumbnailUrl}
                        onChange={set("thumbnailUrl")}
                        hint="Home card (contained) and Explore card (16:9, cropped)."
                      />
                      <ImageUrlField
                        label="Logo"
                        value={form.logoUrl}
                        onChange={set("logoUrl")}
                        hint="Offer page identity; card art fallback when there is no thumbnail."
                      />
                      <ImageUrlField
                        label="Banner (offer page hero)"
                        value={form.bannerUrl}
                        onChange={set("bannerUrl")}
                        hint="Top of the offer page. Falls back to thumbnail, then logo."
                      />
                      {!lockProduct && brandLogoField}
                    </div>
                  </Section>

                  <Section title="Reward">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Field
                        label="Coins credited on approval"
                        htmlFor="of-reward"
                        hint="What the wallet receives."
                      >
                        <Input
                          id="of-reward"
                          type="number"
                          required
                          min={0}
                          max={1_000_000}
                          step="0.01"
                          value={form.rewardAmount}
                          onChange={(e) => set("rewardAmount")(e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Coins shown in app"
                        htmlFor="of-coins"
                        hint="Optional. 0 = show the credited amount."
                      >
                        <Input
                          id="of-coins"
                          type="number"
                          min={0}
                          max={10_000_000}
                          step={1}
                          value={form.rewardCoins}
                          onChange={(e) => set("rewardCoins")(e.target.value)}
                        />
                      </Field>
                      <Field
                        label="Website reward label"
                        htmlFor="of-reward-label"
                        hint="Optional. Replaces the number on the offer page."
                      >
                        <Input
                          id="of-reward-label"
                          maxLength={80}
                          value={form.rewardLabel}
                          onChange={(e) => set("rewardLabel")(e.target.value)}
                          placeholder="₹50 cashback"
                        />
                      </Field>
                      <Field label="Difficulty">
                        <Select
                          value={form.difficulty}
                          onValueChange={(value) =>
                            set("difficulty")(value as OfferDifficulty)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EASY">Easy</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HARD">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Estimated time" htmlFor="of-time">
                        <Input
                          id="of-time"
                          maxLength={40}
                          value={form.estimatedTime}
                          onChange={(e) => set("estimatedTime")(e.target.value)}
                          placeholder="10 min"
                        />
                      </Field>
                      <Field label="Rating (0–5)" htmlFor="of-rating">
                        <Input
                          id="of-rating"
                          type="number"
                          min={0}
                          max={5}
                          step="0.1"
                          value={form.rating}
                          onChange={(e) => set("rating")(e.target.value)}
                          placeholder="4.5"
                        />
                      </Field>
                    </div>
                  </Section>

                  <Section
                    title="Play Store & limits"
                    hint="Caps are enforced by the submission guard; blank means unlimited."
                  >
                    <Field label="Play Store URL" htmlFor="of-store">
                      <Input
                        id="of-store"
                        type="url"
                        required
                        maxLength={2048}
                        pattern="https://play\.google\.com/.*"
                        title="Must start with https://play.google.com/"
                        value={form.playStoreUrl}
                        onChange={(e) => set("playStoreUrl")(e.target.value)}
                        placeholder="https://play.google.com/store/apps/details?id=com.xyz.app"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Offer expiry" htmlFor="of-expiry">
                        <Input
                          id="of-expiry"
                          type="datetime-local"
                          value={form.expiresAt}
                          onChange={(e) => set("expiresAt")(e.target.value)}
                        />
                      </Field>
                      <Field label="Max users" htmlFor="of-max-users">
                        <Input
                          id="of-max-users"
                          type="number"
                          min={1}
                          step={1}
                          value={form.maxUsers}
                          onChange={(e) => set("maxUsers")(e.target.value)}
                          placeholder="∞"
                        />
                      </Field>
                      <Field label="Max rewards" htmlFor="of-max-rewards">
                        <Input
                          id="of-max-rewards"
                          type="number"
                          min={1}
                          step={1}
                          value={form.maxRewards}
                          onChange={(e) => set("maxRewards")(e.target.value)}
                          placeholder="∞"
                        />
                      </Field>
                      <Field label="Daily limit / user" htmlFor="of-daily">
                        <Input
                          id="of-daily"
                          type="number"
                          min={1}
                          step={1}
                          value={form.dailyLimit}
                          onChange={(e) => set("dailyLimit")(e.target.value)}
                          placeholder="∞"
                        />
                      </Field>
                    </div>
                  </Section>

                  <Section
                    title="Offer page content"
                    hint="One item per line, up to 20 lines each. Empty sections are hidden on the page."
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field
                        label="How to complete it"
                        htmlFor="of-instructions"
                      >
                        <Textarea
                          id="of-instructions"
                          rows={5}
                          value={form.instructions}
                          onChange={(e) => set("instructions")(e.target.value)}
                          placeholder={
                            "Install the app\nSign up with your number\nPlace your first order"
                          }
                        />
                      </Field>
                      <Field label="Features" htmlFor="of-features">
                        <Textarea
                          id="of-features"
                          rows={5}
                          value={form.features}
                          onChange={(e) => set("features")(e.target.value)}
                        />
                      </Field>
                      <Field label="Requirements" htmlFor="of-requirements">
                        <Textarea
                          id="of-requirements"
                          rows={5}
                          value={form.requirements}
                          onChange={(e) => set("requirements")(e.target.value)}
                          placeholder={"New users only\nIndia only"}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Terms" htmlFor="of-terms">
                        <Textarea
                          id="of-terms"
                          rows={2}
                          maxLength={5000}
                          value={form.terms}
                          onChange={(e) => set("terms")(e.target.value)}
                        />
                      </Field>
                      <Field label="Warning" htmlFor="of-warning">
                        <Textarea
                          id="of-warning"
                          rows={2}
                          maxLength={1000}
                          value={form.warning}
                          onChange={(e) => set("warning")(e.target.value)}
                          placeholder="Shown in red on the offer page"
                        />
                      </Field>
                    </div>
                  </Section>

                  <Section title="Publishing">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Field label="Status">
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
                      <Field
                        label="Priority"
                        htmlFor="of-priority"
                        hint="Higher sorts first."
                      >
                        <Input
                          id="of-priority"
                          type="number"
                          min={0}
                          max={10_000}
                          step={1}
                          value={form.priority}
                          onChange={(e) => set("priority")(e.target.value)}
                        />
                      </Field>
                      <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Switch
                            checked={form.featured}
                            onCheckedChange={set("featured")}
                          />
                          Featured
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Switch
                            checked={form.trending}
                            onCheckedChange={set("trending")}
                          />
                          Trending
                          <span className="text-xs text-muted-foreground">
                            (“HOT” ribbon)
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Switch
                            checked={isProduct}
                            onCheckedChange={set("isProduct")}
                            disabled={lockProduct}
                          />
                          Product offer
                          <span className="text-xs text-muted-foreground">
                            {lockProduct ? "(always on here)" : "(home rail)"}
                          </span>
                        </label>
                      </div>
                    </div>
                    <Field
                      label="After a user completes this offer"
                      hint="Applies once their proof is approved. Other users are unaffected."
                    >
                      <Select
                        value={form.completedBehavior}
                        onValueChange={(value) =>
                          set("completedBehavior")(value as CompletedBehavior)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SHOW">
                            Keep showing the offer normally
                          </SelectItem>
                          <SelectItem value="HIDE">
                            Hide the offer from them
                          </SelectItem>
                          <SelectItem value="SHOW_COMPLETED">
                            Show with a disabled &quot;Completed&quot; button
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
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
                form="offer-form"
                disabled={save.isPending || !loaded}
              >
                {save.isPending
                  ? "Saving…"
                  : offer
                    ? "Save changes"
                    : `Create ${noun}`}
              </Button>
            </div>
          </div>

          {/* ---- live preview (desktop) ---- */}
          <aside className="hidden min-h-0 border-l bg-muted/30 lg:flex lg:flex-col">
            <OfferPreview draft={preview} className="h-full" />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};
