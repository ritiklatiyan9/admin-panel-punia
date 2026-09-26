import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settingsService } from "@/services/settings.service";
import { apiErrorMessage } from "@/services/api-client";
import { useAuthStore } from "@/store/auth.store";

interface SettingsGroupCardProps {
  /** Every setting whose key starts with this prefix is edited here. */
  prefix: string;
  /** BOOLEAN key rendered as the header switch. */
  enabledKey: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}

/** One card editing a group of registry settings (e.g. `cpx.*`, `ads.*`) via PATCH /settings. */
export const SettingsGroupCard = ({
  prefix,
  enabledKey,
  title,
  description,
  children,
}: SettingsGroupCardProps): JSX.Element => {
  const queryClient = useQueryClient();
  const canEdit = useAuthStore((state) => state.user?.role === "SUPER_ADMIN");
  const { data } = useQuery({ queryKey: ["settings"], queryFn: settingsService.list });
  const settings = useMemo(() => (data ?? []).filter((s) => s.key.startsWith(prefix)), [data, prefix]);

  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => setDraft(Object.fromEntries(settings.map((s) => [s.key, s.value]))), [settings]);
  const dirty = Object.fromEntries(
    settings.filter((s) => draft[s.key] !== s.value).map((s) => [s.key, draft[s.key]]),
  );
  const dirtyCount = Object.keys(dirty).length;

  const save = useMutation({
    mutationFn: () => settingsService.update(dirty),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(`${title} settings saved`);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const set = (key: string, value: string): void => setDraft((d) => ({ ...d, [key]: value }));
  const enabledDef = settings.find((s) => s.key === enabledKey);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {canEdit && (
          <Button onClick={() => save.mutate()} disabled={dirtyCount === 0 || save.isPending}>
            {save.isPending ? "Saving…" : dirtyCount > 0 ? `Save ${dirtyCount} change(s)` : "Saved"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {data && settings.length === 0 && (
          <p className="text-sm text-muted-foreground">
            These settings are not on the backend yet — deploy the latest backend.
          </p>
        )}
        {enabledDef && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{enabledDef.label}</p>
              <p className="text-sm text-muted-foreground">{enabledDef.description}</p>
            </div>
            <Switch
              checked={draft[enabledKey] === "true"}
              disabled={!canEdit}
              onCheckedChange={(checked) => set(enabledKey, String(checked))}
            />
          </div>
        )}

        {settings
          .filter((s) => s.key !== enabledKey)
          .map((s) => (
            <div key={s.key} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor={s.key}>{s.label}</Label>
                {s.secret && s.hasValue && <Badge variant="success">configured</Badge>}
              </div>
              <Input
                id={s.key}
                type={s.secret ? "password" : "text"}
                autoComplete={s.secret ? "new-password" : "off"}
                value={draft[s.key] ?? ""}
                disabled={!canEdit}
                onChange={(event) => set(s.key, event.target.value)}
                placeholder={s.secret && s.hasValue ? "•••••••• saved — leave blank to keep" : ""}
              />
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
          ))}

        {children}
      </CardContent>
    </Card>
  );
};
