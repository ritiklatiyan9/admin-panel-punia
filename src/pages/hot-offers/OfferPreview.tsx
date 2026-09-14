import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  FireIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
  ShoppingBagIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import {
  APP,
  Artwork,
  Block,
  CoinIcon,
  PreviewPane,
  hairline,
} from "@/components/shared/app-preview";
import { cn } from "@/utils/cn";
import { formatCoins } from "@/utils/format";
import type { OfferDifficulty } from "@/types/domain";

// Re-exported for callers that only need the artwork helper.
export { Artwork } from "@/components/shared/app-preview";

/** The slice of the offer form the app and website actually render. */
export interface OfferPreviewDraft {
  title: string;
  appName: string;
  categoryTitle: string;
  description: string;
  features: string[];
  instructions: string[];
  requirements: string[];
  terms: string;
  warning: string;
  rewardAmount: number;
  rewardCoins: number;
  rewardLabel: string;
  difficulty: OfferDifficulty;
  estimatedTime: string;
  rating: number | null;
  logoUrl: string;
  thumbnailUrl: string;
  bannerUrl: string;
  brandLogoUrl: string;
  featured: boolean;
  trending: boolean;
  isProduct: boolean;
}

export type PreviewView = "home" | "explore" | "details";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** GameOffer.coins in the app: display coins win when set, else the credited amount. */
const appCoins = (d: OfferPreviewDraft): number =>
  d.rewardCoins > 0 ? d.rewardCoins : d.rewardAmount;

// ---------------------------------------------------------------------------
// Home → "App offers" rail (home_screen.dart _ProductCard, 155×182)
// ---------------------------------------------------------------------------

const ProductCard = ({ d }: { d: OfferPreviewDraft }): JSX.Element => (
  <div
    className="flex h-[182px] w-[155px] shrink-0 flex-col rounded-[15px] bg-white p-[9px]"
    style={{ border: `1.2px solid ${APP.hairline}` }}
  >
    <div
      className="h-[91px] shrink-0 overflow-hidden rounded-[15px] p-[9px]"
      style={{ background: APP.wash }}
    >
      <Artwork
        sources={[d.thumbnailUrl, d.brandLogoUrl, d.logoUrl]}
        fallback={
          <div className="flex h-full items-center justify-center">
            <ShoppingBagIcon className="h-7 w-7" style={{ color: "#7B7772" }} />
          </div>
        }
      />
    </div>
    <p
      className="mt-2 line-clamp-2 text-[12px] font-bold leading-[1.4]"
      style={{ color: APP.ink }}
    >
      {d.title || "Offer title"}
    </p>
    <div className="mb-2 mt-auto flex items-center gap-[5px]">
      <span
        className="h-[11px] w-[11px] shrink-0 rounded-full"
        style={{ background: APP.accent }}
      />
      <span
        className="flex-1 truncate text-[10px] font-bold"
        style={{ color: APP.accent }}
      >
        +{compact.format(appCoins(d))} coins
      </span>
      <ArrowUpRightIcon
        className="h-[13px] w-[13px] shrink-0"
        style={{ color: "#7B7772" }}
      />
    </div>
  </div>
);

const GhostProductCard = (): JSX.Element => (
  <div
    className="flex h-[182px] w-[155px] shrink-0 flex-col rounded-[15px] bg-white p-[9px]"
    style={{ border: `1.2px solid ${APP.hairline}` }}
  >
    <Block className="h-[91px] rounded-[15px]" />
    <Block className="mt-3 h-2.5 w-24" />
    <Block className="mt-1.5 h-2.5 w-16" />
    <Block className="mb-2 mt-auto h-2.5 w-20" />
  </div>
);

const HomeScreen = ({ d }: { d: OfferPreviewDraft }): JSX.Element => (
  <div className="px-4 pb-10 pt-2">
    {/* Everything above the rail is context: header, Feedback Zone hero, earn tiles. */}
    <div className="flex items-center gap-3">
      <Block className="h-11 w-11 rounded-full" />
      <div className="flex-1">
        <Block className="h-2.5 w-20" />
        <Block className="mt-1.5 h-3.5 w-32" />
      </div>
      <Block className="h-10 w-10 rounded-full" />
    </div>
    <div
      className="mt-4 h-[140px] rounded-[18px]"
      style={{
        background: "linear-gradient(90deg,#FFF8EE,#FFEAD6)",
        border: "1.2px solid #E1CDB9",
      }}
    />
    <div className="mt-3 grid grid-cols-2 gap-3">
      <Block className="h-[84px] rounded-[18px]" />
      <Block className="h-[84px] rounded-[18px]" />
    </div>

    <div className="mt-6 flex items-end justify-between">
      <p className="text-[16px] font-extrabold" style={{ color: APP.ink }}>
        App offers
      </p>
      <span className="text-[11px] font-bold" style={{ color: APP.accent }}>
        All offers
      </span>
    </div>
    <div className="mt-3 flex gap-3 overflow-hidden">
      <ProductCard d={d} />
      <GhostProductCard />
      <GhostProductCard />
    </div>

    <Block className="mt-6 h-3.5 w-28" />
    <Block className="mt-3 h-[120px] rounded-[18px]" />
  </div>
);

// ---------------------------------------------------------------------------
// Explore grid (games_screen.dart _GameCard, two per row, 16:9 art)
// ---------------------------------------------------------------------------

const DIFFICULTY: Record<OfferDifficulty, { color: string; label: string }> = {
  EASY: { color: APP.success, label: "Easy" },
  MEDIUM: { color: APP.accent, label: "Medium" },
  HARD: { color: APP.danger, label: "Hard" },
};

const Ribbon = ({
  label,
  icon,
  style,
}: {
  label: string;
  icon: ReactNode;
  style: CSSProperties;
}): JSX.Element => (
  <span
    className="absolute left-2 top-2 flex items-center gap-[3px] rounded-full px-[9px] py-1 text-[10px] font-extrabold tracking-[0.08em]"
    style={{ color: APP.onAccent, ...style }}
  >
    {icon}
    {label}
  </span>
);

const GameCard = ({ d }: { d: OfferPreviewDraft }): JSX.Element => {
  const coins = appCoins(d);
  const difficulty = DIFFICULTY[d.difficulty];
  // A thumbnail is photo-like and covers the frame; a bare logo is contained.
  const photoLike = d.thumbnailUrl.trim() !== "";
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[18px] bg-white"
      style={{ ...hairline, boxShadow: "0 3px 12px rgba(0,0,0,0.024)" }}
    >
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: APP.artBg }}
      >
        <div className={cn("h-full w-full", !photoLike && "p-[14px]")}>
          <Artwork
            sources={[d.thumbnailUrl, d.logoUrl]}
            fit={photoLike ? "cover" : "contain"}
            fallback={
              <div className="flex h-full items-center justify-center">
                <span
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl"
                  style={{
                    background: `${APP.accent}1A`,
                    border: `1px solid ${APP.accent}59`,
                  }}
                >
                  <PuzzlePieceIcon
                    className="h-[22px] w-[22px]"
                    style={{ color: APP.accent }}
                  />
                </span>
              </div>
            }
          />
        </div>
        {d.trending ? (
          <Ribbon
            label="HOT"
            icon={<FireIcon className="h-3 w-3" />}
            style={{ background: APP.danger }}
          />
        ) : d.featured ? (
          <Ribbon
            label="FEATURED"
            icon={<StarIcon className="h-3 w-3" />}
            style={{ background: APP.accentGradient }}
          />
        ) : null}
        <span
          className="absolute bottom-2 right-2 flex items-center gap-[5px] rounded-full px-2 py-1"
          style={{ background: "rgba(10,14,23,0.9)" }}
        >
          <CoinIcon size={13} />
          <span
            className="text-[12px] font-bold leading-none"
            style={{ color: APP.accent }}
          >
            {formatCoins(coins)}
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col px-[10px] pb-[10px] pt-2">
        <p
          className="line-clamp-2 min-h-[34px] text-[13.5px] font-bold leading-[1.25]"
          style={{ color: APP.ink }}
        >
          {d.title || "Offer title"}
        </p>
        <span
          className="mt-1.5 self-start rounded-full px-2 py-[3px] text-[10px] font-bold leading-[1.2]"
          style={{
            color: difficulty.color,
            background: `${difficulty.color}24`,
            border: `1px solid ${difficulty.color}73`,
          }}
        >
          {difficulty.label}
        </span>
        <div className="mt-auto pt-2">
          <span
            className="flex h-9 items-center justify-center gap-[5px] rounded-[14px] text-[13px] font-semibold"
            style={{ background: APP.accent, color: APP.onAccent }}
          >
            Start
            {coins > 0 && (
              <>
                <CoinIcon size={13} />
                <span className="text-[12px] font-bold">
                  {formatCoins(coins)}
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

const GhostGameCard = (): JSX.Element => (
  <div
    className="flex flex-col overflow-hidden rounded-[18px] bg-white"
    style={hairline}
  >
    <div className="aspect-video" style={{ background: APP.artBg }} />
    <div className="px-[10px] pb-[10px] pt-2">
      <Block className="h-3 w-4/5" />
      <Block className="mt-1.5 h-3 w-1/2" />
      <Block className="mt-3 h-[18px] w-12 rounded-full" />
      <Block className="mt-3 h-9 rounded-[14px]" />
    </div>
  </div>
);

const ExploreScreen = ({ d }: { d: OfferPreviewDraft }): JSX.Element => (
  <div className="px-4 pb-10 pt-2">
    <div className="flex items-center gap-2">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        style={hairline}
      >
        <ChevronLeftIcon className="h-4 w-4" style={{ color: APP.ink }} />
      </span>
      <div>
        <p
          className="text-[18px] font-extrabold leading-tight"
          style={{ color: APP.ink }}
        >
          Explore
        </p>
        <p className="text-[10px]" style={{ color: APP.muted }}>
          Fresh offers. Clear steps. Something for you.
        </p>
      </div>
    </div>
    <div
      className="mt-3 flex items-center gap-2 rounded-[14px] bg-white px-3 py-2.5"
      style={hairline}
    >
      <MagnifyingGlassIcon className="h-4 w-4" style={{ color: APP.muted }} />
      <span className="text-[11px]" style={{ color: APP.muted }}>
        Search offers
      </span>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <GameCard d={d} />
      <GhostGameCard />
      <GhostGameCard />
      <GhostGameCard />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Offer page (prithvi-web OfferDetailsPage, opened inside the app's Web Zone)
// ---------------------------------------------------------------------------

const WebCard = ({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}): JSX.Element => (
  <div
    className={cn("rounded-[18px] bg-white", className)}
    style={{ ...hairline, ...style }}
  >
    {children}
  </div>
);

const DetailsScreen = ({ d }: { d: OfferPreviewDraft }): JSX.Element => {
  const initial = d.title.trim().charAt(0).toUpperCase() || "M";
  const artFallback = (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: "linear-gradient(135deg,#fff3e6,#f2ece3)" }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 text-3xl font-extrabold"
        style={{ border: "1px solid #d9cbbb", color: APP.accent }}
      >
        {initial}
      </span>
    </div>
  );

  return (
    <div className="px-4 pb-32 pt-4">
      <p className="text-sm font-semibold" style={{ color: APP.soft }}>
        ← All offers
      </p>

      <WebCard className="mt-3 h-52 overflow-hidden">
        <Artwork
          sources={[d.bannerUrl, d.thumbnailUrl, d.logoUrl]}
          fallback={artFallback}
        />
      </WebCard>

      <WebCard className="relative z-10 -mt-5 mx-2 p-4">
        <div className="flex items-center gap-3">
          {d.logoUrl && (
            <img
              src={d.logoUrl}
              alt=""
              className="h-12 w-12 rounded-2xl object-cover"
              style={hairline}
            />
          )}
          <div className="min-w-0 flex-1">
            <h1
              className="text-xl font-extrabold leading-snug"
              style={{ color: APP.ink }}
            >
              {d.title || "Offer title"}
            </h1>
            <p className="truncate text-xs" style={{ color: APP.soft }}>
              {d.appName || d.categoryTitle || "Category"}
              {d.rating != null && (
                <span className="ml-2">★ {d.rating.toFixed(1)}</span>
              )}
            </p>
          </div>
        </div>
        {d.brandLogoUrl && (
          <div
            className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3"
            style={{ ...hairline, background: `${APP.surfaceAlt}CC` }}
          >
            <img
              src={d.brandLogoUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full bg-white object-contain p-0.5"
              style={hairline}
            />
            <span
              className="truncate text-xs font-semibold"
              style={{ color: APP.ink }}
            >
              {d.appName || d.title || "Brand"}
            </span>
          </div>
        )}
        <div
          className="mt-3 flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ ...hairline, background: APP.surfaceAlt }}
        >
          <CoinIcon size={26} />
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold" style={{ color: APP.accent }}>
              +{d.rewardLabel || d.rewardAmount}
            </p>
            <p className="text-xs" style={{ color: APP.soft }}>
              Reward for completing this offer
              {d.estimatedTime ? ` · ~${d.estimatedTime}` : ""}
            </p>
          </div>
        </div>
      </WebCard>

      <WebCard className="mt-4 p-4">
        <p className="text-sm font-bold" style={{ color: APP.ink }}>
          Proof of completion
        </p>
        <div
          className="mt-3 rounded-xl py-3 text-center text-sm font-semibold"
          style={{ background: APP.accent, color: APP.onAccent }}
        >
          Upload proof
        </div>
      </WebCard>

      <section className="mt-6 space-y-5">
        <div>
          <h2 className="text-sm font-bold" style={{ color: APP.accent }}>
            About this offer
          </h2>
          <p
            className="mt-2 whitespace-pre-line text-sm leading-relaxed"
            style={{ color: d.description ? APP.soft : APP.muted }}
          >
            {d.description || "The full description appears here."}
          </p>
        </div>

        {d.instructions.length > 0 && (
          <WebCard className="p-4">
            <h2 className="text-sm font-bold" style={{ color: APP.ink }}>
              How to complete it
            </h2>
            <ol className="mt-3 space-y-3">
              {d.instructions.map((step, index) => (
                <li
                  key={`${index}-${step}`}
                  className="flex gap-3 text-sm"
                  style={{ color: APP.soft }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      background: APP.accentGradient,
                      color: APP.onAccent,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </WebCard>
        )}

        {d.features.length > 0 && (
          <WebCard className="p-4">
            <h2 className="text-sm font-bold" style={{ color: APP.ink }}>
              Why you&apos;ll love it
            </h2>
            <ul className="mt-3 space-y-2">
              {d.features.map((feature, index) => (
                <li
                  key={`${index}-${feature}`}
                  className="flex gap-2 text-sm leading-relaxed"
                  style={{ color: APP.soft }}
                >
                  <span style={{ color: APP.accent }}>✓</span> {feature}
                </li>
              ))}
            </ul>
          </WebCard>
        )}

        {d.requirements.length > 0 && (
          <WebCard className="p-4">
            <h2 className="text-sm font-bold" style={{ color: APP.ink }}>
              Requirements
            </h2>
            <ul className="mt-3 space-y-2">
              {d.requirements.map((requirement, index) => (
                <li
                  key={`${index}-${requirement}`}
                  className="flex gap-2 text-sm leading-relaxed"
                  style={{ color: APP.muted }}
                >
                  <span style={{ color: APP.soft }}>•</span> {requirement}
                </li>
              ))}
            </ul>
          </WebCard>
        )}

        {d.warning && (
          <div
            className="rounded-[18px] p-4 text-sm leading-relaxed"
            style={{
              color: APP.webDanger,
              background: `${APP.webDanger}1A`,
              border: `1px solid ${APP.webDanger}66`,
            }}
          >
            {d.warning}
          </div>
        )}

        {d.terms && (
          <WebCard className="p-4 text-sm" style={{ color: APP.soft }}>
            <p className="font-bold" style={{ color: APP.ink }}>
              Terms &amp; conditions
            </p>
            <p className="mt-2 whitespace-pre-line leading-relaxed">
              {d.terms}
            </p>
          </WebCard>
        )}
      </section>
    </div>
  );
};

/** The web page's sticky bottom bar — pinned to the phone, not the scroll. */
const StickyCta = (): JSX.Element => (
  <div
    className="absolute inset-x-0 bottom-0 p-4 backdrop-blur"
    style={{
      background: "rgba(250,249,247,0.9)",
      borderTop: `1px solid ${APP.hairline}`,
    }}
  >
    <div
      className="rounded-xl py-3.5 text-center text-sm font-semibold"
      style={{
        background: APP.accent,
        color: APP.onAccent,
        boxShadow: "0 4px 12px rgba(80,49,24,0.08)",
      }}
    >
      Get it on Google Play
    </div>
    <p className="mt-1.5 text-center text-[11px]" style={{ color: APP.muted }}>
      Opens the official Play Store listing
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Pane
// ---------------------------------------------------------------------------

const VIEWS: { id: PreviewView; label: string; caption: string }[] = [
  {
    id: "home",
    label: "Home",
    caption: "Home → “App offers” rail. Product offers only.",
  },
  {
    id: "explore",
    label: "Explore",
    caption: "Explore grid — two cards per row, 16:9 art.",
  },
  {
    id: "details",
    label: "Details",
    caption: "Offer page, opened inside the app’s Web Zone.",
  },
];

export const OfferPreview = ({
  draft,
  className,
}: {
  draft: OfferPreviewDraft;
  className?: string;
}): JSX.Element => {
  const [picked, setPicked] = useState<PreviewView>(
    draft.isProduct ? "home" : "explore",
  );
  // Feedback offers never reach the home rail.
  const view: PreviewView =
    picked === "home" && !draft.isProduct ? "explore" : picked;

  return (
    <PreviewPane
      className={className}
      views={VIEWS.filter((v) => v.id !== "home" || draft.isProduct)}
      view={view}
      onViewChange={setPicked}
      overlay={view === "details" ? <StickyCta /> : undefined}
    >
      {view === "home" && <HomeScreen d={draft} />}
      {view === "explore" && <ExploreScreen d={draft} />}
      {view === "details" && <DetailsScreen d={draft} />}
    </PreviewPane>
  );
};
