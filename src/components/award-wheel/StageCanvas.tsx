import { AwardWheel } from "./AwardWheel";
import { StageBackdrop } from "./StageBackdrop";
import { StageHeader } from "./StageHeader";
import { WinnerPanel } from "./WinnerPanel";
import { useApplyLayout } from "@/hooks/use-apply-layout";
import type { Company, DrawPhase, Winner, WheelConfig } from "@/lib/wheel-types";

/** Splits a long title into two balanced rows; short titles stay on one. */
const titleLines = (title: string): string[] => {
  const words = title.trim().split(/\s+/);
  if (words.length <= 3) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
};

type StageCanvasProps = {
  config: WheelConfig;
  winners: Winner[];
  phase: DrawPhase;
  wheelCompanies: Company[];
  pendingWinner: Winner | null;
  winnerIndex: number;
  signal?: "live" | "connecting" | "offline";
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
  /** For a second canvas on screen mirroring the real one — silences its wheel so it doesn't also make noise. */
  muted?: boolean;
};

/**
 * The exact LED-wall canvas: backdrop, header (logo/signal/fullscreen) and
 * the wheel + winner panel + event title. The real /stage page and any
 * preview of it (e.g. the command center's mini mirror) both render this
 * same component, with no caller-specific tweaks, so they can't
 * structurally or proportionally drift apart from each other.
 */
export const StageCanvas = ({
  config,
  winners,
  phase,
  wheelCompanies,
  pendingWinner,
  winnerIndex,
  signal,
  isFullscreen,
  onEnterFullscreen,
  muted,
}: StageCanvasProps) => {
  const landedKey = phase === "result" && pendingWinner ? pendingWinner.draw : null;
  const eventTitleLines = titleLines(config.title);

  useApplyLayout(config.layout);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-background"
      data-accent={config.accent}
    >
      <StageBackdrop imageUrl={config.branding.backgroundDataUrl ?? undefined} />

      <div className="relative z-10 flex h-full w-full items-center justify-center p-[1.8vh] max-lg:p-0">
        <div
          className="relative flex h-full flex-col gap-[1.7vh] max-lg:gap-4 max-lg:overflow-y-auto max-lg:px-4 max-lg:py-4"
          style={{
            aspectRatio: `${config.wallWidth} / ${config.wallHeight}`,
            maxWidth: "100%",
          }}
        >
          <StageHeader
            subtitle={config.subtitle}
            signal={signal}
            isFullscreen={isFullscreen}
            onEnterFullscreen={onEnterFullscreen}
            logoUrl={config.branding.logoDataUrl ?? undefined}
            branding={config.branding}
          />

          <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.03fr)_minmax(0,1fr)] items-stretch gap-[2.2vw] max-lg:grid-cols-1 max-lg:items-start max-lg:gap-5">
            <div className="flex min-h-0 items-center justify-center">
              <AwardWheel
                companies={wheelCompanies}
                phase={phase}
                winnerIndex={winnerIndex}
                landedKey={landedKey}
                segmentColorCount={config.branding.segmentColorCount}
                muted={muted}
              />
            </div>

            <div
              className="flex min-h-0 flex-col justify-center gap-[1.6vh] max-lg:w-full"
              style={{ transform: "scale(var(--scale-winner-panel, 1))" }}
            >
              <WinnerPanel
                phase={phase}
                totalDraws={config.totalDraws}
                winnersCount={winners.length}
                winner={pendingWinner}
                companiesInPlay={wheelCompanies.length}
                branding={config.branding}
              />
            </div>
          </main>

          <h1
            className="pointer-events-none absolute bottom-0 left-0 font-medium normal-case leading-[1.3] max-lg:static max-lg:mt-4"
            style={{
              fontSize: "calc(var(--scale-title, 1) * clamp(11px, 1.21vw, 28px))",
              letterSpacing: "0.01em",
              color: "hsl(var(--text-header-title))",
              fontFamily: "var(--font-header-title, var(--font-display))",
            }}
          >
            {eventTitleLines.map((line, index) => (
              <span key={index} className="block truncate">
                {line}
              </span>
            ))}
          </h1>
        </div>
      </div>
    </div>
  );
};
