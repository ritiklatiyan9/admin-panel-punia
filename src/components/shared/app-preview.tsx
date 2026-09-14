/**
 * Building blocks for "how it looks in the app" previews inside admin dialogs.
 * Tokens mirror prithivi-app lib/theme/app_colors.dart (light — the only theme
 * the app ships) and prithvi-web tailwind.config.ts. Keep them in sync there.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export const APP = {
  ink: "#242320",
  soft: "#65615C",
  muted: "#77716A",
  hairline: "#D6D1C9",
  wash: "#F6F5F3",
  surfaceAlt: "#F5F3EF",
  pageBg: "#FFFEFC",
  artBg: "#FAF9F7",
  accent: "#C7501B",
  accentDeep: "#A93D13",
  onAccent: "#F2F6FA",
  danger: "#F87171",
  webDanger: "#B83232",
  success: "#248463",
  coin: "#EAB308",
  accentGradient: "linear-gradient(135deg,#D75F26,#C7501B)",
  font: "'Manrope','Segoe UI',system-ui,sans-serif",
} as const;

/** 1px warm hairline border — the app's resting-card edge. */
export const hairline = { border: `1px solid ${APP.hairline}` } as const;

/** The app renders Manrope; load it once per document for the replicas. */
export const useAppFont = (): void => {
  useEffect(() => {
    if (document.getElementById("app-preview-fonts")) return;
    const link = document.createElement("link");
    link.id = "app-preview-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);
};

/** First source that loads wins; a broken URL never leaves a browser broken-image glyph. */
export const Artwork = ({
  sources,
  fit = "contain",
  className,
  fallback,
}: {
  sources: (string | null | undefined)[];
  fit?: "cover" | "contain";
  className?: string;
  fallback: ReactNode;
}): JSX.Element => {
  const [failed, setFailed] = useState<string[]>([]);
  const src = sources.find(
    (url): url is string => !!url && !failed.includes(url),
  );
  if (!src) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt=""
      className={cn(
        "h-full w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        className,
      )}
      onError={() => setFailed((current) => [...current, src])}
    />
  );
};

/** The app's gold coin glyph (CoinIcon in Flutter / prithvi-web). */
export const CoinIcon = ({ size = 16 }: { size?: number }): JSX.Element => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    aria-hidden
    className="shrink-0"
  >
    <circle cx="8" cy="8" r="7" fill="#EAB308" />
    <circle
      cx="8"
      cy="8"
      r="4.5"
      fill="none"
      stroke="#A16207"
      strokeWidth="1.5"
    />
  </svg>
);

/** Grey placeholder block: the parts of a screen that are context, not the thing being edited. */
export const Block = ({ className }: { className?: string }): JSX.Element => (
  <div
    className={cn("rounded-lg", className)}
    style={{ background: APP.wash }}
  />
);

/** Segmented control (admin theme) — page tabs and preview view switchers. */
export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: ReactNode }[];
  size?: "sm" | "md";
  className?: string;
}): JSX.Element => (
  <div className={cn("inline-flex rounded-lg bg-muted p-1", className)}>
    {options.map((option) => (
      <button
        key={option.id}
        type="button"
        onClick={() => onChange(option.id)}
        className={cn(
          "flex items-center gap-1.5 rounded-md font-medium transition-colors",
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
          value === option.id
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

/**
 * A 360-wide Android frame scaled down so proportions match a real device.
 * `children` scroll inside the screen; `overlay` is pinned to the bottom
 * (sticky CTA bars).
 */
export const PhoneFrame = ({
  children,
  overlay,
  zoom = 0.76,
  style,
}: {
  children: ReactNode;
  overlay?: ReactNode;
  zoom?: number;
  style?: CSSProperties;
}): JSX.Element => (
  <div style={{ zoom }}>
    <div className="h-[760px] w-[360px] rounded-[2.5rem] border-[6px] border-zinc-800 bg-black shadow-2xl">
      <div
        className="relative h-full w-full overflow-hidden rounded-[2.1rem]"
        style={{
          fontFamily: APP.font,
          background: APP.pageBg,
          color: APP.ink,
          ...style,
        }}
      >
        <div className="absolute left-1/2 top-2.5 z-30 h-[24px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex h-10 items-center justify-between px-6 pt-1 text-[12px] font-bold">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: APP.ink }}
            />
            <span
              className="h-2.5 w-5 rounded-[3px]"
              style={{ background: APP.ink }}
            />
          </span>
        </div>
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
        {overlay}
      </div>
    </div>
  </div>
);

/**
 * Right-hand pane of an editor dialog: title, view switcher, phone, caption.
 * Pass the current view's screen as `children`.
 */
export const PreviewPane = <T extends string>({
  views,
  view,
  onViewChange,
  children,
  overlay,
  className,
}: {
  views: { id: T; label: string; caption: string }[];
  view: T;
  onViewChange: (view: T) => void;
  children: ReactNode;
  overlay?: ReactNode;
  className?: string;
}): JSX.Element => {
  useAppFont();
  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-3 px-5 pr-12 pt-5">
        <div>
          <p className="text-sm font-semibold">In the app</p>
          <p className="text-xs text-muted-foreground">Updates as you type</p>
        </div>
        {views.length > 1 && (
          <Segmented
            value={view}
            onChange={onViewChange}
            options={views.map((v) => ({ id: v.id, label: v.label }))}
          />
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto px-5 py-4">
        <PhoneFrame overlay={overlay}>{children}</PhoneFrame>
      </div>
      <p className="px-5 pb-4 text-center text-xs text-muted-foreground">
        {views.find((v) => v.id === view)?.caption}
      </p>
    </div>
  );
};

/** Two-pane editor dialog body: scrolling form on the left, preview on the right (lg+). */
export const editorDialogClass =
  "flex h-[92vh] max-h-[92vh] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0";
export const editorGridClass =
  "grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]";
export const editorAsideClass =
  "hidden min-h-0 border-l bg-muted/30 lg:flex lg:flex-col";
