import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usersService } from "@/services/users.service";
import { authService } from "@/services/auth.service";
import { settingsService } from "@/services/settings.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { LevelsCoinsSettings } from "./LevelsCoinsSettings";
import { RewardProvidersSettings } from "./RewardProvidersSettings";
import { CoinPurchaseSettings } from "./CoinPurchaseSettings";
import { SettingsGroupCard } from "@/components/shared/SettingsGroupCard";

/** Settings-registry key for the Telegram link (edited via the settings PATCH flow). */
const TELEGRAM_SETTING_KEY = "social.telegramUrl";
/** Settings-registry key for the LinkedIn link (edited via the settings PATCH flow). */
const LINKEDIN_SETTING_KEY = "social.linkedinUrl";

const TABS = [
  { key: "account", label: "Account" },
  { key: "levels", label: "Levels & Coins" },
  { key: "add-coins", label: "Add Coins" },
  { key: "providers", label: "Reward Providers" },
  { key: "ads", label: "Ads" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const profileSchema = z.object({
  name: z.string().min(1, "Required").max(120),
  avatarUrl: z.string().nullable(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export const SettingsPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, setUser, clear } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [tab, setTab] = useState<Tab>("account");
  const canEdit = user?.role === "SUPER_ADMIN";
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? null },
  });

  useEffect(() => {
    reset({ name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? null });
  }, [user, reset]);

  const saveProfile = useMutation({
    mutationFn: (values: ProfileValues) =>
      usersService.updateMe({ name: values.name, avatarUrl: values.avatarUrl }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const logoutAll = useMutation({
    mutationFn: authService.logoutAll,
    onSuccess: () => {
      clear();
      navigate("/login", { replace: true });
      toast.success("Signed out on all devices");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsService.list,
  });
  const telegramSetting = settingsData?.find((s) => s.key === TELEGRAM_SETTING_KEY);
  const [telegramUrl, setTelegramUrl] = useState("");
  useEffect(() => {
    setTelegramUrl(telegramSetting?.value ?? "");
  }, [telegramSetting?.value]);
  const telegramDirty = telegramUrl !== (telegramSetting?.value ?? "");

  const saveTelegram = useMutation({
    mutationFn: () => settingsService.update({ [TELEGRAM_SETTING_KEY]: telegramUrl }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Telegram link saved");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const linkedinSetting = settingsData?.find((s) => s.key === LINKEDIN_SETTING_KEY);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  useEffect(() => {
    setLinkedinUrl(linkedinSetting?.value ?? "");
  }, [linkedinSetting?.value]);
  const linkedinDirty = linkedinUrl !== (linkedinSetting?.value ?? "");

  const saveLinkedin = useMutation({
    mutationFn: () => settingsService.update({ [LINKEDIN_SETTING_KEY]: linkedinUrl }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("LinkedIn link saved");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Settings"
        description="Your profile, appearance, sessions, and reward tuning."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map(({ key, label }) => (
          <Button
            key={key}
            variant={tab === key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "levels" && <LevelsCoinsSettings />}

      {tab === "add-coins" && <CoinPurchaseSettings />}

      {tab === "providers" && <RewardProvidersSettings />}

      {tab === "ads" && (
        <SettingsGroupCard
          prefix="ads."
          enabledKey="ads.enabled"
          title="Google AdMob"
          description={
            <>
              Banner on the app Home screen (AdMob app ca-app-pub-2061747225651398~1021900568).
              Revenue and fill rate are in the{" "}
              <a
                className="underline"
                href="https://admob.google.com/v2/home"
                target="_blank"
                rel="noreferrer"
              >
                AdMob console
              </a>
              .
            </>
          }
        />
      )}

      <div className={tab === "account" ? "space-y-6" : "hidden"}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How you appear across Money Marathon.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => saveProfile.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Avatar</Label>
                <Controller
                  control={control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      label="Upload avatar"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">
                  Managed by your Google account.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Role: <Badge variant="info">{user?.role}</Badge>
                </div>
                <Button type="submit" disabled={!isDirty || saveProfile.isPending}>
                  {saveProfile.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme preference for this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes.
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Sign out of Money Marathon everywhere.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Revokes every refresh token issued to your account, including this session.
              </p>
              <Button
                variant="destructive"
                onClick={() => logoutAll.mutate()}
                disabled={logoutAll.isPending}
              >
                {logoutAll.isPending ? "Working…" : "Sign out everywhere"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telegram</CardTitle>
            <CardDescription>
              Link shown as a card at the bottom of the app&apos;s Home screen. Leave empty to hide it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="telegram-url">Telegram URL</Label>
                <Input
                  id="telegram-url"
                  placeholder="https://t.me/yourchannel"
                  value={telegramUrl}
                  disabled={!canEdit}
                  onChange={(event) => setTelegramUrl(event.target.value)}
                />
              </div>
              {canEdit && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => saveTelegram.mutate()}
                    disabled={!telegramDirty || saveTelegram.isPending}
                  >
                    {saveTelegram.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LinkedIn</CardTitle>
            <CardDescription>
              Link shown as a card at the bottom of the app&apos;s Home screen, below Telegram.
              Leave empty to hide it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                <Input
                  id="linkedin-url"
                  placeholder="https://www.linkedin.com/company/yourpage"
                  value={linkedinUrl}
                  disabled={!canEdit}
                  onChange={(event) => setLinkedinUrl(event.target.value)}
                />
              </div>
              {canEdit && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => saveLinkedin.mutate()}
                    disabled={!linkedinDirty || saveLinkedin.isPending}
                  >
                    {saveLinkedin.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
