import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  GiftIcon,
} from "@heroicons/react/24/solid";
import {
  APP,
  Artwork,
  PreviewPane,
  hairline,
} from "@/components/shared/app-preview";

/** The slice of the feedback page feedback_details_screen.dart renders. */
export interface FeedbackPagePreviewDraft {
  bannerUrl: string;
  title: string;
  description: string;
  benefits: string[];
  buttonText: string;
  buttonVisible: boolean;
}

/** GamePalette.light textSecondary — the description ink. */
const TEXT_SECONDARY = "#77736D";

const Banner = ({ url }: { url: string }): JSX.Element =>
  url.trim() ? (
    // HeroBanner: 16:9, radius 24, bottom fade; a broken URL leaves the dark backdrop.
    <div
      className="relative aspect-video overflow-hidden rounded-[24px]"
      style={{ ...hairline, background: "#1A2635" }}
    >
      <Artwork sources={[url]} fit="cover" fallback={null} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 50%, rgba(10,14,23,0.85))",
        }}
      />
    </div>
  ) : (
    // No banner: neutral tile with a ringed gift glyph.
    <div
      className="flex aspect-video items-center justify-center rounded-[24px]"
      style={{ ...hairline, background: "#FAF9F7" }}
    >
      <span
        className="flex h-[72px] w-[72px] rounded-[15px] p-[1.5px]"
        style={{
          background: `linear-gradient(135deg, ${APP.accent}8C, ${APP.accent}38)`,
        }}
      >
        <span
          className="flex h-full w-full items-center justify-center rounded-[13.5px]"
          style={{ background: "#FAF9F7" }}
        >
          <GiftIcon
            className="h-[34px] w-[34px]"
            style={{ color: APP.accent }}
          />
        </span>
      </span>
    </div>
  );

const PageScreen = ({ d }: { d: FeedbackPagePreviewDraft }): JSX.Element => (
  <div
    className="min-h-full"
    style={{ background: "linear-gradient(135deg,#FFFFFF,#FCFBF9)" }}
  >
    {/* GameAppBar: glass back button + titleLarge. */}
    <div className="flex h-14 items-center bg-white pl-[14px]">
      <span
        className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white"
        style={hairline}
      >
        <ArrowLeftIcon className="h-5 w-5" style={{ color: APP.ink }} />
      </span>
      <p
        className="ml-2 text-[22px] font-bold tracking-[-0.5px]"
        style={{ color: APP.ink }}
      >
        Hot Offers
      </p>
    </div>

    <div className="px-4 pb-10 pt-2">
      <Banner url={d.bannerUrl} />
      <p
        className="mt-6 line-clamp-3 text-[22px] font-bold leading-snug tracking-[-0.5px]"
        style={{ color: APP.ink }}
      >
        {d.title || "Page title"}
      </p>
      <p
        className="mt-2.5 whitespace-pre-line text-[16px] font-medium leading-[1.5]"
        style={{ color: TEXT_SECONDARY }}
      >
        {d.description || "The description appears here."}
      </p>
      <div className="mt-6">
        {d.benefits.length > 0 && (
          <div
            className="mt-6 rounded-[18px] bg-white p-[14px]"
            style={hairline}
          >
            <p
              className="truncate text-[14px] font-extrabold"
              style={{ color: APP.ink }}
            >
              Why you&apos;ll love it
            </p>
            <ul className="mt-2.5">
              {d.benefits.map((benefit, index) => (
                <li
                  key={`${index}-${benefit}`}
                  className="mb-2 flex items-start gap-2"
                >
                  <CheckCircleIcon
                    className="h-[18px] w-[18px] shrink-0"
                    style={{ color: APP.success }}
                  />
                  <span
                    className="text-[15px] font-medium leading-[1.35]"
                    style={{ color: APP.ink }}
                  >
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {d.buttonVisible && (
          <div
            className="mt-[26px] flex h-[46px] items-center justify-center gap-2 rounded-[14px] px-4"
            style={{ background: APP.accent, color: APP.onAccent }}
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5 shrink-0" />
            <span className="truncate text-[13px] font-semibold">
              {d.buttonText || "Download"}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const VIEWS = [
  {
    id: "page" as const,
    label: "Page",
    caption:
      "Hot Offers → category page. The button opens the website inside the app's Web Zone.",
  },
];

export const FeedbackPagePreview = ({
  draft,
  className,
}: {
  draft: FeedbackPagePreviewDraft;
  className?: string;
}): JSX.Element => (
  <PreviewPane
    className={className}
    views={VIEWS}
    view="page"
    onViewChange={() => undefined}
  >
    <PageScreen d={draft} />
  </PreviewPane>
);
