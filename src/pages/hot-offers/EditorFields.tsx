import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentStatus } from "@/types/domain";

/** Layout helpers shared by the Hot Offers editor dialogs (same anatomy as OfferFormDialog). */

export const Section = ({
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

export const Field = ({
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

export const StatusSelect = ({
  value,
  onChange,
}: {
  value: ContentStatus;
  onChange: (value: ContentStatus) => void;
}): JSX.Element => (
  <Select
    value={value}
    onValueChange={(next) => onChange(next as ContentStatus)}
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
);

export const STATUS_NOTE: Record<ContentStatus, string> = {
  DRAFT: "Saved as a draft — hidden from users.",
  PUBLISHED: "Visible to users as soon as you save.",
  ARCHIVED: "Archived — hidden from users.",
};
