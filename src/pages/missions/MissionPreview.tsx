import {
  ArrowLeftIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/solid";
import {
  APP,
  Block,
  CoinIcon,
  PreviewPane,
  hairline,
} from "@/components/shared/app-preview";

/** The slice of the mission form the app renders (models/mission.dart). */
export interface MissionPreviewDraft {
  title: string;
  description: string;
  rewardCoins: number;
}

// ---------------------------------------------------------------------------
// Mission Board (mission_board_screen.dart): GameAppBar + a list of
// _MissionCard (GlowCard, padding 16, radius 18), 12dp apart.
// ---------------------------------------------------------------------------

/** GlyphTile: 42dp squircle, 1.5dp hairline ring around a lightBg well. */
const GlyphTile = (): JSX.Element => (
  <span
    className="flex h-[42px] w-[42px] shrink-0 rounded-[15px] p-[1.5px]"
    style={{ background: APP.hairline }}
  >
    <span
      className="flex flex-1 items-center justify-center rounded-[13.5px]"
      style={{ background: APP.artBg }}
    >
      <RocketLaunchIcon
        className="h-[22px] w-[22px]"
        style={{ color: APP.accent }}
      />
    </span>
  </span>
);

const MissionCard = ({ d }: { d: MissionPreviewDraft }): JSX.Element => (
  <div className="rounded-[18px] bg-white p-4" style={hairline}>
    <div className="flex items-start">
      <GlyphTile />
      <p
        className="ml-3 line-clamp-2 min-w-0 flex-1 text-[16px] font-bold leading-[1.35] tracking-[0.1px]"
        style={{ color: APP.ink }}
      >
        {d.title || "Mission title"}
      </p>
      {/* StatChip: white pill, hairline, coin glyph + "+coins" (coinsLabel: no grouping). */}
      <span
        className="ml-2 flex shrink-0 items-center rounded-full bg-white px-3 py-[7px]"
        style={hairline}
      >
        <CoinIcon size={15} />
        <span
          className="ml-[6px] text-[12.5px] font-bold leading-none"
          style={{ color: APP.ink }}
        >
          +{d.rewardCoins}
        </span>
      </span>
    </div>
    <p
      className="mt-[10px] line-clamp-3 text-[13px] font-medium leading-[1.35] tracking-[0.1px]"
      style={{ color: APP.muted }}
    >
      {d.description || "What the user must do to complete the mission."}
    </p>
    {/* GlowButton "Complete" — the not-yet-submitted state every user sees first. */}
    <div
      className="mt-[14px] flex h-[46px] items-center justify-center rounded-[14px]"
      style={{ background: APP.accent, color: APP.onAccent }}
    >
      <CheckCircleIcon className="h-5 w-5" />
      <span className="ml-2 text-[13px] font-semibold tracking-[0.1px]">
        Complete
      </span>
    </div>
  </div>
);

const GhostMissionCard = (): JSX.Element => (
  <div className="rounded-[18px] bg-white p-4" style={hairline}>
    <div className="flex items-start">
      <Block className="h-[42px] w-[42px] shrink-0 rounded-[15px]" />
      <div className="ml-3 flex-1 pt-1">
        <Block className="h-3 w-4/5" />
        <Block className="mt-2 h-3 w-1/2" />
      </div>
      <Block className="ml-2 h-[29px] w-14 rounded-full" />
    </div>
    <Block className="mt-[10px] h-2.5 w-full" />
    <Block className="mt-1.5 h-2.5 w-3/4" />
    <Block className="mt-[14px] h-[46px] rounded-[14px]" />
  </div>
);

const BoardScreen = ({ d }: { d: MissionPreviewDraft }): JSX.Element => (
  // GameBackground (light): white → #FCFBF9, top-left to bottom-right.
  <div
    className="min-h-full"
    style={{ background: "linear-gradient(135deg,#FFFFFF,#FCFBF9)" }}
  >
    {/* GameAppBar: 56dp, surface white, 38dp glass back button, titleLarge. */}
    <div className="flex h-14 items-center bg-white">
      <span
        className="ml-[10px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white"
        style={hairline}
      >
        <ArrowLeftIcon className="h-5 w-5" style={{ color: APP.ink }} />
      </span>
      <p
        className="ml-3 text-[22px] font-bold tracking-[-0.5px]"
        style={{ color: APP.ink }}
      >
        Mission Board
      </p>
    </div>
    <div className="space-y-3 px-4 pb-10 pt-[6px]">
      <MissionCard d={d} />
      <GhostMissionCard />
      <GhostMissionCard />
    </div>
  </div>
);

const VIEWS = [
  {
    id: "board",
    label: "Board",
    caption: "Mission Board — published missions, lowest sort order first.",
  },
];

export const MissionPreview = ({
  draft,
  className,
}: {
  draft: MissionPreviewDraft;
  className?: string;
}): JSX.Element => (
  <PreviewPane
    className={className}
    views={VIEWS}
    view="board"
    onViewChange={() => undefined}
  >
    <BoardScreen d={draft} />
  </PreviewPane>
);
