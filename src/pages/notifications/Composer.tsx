import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Segmented,
  editorAsideClass,
  editorGridClass,
} from "@/components/shared/app-preview";
import { ImageUrlField } from "@/pages/hot-offers/ImageUrlField";
import { notificationsService } from "@/services/notifications.service";
import { adminService } from "@/services/admin.service";
import { apiErrorMessage } from "@/services/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import type {
  NotificationType,
  PushAudience,
  PushLog,
  SendNotificationInput,
} from "@/types/domain";
import { PushPreview } from "./PushPreview";

const TITLE_MAX = 120; // mirrors backend sendNotificationSchema
const BODY_MAX = 1000;

const AUDIENCES: { id: PushAudience; label: string }[] = [
  { id: "all", label: "All users" },
  { id: "user", label: "Single user" },
  { id: "topic", label: "Topic" },
];

const TYPES: { value: NotificationType; label: string }[] = [
  { value: "SYSTEM", label: "System" },
  { value: "CAMPAIGN", label: "Campaign" },
  { value: "CLAIM", label: "Claim" },
  { value: "WALLET", label: "Wallet" },
];

/** Deep-link targets that exist in the mobile app's router. */
const APP_ROUTES: { value: string; label: string }[] = [
  { value: "/missions", label: "Missions" },
  { value: "/missions/game", label: "Mission game" },
  { value: "/wallet", label: "Wallet" },
  { value: "/hot-offers", label: "Hot offers" },
  { value: "/games", label: "Games" },
  { value: "/redeem", label: "Redeem" },
  { value: "/notifications", label: "Notifications" },
  { value: "/share-earn", label: "Share & earn" },
];

interface PickedUser {
  id: string;
  name: string;
  email: string;
}

/** Form state. `route` "" = no deep link; `scheduledAt` is a datetime-local value. */
interface Draft {
  audience: PushAudience;
  user: PickedUser | null;
  topic: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string;
  route: string;
  silent: boolean;
  schedule: boolean;
  scheduledAt: string;
}

const EMPTY: Draft = {
  audience: "all",
  user: null,
  topic: "",
  type: "SYSTEM",
  title: "",
  body: "",
  imageUrl: "",
  route: "",
  silent: false,
  schedule: false,
  scheduledAt: "",
};

/** "Send again": history rows carry only the recipient's id, not their name. */
const fromLog = (log: PushLog): Draft => ({
  ...EMPTY,
  audience: log.audience,
  user: log.userId
    ? {
        id: log.userId,
        name: `User ${log.userId.slice(0, 8)}…`,
        email: log.userId,
      }
    : null,
  topic: log.topic ?? "",
  type: log.type,
  title: log.title,
  body: log.body,
  imageUrl: log.imageUrl ?? "",
  route: log.route ?? "",
  silent: log.silent,
});

const toInput = (f: Draft): SendNotificationInput => ({
  audience: f.audience,
  userId: f.audience === "user" ? f.user?.id : undefined,
  topic: f.audience === "topic" ? f.topic.trim() : undefined,
  type: f.type,
  title: f.title.trim(),
  body: f.body.trim(),
  imageUrl: f.imageUrl.trim() || undefined,
  route: f.route || undefined,
  silent: f.silent,
  scheduledAt:
    f.schedule && f.scheduledAt
      ? new Date(f.scheduledAt).toISOString()
      : undefined,
});

/** datetime-local value (local tz, minute precision). */
const toLocalInput = (date: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

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
  trailing,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: string;
  /** Right-aligned on the label row (character counters). */
  trailing?: ReactNode;
  children: ReactNode;
}): JSX.Element => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <Label htmlFor={htmlFor}>{label}</Label>
      {trailing}
    </div>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Counter = ({
  length,
  max,
}: {
  length: number;
  max: number;
}): JSX.Element => (
  <span
    className={cn(
      "text-xs tabular-nums",
      length > max * 0.9
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground",
    )}
  >
    {length}/{max}
  </span>
);

interface ComposerProps {
  /** A history row to send again. A fresh object per click, so the same row re-hydrates. */
  prefill: PushLog | null;
}

/** Top-of-page composer: form on the left, live device preview on the right. */
export const Composer = ({ prefill }: ComposerProps): JSX.Element => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Draft>(EMPTY);
  const [userSearch, setUserSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]): void =>
      setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (prefill) setForm(fromLog(prefill));
  }, [prefill]);

  const debouncedSearch = useDebounce(userSearch);
  const users = useQuery({
    queryKey: ["admin", "users", "picker", debouncedSearch],
    queryFn: ({ signal }) =>
      adminService.listUsers(
        { page: 1, limit: 8, search: debouncedSearch.trim() || undefined },
        signal,
      ),
    enabled: form.audience === "user" && !form.user,
  });

  const audienceLine =
    form.audience === "all"
      ? "Delivers to every active user"
      : form.audience === "user"
        ? form.user
          ? `Delivers only to ${form.user.email}`
          : "Delivers to one user — pick a recipient"
        : form.topic
          ? `Delivers to devices subscribed to "${form.topic}"`
          : "Delivers to an FCM topic";

  const scheduledLabel =
    form.schedule && form.scheduledAt
      ? formatDateTime(new Date(form.scheduledAt).toISOString())
      : null;

  const send = useMutation({
    mutationFn: () => notificationsService.send(toInput(form)),
    onSuccess: () => {
      toast.success(
        scheduledLabel
          ? `Scheduled for ${scheduledLabel}`
          : form.audience === "all"
            ? "Broadcast queued — delivering to all users"
            : form.audience === "user"
              ? `Notification queued for ${form.user?.email}`
              : `Notification queued for topic "${form.topic}"`,
      );
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "history"],
      });
      setConfirmOpen(false);
      setForm(EMPTY);
      setUserSearch("");
    },
    onError: (error) => {
      setConfirmOpen(false);
      toast.error(apiErrorMessage(error));
    },
  });

  // A prefilled route may not be in the picker (e.g. "/campaigns/123"); keep it selectable.
  const routes = APP_ROUTES.some((r) => r.value === form.route)
    ? APP_ROUTES
    : [...APP_ROUTES, { value: form.route, label: form.route }];

  const note = form.schedule
    ? "Fires at the chosen time · cancel from the history below until then"
    : form.audience === "all"
      ? "Reaches every registered device · delivery runs in the background"
      : form.audience === "user"
        ? "Reaches the recipient's registered devices · delivery runs in the background"
        : "Push only · topic sends create no in-app inbox entry";

  return (
    <Card className="mb-6 overflow-hidden">
      <div className={editorGridClass}>
        {/* ---- form ---- */}
        <div className="flex min-h-0 flex-col">
          <div className="border-b px-6 pb-4 pt-6">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              Compose notification
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Lands in the Android notification tray and the in-app inbox — the
              preview on the right is what users see.
            </p>
          </div>

          <form
            id="push-form"
            className="space-y-7 px-6 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Section title="Audience">
              <Segmented
                size="md"
                value={form.audience}
                onChange={set("audience")}
                options={AUDIENCES}
              />

              {form.audience === "user" &&
                (form.user ? (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {form.user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {form.user.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => set("user")(null)}
                      title="Change recipient"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Field label="Recipient" htmlFor="user-search">
                    <Input
                      id="user-search"
                      // Native validation: the field only exists while nobody is picked.
                      ref={(el) =>
                        el?.setCustomValidity("Pick a recipient from the list")
                      }
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search by email or name…"
                      autoFocus
                    />
                    <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-md border p-1">
                      {users.isLoading ? (
                        <p className="p-2 text-sm text-muted-foreground">
                          Searching…
                        </p>
                      ) : users.data && users.data.items.length > 0 ? (
                        users.data.items.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => set("user")(user)}
                            className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                          >
                            <span className="truncate">{user.name}</span>
                            <span className="ml-2 truncate text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="p-2 text-sm text-muted-foreground">
                          No users found
                        </p>
                      )}
                    </div>
                  </Field>
                ))}

              {form.audience === "topic" && (
                <Field
                  label="Topic name"
                  htmlFor="topic"
                  hint="Push-only — topic sends create no in-app inbox entry."
                >
                  <Input
                    id="topic"
                    required
                    maxLength={900}
                    pattern="[a-zA-Z0-9_.~%\-]{1,900}"
                    title="Letters, digits and -_.~% only"
                    value={form.topic}
                    onChange={(event) => set("topic")(event.target.value)}
                    placeholder="e.g. beta-testers"
                  />
                </Field>
              )}
            </Section>

            <Section title="Message">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <Field
                  label="Title"
                  htmlFor="push-title"
                  trailing={
                    <Counter length={form.title.length} max={TITLE_MAX} />
                  }
                >
                  <Input
                    id="push-title"
                    required
                    maxLength={TITLE_MAX}
                    value={form.title}
                    onChange={(event) => set("title")(event.target.value)}
                    placeholder="Heads up!"
                  />
                </Field>
                <Field label="Type" hint="Picks the icon in the app inbox.">
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      set("type")(value as NotificationType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field
                label="Message"
                htmlFor="push-body"
                trailing={<Counter length={form.body.length} max={BODY_MAX} />}
              >
                <Textarea
                  id="push-body"
                  required
                  rows={3}
                  maxLength={BODY_MAX}
                  value={form.body}
                  onChange={(event) => set("body")(event.target.value)}
                  placeholder="Your message…"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Backend requires a hosted https:// URL — the upload button posts to /uploads. */}
                <ImageUrlField
                  label="Image (optional)"
                  value={form.imageUrl}
                  onChange={set("imageUrl")}
                  hint="Large picture under the text on Android; thumbnail in the app inbox."
                />
                <Field
                  label="Opens screen (optional)"
                  hint="Where a tap takes the user."
                >
                  <Select
                    value={form.route || "none"}
                    onValueChange={(value) =>
                      set("route")(value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">App home (default)</SelectItem>
                      {routes.map((appRoute) => (
                        <SelectItem key={appRoute.value} value={appRoute.value}>
                          {appRoute.label}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {appRoute.value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Switch checked={form.silent} onCheckedChange={set("silent")} />
                Silent
                <span className="text-xs text-muted-foreground">
                  (data-only: no banner, no inbox row)
                </span>
              </label>
            </Section>

            <Section title="Schedule">
              <div className="flex flex-wrap items-end gap-3">
                <Segmented
                  size="md"
                  value={form.schedule ? "later" : "now"}
                  onChange={(value) => set("schedule")(value === "later")}
                  options={[
                    { id: "now", label: "Send now" },
                    { id: "later", label: "Schedule" },
                  ]}
                />
                {form.schedule && (
                  <Field label="Fires at (your local time)" htmlFor="push-when">
                    <Input
                      id="push-when"
                      type="datetime-local"
                      required
                      min={toLocalInput(new Date())}
                      value={form.scheduledAt}
                      onChange={(event) =>
                        set("scheduledAt")(event.target.value)
                      }
                    />
                  </Field>
                )}
              </div>
            </Section>
          </form>

          <div className="mt-auto flex items-center gap-3 border-t px-6 py-4">
            <p className="mr-auto text-xs text-muted-foreground">{note}</p>
            <Button type="submit" form="push-form" disabled={send.isPending}>
              <PaperAirplaneIcon className="mr-1.5 h-4 w-4" />
              {send.isPending
                ? "Sending…"
                : form.schedule
                  ? "Schedule"
                  : form.audience === "all"
                    ? "Send to all users"
                    : "Send"}
            </Button>
          </div>
        </div>

        {/* ---- live preview (desktop) ---- */}
        <aside className={editorAsideClass}>
          <PushPreview draft={form} className="h-full" />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          form.audience === "all"
            ? "Broadcast to all users?"
            : "Send this notification?"
        }
        confirmLabel={
          scheduledLabel
            ? "Schedule"
            : form.audience === "all"
              ? "Yes, broadcast"
              : "Send now"
        }
        loading={send.isPending}
        onConfirm={() => send.mutate()}
        description={
          <span className="mt-1 block space-y-1 text-left">
            <span className="block font-medium text-foreground">
              {form.title.trim()}
            </span>
            <span className="line-clamp-3 block">{form.body.trim()}</span>
            <span className="block pt-1">
              To:{" "}
              <span className="font-medium text-foreground">
                {audienceLine}
              </span>
            </span>
            {scheduledLabel && (
              <span className="block">Fires {scheduledLabel}</span>
            )}
            {form.imageUrl && <span className="block">Includes an image</span>}
            {form.route && (
              <span className="block">Tap opens {form.route}</span>
            )}
            {form.silent && <span className="block">Silent (data-only)</span>}
          </span>
        }
      />
    </Card>
  );
};
