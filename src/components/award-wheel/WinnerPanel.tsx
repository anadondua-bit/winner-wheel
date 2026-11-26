import type { Branding, DrawPhase, Winner } from "@/lib/wheel-types";
import { RevealFlourish } from "./RevealFlourish";

type WinnerPanelProps = {
  phase: DrawPhase;
  totalDraws: number;
  winnersCount: number;
  winner: Winner | null;
  /** Companies currently drawn on the wheel before the pending reveal. */
  companiesInPlay: number;
  /** For the operator's custom wording on every fixed label here; omit to use the built-in words. */
  branding?: Branding;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** Fills a template like "Draw {n} of {m}" or "Revealed {time}" from a key/value map. */
const fillTemplate = (template: string, vars: Record<string, string>): string =>
  Object.entries(vars).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const phaseDot = (tone: "live" | "idle" | "done") =>
  tone === "live" ? "live-dot" : tone === "done" ? "opacity-80" : "opacity-60";

const FALLBACK_TEXT = "var(--winner-panel-text, var(--stage-text, var(--brand-light)))";

/** This panel's own text color, independently brandable from everything else on stage. */
const panelText = (opacity?: number): { color: string } => ({
  color: `hsl(${FALLBACK_TEXT}${opacity === undefined ? "" : ` / ${opacity}`})`,
});

/**
 * One named text segment's own color (status pill, eyebrow, winner name, draw
 * counter, revealed counter) — checks that segment's override first, then
 * falls back to a given default (its own hue for the pill/eyebrow, or the
 * shared winner-panel-text chain for everything else), at a given opacity.
 */
const segmentColor = (cssVar: string, fallback: string, opacity?: number): { color: string } => ({
  color: `hsl(var(${cssVar}, ${fallback})${opacity === undefined ? "" : ` / ${opacity}`})`,
});

/** This element's own font, independently brandable; falls back to whatever its ancestor resolved to. */
const fontVar = (cssVar: string): { fontFamily: string } => ({ fontFamily: `var(${cssVar}, inherit)` });

/** Same idea as segmentColor, but for a border — text and outline can default to different hues/alphas, same override. */
const segmentBorderColor = (cssVar: string, fallback: string, opacity: number): { borderColor: string } => ({
  borderColor: `hsl(var(${cssVar}, ${fallback}) / ${opacity})`,
});

/** A thin accent line's own left-to-right fade, from this segment's color (override or default) to transparent. */
const accentLineBg = (cssVar: string, fallback: string): { background: string } => ({
  background: `linear-gradient(to right, hsl(var(${cssVar}, ${fallback})), transparent)`,
});

const STATUS_TONE_DEFAULTS = {
  live: {
    textFallback: "var(--brand-mint)",
    textOpacity: undefined,
    borderFallback: "var(--brand-mint)",
    borderOpacity: 0.45,
  },
  idle: {
    textFallback: FALLBACK_TEXT,
    textOpacity: 0.7,
    borderFallback: FALLBACK_TEXT,
    borderOpacity: 0.2,
  },
  done: {
    textFallback: FALLBACK_TEXT,
    textOpacity: 0.85,
    borderFallback: "var(--brand-blue)",
    borderOpacity: 0.5,
  },
} as const;

const StatusPill = ({ tone, label }: { tone: "live" | "idle" | "done"; label: string }) => {
  const tones = {
    live: "bg-brand-mint/12",
    idle: "bg-brand-light/5",
    done: "bg-brand-blue/15",
  } as const;
  const toneDefault = STATUS_TONE_DEFAULTS[tone];

  return (
    <span
      className={`inline-flex items-center gap-[0.55em] rounded-full border px-[0.95em] py-[0.4em] font-semibold uppercase ${tones[tone]}`}
      style={{
        fontSize: "clamp(9px, 0.62vw, 15px)",
        letterSpacing: "0.24em",
        ...segmentColor("--winner-status-color", toneDefault.textFallback, toneDefault.textOpacity),
        ...segmentBorderColor("--winner-status-color", toneDefault.borderFallback, toneDefault.borderOpacity),
        ...fontVar("--font-winner-status"),
      }}
    >
      <span
        className={`h-[0.5em] w-[0.5em] rounded-full bg-current ${phaseDot(tone)}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
};

/** The large result column the audience reads from the back of the room. */
export const WinnerPanel = ({
  phase,
  totalDraws,
  winnersCount,
  winner,
  companiesInPlay,
  branding,
}: WinnerPanelProps) => {
  const isResult = phase === "result" && winner !== null;
  const isSpinning = phase === "spinning";
  const isComplete = phase === "complete";
  const drawNo = isResult || isSpinning ? winnersCount : Math.min(winnersCount + 1, totalDraws);

  const status = isComplete
    ? { tone: "done" as const, label: branding?.winnerStatusCompleteLabel || "Draw complete" }
    : isResult
      ? { tone: "live" as const, label: branding?.winnerStatusWinnerLabel || "Winner" }
      : isSpinning
        ? { tone: "idle" as const, label: branding?.winnerStatusInPlayLabel || "In play" }
        : winnersCount === 0
          ? { tone: "idle" as const, label: branding?.winnerStatusReadyLabel || "Ready" }
          : { tone: "idle" as const, label: branding?.winnerStatusNextDrawLabel || "Next draw" };

  return (
    <section
      className="panel-glass panel-glass--winner relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-[1.7rem] px-[2.1vw] py-[2.4vh] max-lg:px-6"
      style={{ fontFamily: "var(--font-winner-panel, var(--font-sans))" }}
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/40 to-transparent"
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <StatusPill tone={status.tone} label={status.label} />
        <span
          className="tabular font-semibold"
          style={{
            fontSize: "clamp(10px, 0.78vw, 18px)",
            letterSpacing: "0.18em",
            ...segmentColor("--draw-counter-color", FALLBACK_TEXT, 0.55),
            ...fontVar("--font-draw-counter"),
          }}
        >
          {branding?.drawCounterLabel || "DRAW"} {pad(drawNo)}{" "}
          <span style={segmentColor("--draw-counter-color", FALLBACK_TEXT, 0.25)}>/</span> {pad(totalDraws)}
        </span>
      </header>

      <div key={`${phase}-${winner?.companyId ?? "none"}`} className="flex flex-col justify-center py-[2.2vh]">
        {isResult && winner ? (
          <div className="reveal-enter">
            <div
              className="mb-[1.4vh] h-[2px] w-[4.4vw] min-w-[46px]"
              style={accentLineBg("--winner-eyebrow-color", "var(--brand-mint)")}
            />
            <span
              className="eyebrow"
              style={{ ...segmentColor("--winner-eyebrow-color", "var(--brand-mint)", 0.9), ...fontVar("--font-winner-eyebrow") }}
            >
              {branding?.eyebrowWinnerDrawLabel || "Winner · draw"} {pad(winner.draw)}
            </span>
            <h1
              className={`display-name name-stamp mt-[1.1vh] break-words ${
                winner.name.length > 22 ? "winner-name--long" : "winner-name"
              }`}
              style={{ ...segmentColor("--winner-name-color", FALLBACK_TEXT), ...fontVar("--font-winner-name") }}
            >
              {winner.name}
            </h1>
          </div>
        ) : isSpinning ? (
          <div className="reveal-enter">
            <span
              className="eyebrow"
              style={{ ...segmentColor("--winner-eyebrow-color", FALLBACK_TEXT, 0.62), ...fontVar("--font-winner-eyebrow") }}
            >
              {winnersCount === 1
                ? branding?.eyebrowTurningLabel || "The wheel is turning"
                : branding?.eyebrowInProgressLabel || "Draw in progress"}
            </span>
            <p
              className="display-name mt-[1.2vh]"
              style={{
                fontSize: "clamp(1.6rem, 3.4vw, 4.6rem)",
                ...segmentColor("--body-headline-color", FALLBACK_TEXT),
                ...fontVar("--font-body-headline"),
              }}
            >
              {fillTemplate(branding?.bodyHeadlineSpinningLabel || "{n} companies", {
                n: String(companiesInPlay),
              })}
            </p>
            <p
              className="mt-[1.2vh]"
              style={{
                fontSize: "clamp(11px, 0.9vw, 22px)",
                ...segmentColor("--body-subtext-color", FALLBACK_TEXT, 0.6),
                ...fontVar("--font-body-subtext"),
              }}
            >
              {branding?.bodySubtextSpinningLabel || "Still on the wheel for this draw."}
            </p>
          </div>
        ) : isComplete ? (
          <div className="reveal-enter">
            <div
              className="mb-[1.4vh] h-[2px] w-[4.4vw] min-w-[46px]"
              style={accentLineBg("--winner-eyebrow-color", "var(--brand-blue)")}
            />
            <span
              className="eyebrow"
              style={{ ...segmentColor("--winner-eyebrow-color", FALLBACK_TEXT, 0.62), ...fontVar("--font-winner-eyebrow") }}
            >
              {branding?.eyebrowCeremonyClosedLabel || "Ceremony draw closed"}
            </span>
            <h2
              className="display-name mt-[1.1vh]"
              style={{
                fontSize: "clamp(1.9rem, 3.9vw, 5.4rem)",
                ...segmentColor("--body-headline-color", FALLBACK_TEXT),
                ...fontVar("--font-body-headline"),
              }}
            >
              {fillTemplate(branding?.bodyHeadlineCompleteLabel || "All {n} winners announced", {
                n: String(totalDraws),
              })}
            </h2>
            <p
              className="mt-[1.4vh]"
              style={{
                fontSize: "clamp(11px, 0.92vw, 23px)",
                ...segmentColor("--body-subtext-color", FALLBACK_TEXT, 0.65),
                ...fontVar("--font-body-subtext"),
              }}
            >
              {fillTemplate(branding?.bodySubtextCompleteLabel || "{n} companies remain on the wheel.", {
                n: String(companiesInPlay),
              })}
            </p>
          </div>
        ) : (
          <div className="reveal-enter">
            <span
              className="eyebrow"
              style={{ ...segmentColor("--winner-eyebrow-color", FALLBACK_TEXT, 0.62), ...fontVar("--font-winner-eyebrow") }}
            >
              {winnersCount === 0
                ? branding?.eyebrowWheelSetLabel || "The wheel is set"
                : fillTemplate(branding?.eyebrowDrawOfLabel || "Draw {n} of {m}", {
                    n: pad(drawNo),
                    m: pad(totalDraws),
                  })}
            </span>
            <h2
              className="display-name mt-[1.1vh]"
              style={{
                fontSize: "clamp(1.8rem, 3.7vw, 5.1rem)",
                ...segmentColor("--body-headline-color", FALLBACK_TEXT),
                ...fontVar("--font-body-headline"),
              }}
            >
              {winnersCount === 0
                ? branding?.bodyHeadlineFirstLabel || "Let the draw begin"
                : branding?.bodyHeadlineNextLabel || "Ready for the next name"}
            </h2>
            <p
              className="mt-[1.4vh]"
              style={{
                fontSize: "clamp(11px, 0.92vw, 23px)",
                ...segmentColor("--body-subtext-color", FALLBACK_TEXT, 0.65),
                ...fontVar("--font-body-subtext"),
              }}
            >
              {winnersCount === 0
                ? fillTemplate(
                    branding?.bodySubtextFirstLabel || "{n} companies on the wheel · {m} winners to reveal",
                    { n: String(companiesInPlay), m: String(totalDraws) },
                  )
                : fillTemplate(branding?.bodySubtextNextLabel || "{n} companies in play · {m} reveals to go", {
                    n: String(companiesInPlay),
                    m: String(totalDraws - winnersCount),
                  })}
            </p>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-brand-light/10 pt-[1.6vh]">
        <span
          className="text-kicker"
          style={{
            fontSize: "clamp(8px, 0.6vw, 14px)",
            ...segmentColor("--footer-caption-color", FALLBACK_TEXT, 0.45),
            ...fontVar("--font-footer-caption"),
          }}
        >
          {isResult && winner
            ? fillTemplate(branding?.footerCaptionRevealedLabel || "Revealed {time}", {
                time: formatTime(winner.wonAt),
              })
            : isComplete
              ? branding?.footerCaptionCompleteLabel || "Further spins disabled"
              : branding?.footerCaptionLiveLabel || "Main stage · live"}
        </span>
        <span
          className="tabular font-semibold"
          style={{
            fontSize: "clamp(10px, 0.72vw, 17px)",
            ...segmentColor("--revealed-counter-color", FALLBACK_TEXT, 0.7),
            ...fontVar("--font-revealed-counter"),
          }}
        >
          {winnersCount} / {totalDraws} {branding?.revealedCounterLabel || "REVEALED"}
        </span>
      </footer>

      {isResult && winner ? <RevealFlourish key={winner.draw} /> : null}
    </section>
  );
};
