import {
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FireIcon,
  FlagIcon,
  GiftIcon,
  LightBulbIcon,
  LockClosedIcon,
  PlayCircleIcon,
  RocketLaunchIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import {
  APP,
  Block,
  CoinIcon,
  PreviewPane,
  hairline,
} from "@/components/shared/app-preview";
import { formatDate } from "@/utils/format";
import type { CampaignStatus } from "@/types/domain";

/** The slice of the campaign form the app renders (models/campaign.dart). */
export interface CampaignPreviewDraft {
  title: string;
  description: string;
  rewardAmount: number;
  /** Only decides the "Featured" ribbon; never shown as a number. */
  budget: number | null;
  startsAt: string | null;
  endsAt: string | null;
  /** Gates the claim CTA (Campaign.isOpen). */
  status: CampaignStatus;
  /** Drives the "NEW" ribbon; null = unsaved draft, treated as now. */
  createdAt: string | null;
}

export type CampaignPreviewView = "list" | "details";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// AppColors that stay dark even in the light theme (emblem tile, hero card).
const DARK_SURFACE = "#1A2635";
const HERO_TITLE = "#EDEFF2";
const HERO_SUBTITLE = "#98A0AB";
const DAY = 86_400_000;

/** Flutter formatCoins: 100.00 → "100", 1.20 → "1.2", 1.25 → "1.25" (no grouping). */
const coins = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");

const ms = (iso: string | null): number | null =>
  iso ? new Date(iso).getTime() : null;

/** Campaign.isOpen in the app. */
const isOpen = (d: CampaignPreviewDraft): boolean => {
  if (d.status !== "ACTIVE") return false;
  const now = Date.now();
  const starts = ms(d.startsAt);
  const ends = ms(d.endsAt);
  if (starts !== null && starts > now) return false;
  if (ends !== null && ends < now) return false;
  return true;
};

// ---------------------------------------------------------------------------
// Shared chrome: GameAppBar and the AppShell bottom nav (context only)
// ---------------------------------------------------------------------------

const AppBar = ({
  title,
  back,
}: {
  title: string;
  back?: boolean;
}): JSX.Element => (
  <div
    className={`flex h-14 items-center bg-white ${back ? "pl-[10px]" : "pl-4"}`}
  >
    {back && (
      <span
        className="mr-1 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white"
        style={hairline}
      >
        <ArrowLeftIcon className="h-5 w-5" style={{ color: APP.ink }} />
      </span>
    )}
    <p
      className="truncate text-[22px] font-bold"
      style={{ color: APP.ink, letterSpacing: -0.5 }}
    >
      {title}
    </p>
  </div>
);

/** AppShell tab bar; the Mission Board lives on the third tab. */
const BottomNav = (): JSX.Element => (
  <div
    className="bg-white px-4 pb-1 pt-[7px]"
    style={{ borderTop: `1px solid ${APP.hairline}` }}
  >
    <div className="grid h-[53px] grid-cols-5">
      {[0, 1, 2, 3, 4].map((tab) => (
        <span key={tab} className="relative flex flex-col items-center pt-1">
          {tab === 2 && (
            <span
              className="absolute left-1/2 top-0 h-[30px] w-[46px] -translate-x-1/2 rounded-xl"
              style={{ background: `${APP.accent}1A` }}
            />
          )}
          <Block className="relative h-[21px] w-[21px] rounded-md" />
          <Block className="mt-[5px] h-[9px] w-8 rounded" />
        </span>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Mission Board (campaign_list_screen.dart → widgets/campaign_card.dart)
// ---------------------------------------------------------------------------

type RibbonKind = "hot" | "fresh" | "limited" | "featured";

/** CampaignCard._ribbon, in priority order. */
const ribbonKind = (d: CampaignPreviewDraft): RibbonKind | null => {
  const now = Date.now();
  const ends = ms(d.endsAt);
  if (ends !== null && ends > now && ends - now < 7 * DAY) return "limited";
  if (now - (ms(d.createdAt) ?? now) < 7 * DAY) return "fresh";
  if (d.rewardAmount >= 100) return "hot";
  if (d.budget !== null) return "featured";
  return null;
};

const RIBBON: Record<
  RibbonKind,
  { label: string; background: string; Icon: Icon }
> = {
  hot: { label: "HOT", background: APP.danger, Icon: FireIcon },
  fresh: { label: "NEW", background: APP.success, Icon: SparklesIcon },
  limited: {
    label: "LIMITED",
    background: APP.accentGradient,
    Icon: ClockIcon,
  },
  featured: {
    label: "FEATURED",
    background: APP.accentGradient,
    Icon: StarIcon,
  },
};

const Ribbon = ({ kind }: { kind: RibbonKind }): JSX.Element => {
  const { label, background, Icon } = RIBBON[kind];
  return (
    <span
      className="flex shrink-0 items-center gap-[3px] rounded-full px-[9px] py-1 text-[10px] font-extrabold"
      style={{ background, color: APP.onAccent, letterSpacing: 0.8 }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

/** CampaignCard._timeElapsed: fraction of the window gone, in whole minutes. */
const elapsedFraction = (d: CampaignPreviewDraft): number | null => {
  const starts = ms(d.startsAt);
  const ends = ms(d.endsAt);
  if (starts === null || ends === null) return null;
  const total = Math.trunc((ends - starts) / 60_000);
  if (total <= 0) return null;
  const gone = Math.trunc((Date.now() - starts) / 60_000);
  return Math.min(1, Math.max(0, gone / total));
};

/** 52dp CircularProgressIndicator, stroke 3, clockwise from the top. */
const UrgencyRing = ({ value }: { value: number }): JSX.Element => {
  const r = 24.5;
  const c = 2 * Math.PI * r;
  return (
    <svg
      className="absolute inset-0 -rotate-90"
      width={52}
      height={52}
      viewBox="0 0 52 52"
      aria-hidden
    >
      <circle
        cx={26}
        cy={26}
        r={r}
        fill="none"
        stroke={APP.hairline}
        strokeWidth={3}
      />
      <circle
        cx={26}
        cy={26}
        r={r}
        fill="none"
        stroke={value > 0.75 ? APP.danger : APP.accent}
        strokeWidth={3}
        strokeDasharray={`${c * value} ${c}`}
      />
    </svg>
  );
};

const MissionCard = ({ d }: { d: CampaignPreviewDraft }): JSX.Element => {
  const kind = ribbonKind(d);
  const elapsed = elapsedFraction(d);
  return (
    <div className="rounded-[18px] bg-white p-4" style={hairline}>
      <div className="flex items-start gap-3">
        <span className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
          {elapsed !== null && <UrgencyRing value={elapsed} />}
          <span
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[13px]"
            style={{
              background: DARK_SURFACE,
              border: `1px solid ${APP.hairline}`,
            }}
          >
            <RocketLaunchIcon
              className="h-[22px] w-[22px]"
              style={{ color: APP.accent }}
            />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className="min-w-0 flex-1 truncate text-[16px] font-extrabold"
              style={{ color: APP.ink, letterSpacing: 0.1 }}
            >
              {d.title || "Campaign title"}
            </p>
            {kind && <Ribbon kind={kind} />}
          </div>
          <p
            className="mt-1 line-clamp-2 text-[13px] font-medium leading-[1.35]"
            style={{ color: APP.muted, letterSpacing: 0.1 }}
          >
            {d.description || "What users must do to earn the reward."}
          </p>
        </div>
      </div>
      <div className="mt-[14px] flex items-center">
        <span
          className="flex items-center gap-[5px] rounded-full bg-white px-[11px] py-[6px]"
          style={hairline}
        >
          <CoinIcon size={15} />
          <span
            className="text-[13px] font-extrabold"
            style={{ color: APP.ink }}
          >
            {coins(d.rewardAmount)}
          </span>
        </span>
        <span className="flex-1" />
        {d.endsAt && (
          <span
            className="text-[13px] font-medium"
            style={{ color: APP.muted }}
          >
            Ends {formatDate(d.endsAt)}
          </span>
        )}
        <ChevronRightIcon
          className="ml-[6px] h-[21px] w-[21px] shrink-0"
          style={{ color: APP.accent }}
        />
      </div>
    </div>
  );
};

const GhostMissionCard = (): JSX.Element => (
  <div className="rounded-[18px] bg-white p-4" style={hairline}>
    <div className="flex items-start gap-3">
      <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center">
        <Block className="h-[42px] w-[42px] rounded-[13px]" />
      </span>
      <div className="flex-1">
        <Block className="h-3.5 w-2/3" />
        <Block className="mt-2 h-2.5 w-full" />
        <Block className="mt-1.5 h-2.5 w-4/5" />
      </div>
    </div>
    <div className="mt-[14px] flex items-center justify-between">
      <Block className="h-7 w-16 rounded-full" />
      <Block className="h-2.5 w-24" />
    </div>
  </div>
);

const ListScreen = ({ d }: { d: CampaignPreviewDraft }): JSX.Element => (
  <>
    <AppBar title="Mission Board" />
    <div className="space-y-3 px-4 pb-[104px] pt-2">
      <MissionCard d={d} />
      <GhostMissionCard />
      <GhostMissionCard />
    </div>
  </>
);

// ---------------------------------------------------------------------------
// Mission page (campaign_detail_screen.dart)
// ---------------------------------------------------------------------------

const SectionHeader = ({
  title,
  Icon,
}: {
  title: string;
  Icon: Icon;
}): JSX.Element => (
  <div className="flex items-center">
    <span
      className="h-3 w-[3px] shrink-0 rounded-[2px]"
      style={{ background: APP.accent }}
    />
    <Icon className="ml-2 h-4 w-4 shrink-0" style={{ color: APP.accent }} />
    <p
      className="ml-[6px] truncate text-[13px] font-semibold"
      style={{ color: APP.muted, letterSpacing: 0.2 }}
    >
      {title}
    </p>
  </div>
);

const GlowCard = ({
  className = "p-[14px]",
  children,
}: {
  className?: string;
  children: ReactNode;
}): JSX.Element => (
  <div className={`rounded-[18px] bg-white ${className}`} style={hairline}>
    {children}
  </div>
);

const TimelineRow = ({
  Icon,
  color,
  label,
  value,
  done = false,
}: {
  Icon: Icon;
  color: string;
  label: string;
  value: string;
  done?: boolean;
}): JSX.Element => (
  <div className="flex items-center">
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{ background: `${color}26`, border: `1px solid ${color}80` }}
    >
      {done ? (
        <CheckIcon className="h-4 w-4" style={{ color }} />
      ) : (
        <Icon className="h-4 w-4" style={{ color }} />
      )}
    </span>
    <p
      className="ml-3 line-clamp-2 flex-1 text-[15px] font-semibold"
      style={{ color: APP.ink }}
    >
      {label}
    </p>
    <p
      className="ml-2 truncate text-[13px] font-bold"
      style={{ color: APP.muted }}
    >
      {value}
    </p>
  </div>
);

const TimelineConnector = (): JSX.Element => (
  <span
    className="ml-[15px] block h-[14px] w-[2px]"
    style={{ background: APP.hairline }}
  />
);

const TIPS = [
  "Capture the full screen — cropped proofs get rejected.",
  "One claim per mission; make your submission count.",
  "Rewards land in your vault the moment a reviewer approves.",
];

const DetailsScreen = ({ d }: { d: CampaignPreviewDraft }): JSX.Element => {
  const starts = ms(d.startsAt);
  return (
    <>
      <AppBar title="Mission" back />
      <div className="px-4 pb-[180px] pt-2">
        {/* HeroBanner: the treasure-chest PNG (gfx_4) isn't bundled here — warm stand-in. */}
        <div
          className="relative aspect-video overflow-hidden rounded-[24px]"
          style={{
            background: DARK_SURFACE,
            border: `1px solid ${APP.hairline}`,
            boxShadow: "0 3px 12px rgba(0,0,0,0.024)",
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FFF3E6,#F2ECE3)" }}
          >
            <GiftIcon
              className="h-16 w-16"
              style={{ color: `${APP.accent}59` }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,transparent 50%,rgba(10,14,23,0.85) 100%)",
            }}
          />
          <div className="absolute inset-x-4 bottom-[14px]">
            <p
              className="truncate text-[22px] font-bold italic"
              style={{ color: HERO_TITLE, letterSpacing: -0.5 }}
            >
              {d.title || "Campaign title"}
            </p>
            {d.endsAt && (
              <p
                className="mt-[3px] line-clamp-2 text-[13px] font-medium"
                style={{ color: HERO_SUBTITLE }}
              >
                Ends {formatDate(d.endsAt)}
              </p>
            )}
          </div>
          <span
            className="absolute right-[10px] top-[10px] flex items-center gap-[6px] rounded-full bg-white px-3 py-[7px]"
            style={hairline}
          >
            <CoinIcon size={15} />
            <span
              className="text-[12.5px] font-bold"
              style={{ color: APP.ink }}
            >
              {coins(d.rewardAmount)}
            </span>
          </span>
        </div>

        <GlowCard className="mt-4 flex items-center gap-[10px] px-4 py-[14px]">
          <CoinIcon size={28} />
          <span className="text-[24px] font-bold" style={{ color: APP.ink }}>
            {coins(d.rewardAmount)}
          </span>
        </GlowCard>

        <div className="mt-[18px]">
          <SectionHeader title="Mission briefing" Icon={BookOpenIcon} />
        </div>
        <GlowCard className="mt-[10px] p-[14px]">
          <p
            className="whitespace-pre-line text-[16px] font-medium leading-[1.5]"
            style={{
              color: d.description ? APP.ink : APP.muted,
              letterSpacing: 0.1,
            }}
          >
            {d.description || "The full description appears here."}
          </p>
        </GlowCard>

        <div className="mt-[18px]">
          <SectionHeader title="Mission timeline" Icon={ChartBarIcon} />
        </div>
        <GlowCard className="mt-[10px] p-[14px]">
          <TimelineRow
            Icon={PlayCircleIcon}
            color={APP.success}
            label="Mission opens"
            value={formatDate(d.startsAt)}
            done={starts !== null && starts < Date.now()}
          />
          <TimelineConnector />
          <TimelineRow
            Icon={ArrowUpTrayIcon}
            color={APP.accent}
            label="Submit your proof"
            value="Screenshot + note"
          />
          <TimelineConnector />
          <TimelineRow
            Icon={TrophyIcon}
            color={APP.coin}
            label="Treasure credited on approval"
            value={`${coins(d.rewardAmount)} coins`}
          />
          <TimelineConnector />
          <TimelineRow
            Icon={FlagIcon}
            color={APP.danger}
            label="Mission closes"
            value={formatDate(d.endsAt)}
          />
        </GlowCard>

        <div className="mt-[18px]">
          <SectionHeader title="Pro tips" Icon={LightBulbIcon} />
        </div>
        <GlowCard className="mt-[10px] space-y-2 p-[14px]">
          {TIPS.map((tip) => (
            <p
              key={tip}
              className="flex items-start gap-2 text-[13px] font-medium leading-[1.4]"
              style={{ color: APP.ink }}
            >
              <StarIcon
                className="mt-px h-4 w-4 shrink-0"
                style={{ color: APP.accent }}
              />
              {tip}
            </p>
          ))}
        </GlowCard>
      </div>
    </>
  );
};

/** _StickyCta (Scaffold.bottomNavigationBar) sitting on the AppShell tab bar. */
const StickyCta = ({ open }: { open: boolean }): JSX.Element => (
  <div className="absolute inset-x-0 bottom-0">
    <div className="px-4 pb-3 pt-2" style={{ background: APP.pageBg }}>
      <div
        className="flex h-[46px] items-center justify-center gap-2 rounded-[14px] text-[13px] font-semibold"
        style={{
          background: open ? APP.accent : APP.hairline,
          color: APP.onAccent,
        }}
      >
        {open ? (
          <RocketLaunchIcon className="h-5 w-5" />
        ) : (
          <LockClosedIcon className="h-5 w-5" />
        )}
        {open ? "Accept Mission" : "Mission Not Open"}
      </div>
      <p
        className="mt-2 truncate text-center text-[13px] font-medium"
        style={{ color: APP.muted }}
      >
        You&apos;ll attach a screenshot as proof in the next step.
      </p>
    </div>
    <BottomNav />
  </div>
);

// ---------------------------------------------------------------------------
// Pane
// ---------------------------------------------------------------------------

const VIEWS: { id: CampaignPreviewView; label: string; caption: string }[] = [
  {
    id: "list",
    label: "List",
    caption: "Mission Board — every active campaign as a quest card.",
  },
  {
    id: "details",
    label: "Details",
    caption: "Mission page — opens from the card; the claim CTA is pinned.",
  },
];

export const CampaignPreview = ({
  draft,
  className,
}: {
  draft: CampaignPreviewDraft;
  className?: string;
}): JSX.Element => {
  const [view, setView] = useState<CampaignPreviewView>("list");
  return (
    <PreviewPane
      className={className}
      views={VIEWS}
      view={view}
      onViewChange={setView}
      overlay={
        view === "details" ? (
          <StickyCta open={isOpen(draft)} />
        ) : (
          <div className="absolute inset-x-0 bottom-0">
            <BottomNav />
          </div>
        )
      }
    >
      {view === "list" ? <ListScreen d={draft} /> : <DetailsScreen d={draft} />}
    </PreviewPane>
  );
};
