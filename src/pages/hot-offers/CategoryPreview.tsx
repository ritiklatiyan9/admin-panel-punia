import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import {
  APP,
  Block,
  CoinIcon,
  PreviewPane,
  hairline,
} from "@/components/shared/app-preview";

/**
 * The slice of a category the app and website actually render. The app has no
 * category tiles: the title is the eyebrow on each of the category's offer
 * cards, and the website shows one filter chip per category (featured first).
 */
export interface CategoryPreviewDraft {
  title: string;
  featured: boolean;
}

type View = "list" | "web";

// ---------------------------------------------------------------------------
// Hot Offers screen (hot_offers_screen.dart: IllustratedTabScaffold + _OfferCard)
// ---------------------------------------------------------------------------

/** _OfferCard — only the category eyebrow is ours; the rest belongs to the offer. */
const OfferRow = ({ eyebrow }: { eyebrow?: string }): JSX.Element => (
  <div className="rounded-[18px] bg-white p-3" style={hairline}>
    <div className="flex items-start gap-3">
      <div
        className="h-[76px] w-[76px] shrink-0 rounded-[14px]"
        style={{ ...hairline, background: "#FFF5E9" }}
      />
      <div className="min-w-0 flex-1">
        {eyebrow === undefined ? (
          <Block className="h-[10px] w-16" />
        ) : (
          <p
            className="truncate text-[10px] font-semibold leading-[1.2]"
            style={{ color: "#8B7562" }}
          >
            {eyebrow}
          </p>
        )}
        <Block className="mt-1 h-[15px] w-4/5" />
        <Block className="mt-1 h-[15px] w-3/5" />
        <Block className="mt-1.5 h-[11px] w-full" />
        <Block className="mt-1 h-[11px] w-2/3" />
      </div>
    </div>
    <div className="my-2.5 h-px" style={{ background: APP.hairline }} />
    <div className="flex items-center gap-1.5">
      <CoinIcon size={19} />
      <div className="flex-1">
        <Block className="h-[13px] w-20" />
        <Block className="mt-1 h-[10px] w-12" />
      </div>
      <span
        className="ml-2 flex h-11 items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold"
        style={{ background: APP.accent, color: APP.onAccent }}
      >
        View offer
        <ArrowRightIcon className="h-[13px] w-[13px]" />
      </span>
    </div>
  </div>
);

const ListScreen = ({ d }: { d: CategoryPreviewDraft }): JSX.Element => (
  <div className="min-h-full bg-white pb-7">
    {/* Pinned hero: 238dp peach tint, toolbar, white rounded strip. */}
    <div className="relative h-[238px]" style={{ background: "#FFECD8" }}>
      <div className="flex h-14 items-center pl-1">
        <span className="flex h-12 w-12 items-center justify-center">
          <ArrowLeftIcon
            className="h-[21px] w-[21px]"
            style={{ color: APP.ink }}
          />
        </span>
        <p
          className="ml-2 text-[21px] font-extrabold tracking-[-0.7px]"
          style={{ color: APP.ink }}
        >
          Hot Offers
        </p>
      </div>
      {/* Bundled illustration — context only. */}
      <div
        className="absolute inset-x-10 bottom-10 top-[72px] rounded-[24px]"
        style={{ background: "rgba(255,255,255,0.5)" }}
      />
      <div className="absolute inset-x-0 -bottom-px h-[25px] rounded-t-[28px] bg-white" />
    </div>
    <div className="px-5 pb-5 pt-1">
      <p
        className="text-[24px] font-extrabold leading-[1.2] tracking-[-0.8px]"
        style={{ color: APP.ink }}
      >
        Good finds. Real rewards.
      </p>
      <p
        className="mt-1.5 text-[12px] leading-[1.5]"
        style={{ color: APP.muted }}
      >
        Pick an offer, follow the steps and earn coins.
      </p>
    </div>
    <div className="flex items-center gap-[7px] px-5 pb-3">
      <SparklesIcon className="h-4 w-4" style={{ color: APP.accent }} />
      <p
        className="flex-1 text-[14px] font-extrabold"
        style={{ color: APP.ink }}
      >
        Offers for you
      </p>
      <span className="text-[11px]" style={{ color: APP.muted }}>
        3 offers
      </span>
    </div>
    <div className="space-y-3 px-5">
      <OfferRow eyebrow={d.title || "Category"} />
      <OfferRow />
      <OfferRow />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Offers website (prithvi-web OffersPage, opened inside the Web Zone with ?category=<slug>)
// ---------------------------------------------------------------------------

const Chip = ({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}): JSX.Element => (
  <span
    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
    style={
      active
        ? {
            border: `1px solid ${APP.accent}99`,
            background: `${APP.accent}1A`,
            color: APP.accent,
          }
        : { ...hairline, background: APP.surfaceAlt, color: APP.soft }
    }
  >
    {label}
  </span>
);

const GhostChip = (): JSX.Element => (
  <Block className="h-[26px] w-16 shrink-0 rounded-full" />
);

const WebScreen = ({ d }: { d: CategoryPreviewDraft }): JSX.Element => {
  const mine = <Chip label={d.title || "Category"} active />;
  return (
    <div className="px-4 pb-10 pt-6">
      <p className="text-xs font-bold" style={{ color: APP.accent }}>
        Hot Offers
      </p>
      <p
        className="mt-2 text-[30px] font-bold leading-tight tracking-tight"
        style={{ color: APP.ink }}
      >
        Your next little win.
      </p>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: APP.soft }}>
        Explore something new. Complete the steps and collect coins after
        approval.
      </p>
      <div
        className="mt-3 rounded-2xl px-4 py-3 text-sm"
        style={{ ...hairline, background: APP.surfaceAlt, color: APP.muted }}
      >
        Find your next offer…
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-hidden">
          <Chip label="All" />
          {/* Categories sort featured first, then by priority. */}
          {d.featured ? (
            <>
              {mine}
              <GhostChip />
              <GhostChip />
            </>
          ) : (
            <>
              <GhostChip />
              {mine}
              <GhostChip />
            </>
          )}
        </div>
        <Block className="h-9 w-20 rounded-2xl" />
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[18px] bg-white"
            style={hairline}
          >
            <div className="aspect-video" style={{ background: APP.artBg }} />
            <div className="p-3">
              <Block className="h-3 w-3/5" />
              <Block className="mt-2 h-3 w-4/5" />
              <Block className="mt-3 h-9 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pane
// ---------------------------------------------------------------------------

const VIEWS: { id: View; label: string; caption: string }[] = [
  {
    id: "list",
    label: "Hot Offers",
    caption:
      "Hot Offers screen — the title is the eyebrow on each of the category's offer cards.",
  },
  {
    id: "web",
    label: "Website",
    caption:
      "Offers website in the Web Zone — one filter chip per published category, featured first.",
  },
];

export const CategoryPreview = ({
  draft,
  className,
}: {
  draft: CategoryPreviewDraft;
  className?: string;
}): JSX.Element => {
  const [view, setView] = useState<View>("list");
  return (
    <PreviewPane
      className={className}
      views={VIEWS}
      view={view}
      onViewChange={setView}
    >
      {view === "list" ? <ListScreen d={draft} /> : <WebScreen d={draft} />}
    </PreviewPane>
  );
};
