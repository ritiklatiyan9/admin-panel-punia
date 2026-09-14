import { useState } from "react";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { MegaphoneIcon, TrophyIcon } from "@heroicons/react/24/solid";
import {
  APP,
  Artwork,
  Block,
  CoinIcon,
  PreviewPane,
  hairline,
} from "@/components/shared/app-preview";
import type { NotificationType, PushAudience } from "@/types/domain";

/** The slice of the composer the device and the app inbox actually render. */
export interface PushPreviewDraft {
  audience: PushAudience;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string;
  route: string;
  silent: boolean;
}

export type PushPreviewView = "lock" | "inbox";

const TITLE_PLACEHOLDER = "Notification title";
const BODY_PLACEHOLDER = "Your message appears here as you type…";

// ---------------------------------------------------------------------------
// Lock screen — Android notification shade, on the app's light palette
// ---------------------------------------------------------------------------

const ShadeCard = ({ d }: { d: PushPreviewDraft }): JSX.Element => (
  <div
    className="rounded-[24px] bg-white p-4"
    style={{ ...hairline, boxShadow: "0 8px 24px rgba(36,35,32,0.08)" }}
  >
    <div
      className="flex items-center gap-2 text-[11px]"
      style={{ color: APP.soft }}
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-extrabold"
        style={{ background: APP.accentGradient, color: APP.onAccent }}
      >
        M
      </span>
      <span className="font-semibold" style={{ color: APP.ink }}>
        Money Marathon
      </span>
      <span>· now</span>
      <ChevronDownIcon className="ml-auto h-3.5 w-3.5" />
    </div>
    <p
      className="mt-2 text-[14px] font-bold leading-snug"
      style={{ color: d.title ? APP.ink : APP.muted }}
    >
      {d.title || TITLE_PLACEHOLDER}
    </p>
    <p
      className="mt-0.5 line-clamp-4 text-[13px] leading-[1.4]"
      style={{ color: d.body ? APP.soft : APP.muted }}
    >
      {d.body || BODY_PLACEHOLDER}
    </p>
    {d.imageUrl && (
      <div
        className="mt-3 aspect-video overflow-hidden rounded-2xl"
        style={{ background: APP.wash }}
      >
        <Artwork
          sources={[d.imageUrl]}
          fit="cover"
          fallback={
            <div
              className="flex h-full items-center justify-center text-[11px]"
              style={{ color: APP.muted }}
            >
              Image couldn’t load
            </div>
          }
        />
      </div>
    )}
    {d.route && (
      <p
        className="mt-3 border-t pt-2 text-[11px] font-semibold"
        style={{ borderColor: APP.hairline, color: APP.accent }}
      >
        Tap opens {d.route}
      </p>
    )}
  </div>
);

const GhostShadeCard = (): JSX.Element => (
  <div className="rounded-[24px] bg-white/70 p-4" style={hairline}>
    <div className="flex items-center gap-2">
      <Block className="h-5 w-5 rounded-md" />
      <Block className="h-2.5 w-24" />
    </div>
    <Block className="mt-3 h-3 w-3/5" />
    <Block className="mt-2 h-2.5 w-4/5" />
  </div>
);

const LockScreen = ({ d }: { d: PushPreviewDraft }): JSX.Element => (
  <div
    className="min-h-full px-3 pb-8 pt-8"
    style={{ background: "linear-gradient(180deg,#F6F5F3,#ECE9E4)" }}
  >
    <p
      className="text-center text-[56px] font-extrabold leading-none tracking-tight"
      style={{ color: APP.ink }}
    >
      9:41
    </p>
    <p
      className="mt-1 text-center text-[12px] font-semibold"
      style={{ color: APP.soft }}
    >
      {new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
    </p>
    <div className="mt-8 space-y-2">
      {d.silent ? (
        <p
          className="rounded-[24px] px-4 py-6 text-center text-[12px]"
          style={{ ...hairline, color: APP.muted }}
        >
          Silent push — nothing is shown on the device. The app only receives
          the data payload.
        </p>
      ) : (
        <ShadeCard d={d} />
      )}
      <GhostShadeCard />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Inbox — notifications_screen.dart (tile + _NotificationArtwork + GlyphTile)
// ---------------------------------------------------------------------------

const spark = (cx: number, cy: number, r: number): string =>
  `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;

/** gem_icons.dart SparkleIcon: a main four-point spark plus a small one top-right. */
const SparkleIcon = (): JSX.Element => (
  <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
    <path d={spark(8.8, 11.2, 8.4)} fill={APP.accent} />
    <path d={spark(16, 4, 3.2)} fill={APP.accent} opacity={0.85} />
  </svg>
);

/** _glyphFor(type) in the app. */
const GLYPH: Record<NotificationType, JSX.Element> = {
  WALLET: <CoinIcon size={22} />,
  CLAIM: (
    <TrophyIcon className="h-[22px] w-[22px]" style={{ color: APP.coin }} />
  ),
  CAMPAIGN: (
    <MegaphoneIcon
      className="h-[22px] w-[22px]"
      style={{ color: APP.accent }}
    />
  ),
  SYSTEM: <SparkleIcon />,
};

/** GlyphTile: squircle behind a glyph; unread swaps the hairline for a faint accent ring. */
const GlyphTile = ({
  ringed,
  size = 46,
  children,
}: {
  ringed: boolean;
  size?: number;
  children: JSX.Element;
}): JSX.Element => (
  <div
    className="shrink-0 rounded-[15px] p-[1.5px]"
    style={{
      width: size,
      height: size,
      background: ringed
        ? `linear-gradient(135deg,${APP.accent}8C,${APP.accent}38)`
        : APP.hairline,
    }}
  >
    <div
      className="flex h-full w-full items-center justify-center rounded-[13.5px]"
      style={{ background: "#FAF9F7" }}
    >
      {children}
    </div>
  </div>
);

const TileArt = ({
  d,
  unread,
}: {
  d: PushPreviewDraft;
  unread: boolean;
}): JSX.Element => {
  const glyph = GLYPH[d.type];
  if (!d.imageUrl.trim()) return <GlyphTile ringed={unread}>{glyph}</GlyphTile>;
  return (
    <div
      className="h-[46px] w-[46px] shrink-0 rounded-[15px] p-[1.5px]"
      style={{ background: unread ? `${APP.accent}61` : APP.hairline }}
    >
      <Artwork
        sources={[d.imageUrl]}
        fit="cover"
        className="rounded-[13.5px]"
        fallback={
          <GlyphTile ringed={unread} size={43}>
            {glyph}
          </GlyphTile>
        }
      />
    </div>
  );
};

const InboxTile = ({ d }: { d: PushPreviewDraft }): JSX.Element => (
  <div
    className="flex items-start rounded-[18px] px-[18px] py-[14px]"
    style={{
      background: `${APP.accent}11`,
      border: `1px solid ${APP.accent}47`,
    }}
  >
    <TileArt d={d} unread />
    <div className="ml-3 min-w-0 flex-1">
      <div className="flex items-start">
        <p
          className="line-clamp-2 flex-1 text-[14px] font-extrabold leading-snug"
          style={{ color: d.title ? APP.ink : APP.muted }}
        >
          {d.title || TITLE_PLACEHOLDER}
        </p>
        <span
          className="ml-2 shrink-0 text-[10.5px] font-medium"
          style={{ color: APP.muted }}
        >
          9:41 AM
        </span>
      </div>
      <p
        className="mt-1 line-clamp-3 text-[13px] font-medium leading-[1.4]"
        style={{ color: d.body ? APP.soft : APP.muted }}
      >
        {d.body || BODY_PLACEHOLDER}
      </p>
    </div>
    <span
      className="ml-[9px] mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full"
      style={{ background: APP.accent }}
    />
  </div>
);

const GhostTile = (): JSX.Element => (
  <div
    className="flex items-start rounded-[18px] bg-white px-[18px] py-[14px]"
    style={hairline}
  >
    <Block className="h-[46px] w-[46px] rounded-[15px]" />
    <div className="ml-3 flex-1">
      <Block className="h-3 w-3/5" />
      <Block className="mt-2 h-2.5 w-full" />
      <Block className="mt-1.5 h-2.5 w-2/3" />
    </div>
  </div>
);

const InboxScreen = ({ d }: { d: PushPreviewDraft }): JSX.Element => {
  // Topic sends are push-only and silent pushes are data-only: neither writes an inbox row.
  const hasRow = !d.silent && d.audience !== "topic";
  return (
    <div className="pb-10">
      <div className="flex h-14 items-center gap-2 bg-white px-2.5">
        <span
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white"
          style={hairline}
        >
          <ArrowLeftIcon className="h-5 w-5" style={{ color: APP.ink }} />
        </span>
        <p
          className="text-[22px] font-bold tracking-[-0.5px]"
          style={{ color: APP.ink }}
        >
          Notifications
        </p>
      </div>

      <div
        className="mx-4 mb-3 mt-2 rounded-[20px] bg-white pb-[10px] pl-[14px] pr-[10px] pt-3"
        style={hairline}
      >
        <div className="flex items-center">
          <div className="min-w-0 flex-1">
            <p
              className="text-[14px] font-extrabold"
              style={{ color: APP.ink }}
            >
              {hasRow ? "1 unread" : "You’re all caught up"}
            </p>
            <p
              className="truncate text-[13px] font-medium"
              style={{ color: APP.muted }}
            >
              Updates, rewards and account activity
            </p>
          </div>
          <span
            className="flex items-center gap-1 px-2 text-[13px] font-semibold"
            style={{ color: hasRow ? APP.accent : APP.muted }}
          >
            <CheckIcon className="h-4 w-4" /> Read all
          </span>
        </div>
        <div
          className="mt-2.5 flex gap-1 rounded-[14px] p-[3px]"
          style={{ ...hairline, background: "#FAF9F7" }}
        >
          <span
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-white py-2.5 text-[12px] font-extrabold"
            style={{ color: APP.ink }}
          >
            <InboxIcon className="h-4 w-4" style={{ color: APP.accent }} /> All
          </span>
          <span
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold"
            style={{ color: APP.muted }}
          >
            <EnvelopeIcon className="h-4 w-4" />{" "}
            {hasRow ? "Unread (1)" : "Unread"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 px-4">
        <p
          className="px-1 pb-0.5 text-[14px] font-semibold tracking-[0.6px]"
          style={{ color: APP.muted }}
        >
          Today
        </p>
        {hasRow ? (
          <InboxTile d={d} />
        ) : (
          <p
            className="rounded-[18px] px-4 py-3 text-center text-[12px]"
            style={{ ...hairline, color: APP.muted }}
          >
            {d.silent ? "Silent pushes" : "Topic sends"} create no inbox row.
          </p>
        )}
        <GhostTile />
        <GhostTile />
        <GhostTile />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pane
// ---------------------------------------------------------------------------

const VIEWS: { id: PushPreviewView; label: string; caption: string }[] = [
  {
    id: "lock",
    label: "Lock screen",
    caption: "Android notification shade — what lands on the device.",
  },
  {
    id: "inbox",
    label: "Inbox",
    caption:
      "The app’s Notifications screen. Topic and silent sends add no row here.",
  },
];

export const PushPreview = ({
  draft,
  className,
}: {
  draft: PushPreviewDraft;
  className?: string;
}): JSX.Element => {
  const [view, setView] = useState<PushPreviewView>("lock");
  return (
    <PreviewPane
      className={className}
      views={VIEWS}
      view={view}
      onViewChange={setView}
    >
      {view === "lock" ? <LockScreen d={draft} /> : <InboxScreen d={draft} />}
    </PreviewPane>
  );
};
