import { ArrowRight, Maximize, Minimize, Play, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DrawPhase, SaveStatus } from "@/lib/wheel-types";

type OperatorBarProps = {
  phase: DrawPhase;
  canSpin: boolean;
  canAdvance: boolean;
  winnersCount: number;
  totalDraws: number;
  drawsRemaining: number;
  saveStatus: SaveStatus;
  isFullscreen: boolean;
  onSpin: () => void;
  onAdvance: () => void;
  onOpenRoster: () => void;
  onToggleFullscreen: () => void;
};

const actionSize =
  "h-[clamp(36px,4.4vh,62px)] gap-[0.5rem] px-[clamp(14px,1.5vw,32px)] text-[clamp(10px,0.86vw,20px)]";

const saveCopy: Record<
  SaveStatus,
  { label: string; tone: string; hint: string }
> = {
  idle: {
    label: "Ready",
    tone: "bg-brand-light/40",
    hint: "No results recorded yet — every reveal is saved automatically",
  },
  saved: {
    label: "Synced",
    tone: "bg-brand-mint",
    hint: "Every result is in the show record",
  },
  saving: {
    label: "Saving",
    tone: "bg-brand-cyan",
    hint: "Writing the latest result to the show record",
  },
  error: {
    label: "Offline",
    tone: "bg-destructive",
    hint: "The draw continues on this machine and retries automatically",
  },
};

/** Show-control strip: spin, advance and the operator's settings. */
export const OperatorBar = ({
  phase,
  canSpin,
  canAdvance,
  winnersCount,
  totalDraws,
  drawsRemaining,
  saveStatus,
  isFullscreen,
  onSpin,
  onAdvance,
  onOpenRoster,
  onToggleFullscreen,
}: OperatorBarProps) => {
  const save = saveCopy[saveStatus];
  const spinHint = canSpin
    ? "Start the spin on the host's cue"
    : phase === "result"
      ? "Advance the result before spinning again"
      : phase === "spinning"
        ? "The wheel is moving"
        : "All draws are complete";

  return (
    <div className="panel-glass flex flex-wrap items-center justify-between gap-[1.2vw] rounded-[1.3rem] px-[1.5vw] py-[1.4vh] max-lg:px-4">
      <div className="flex items-center gap-[1.2vw] max-lg:gap-4">
        <div className="flex items-center gap-[0.7vw] max-lg:gap-3">
          <span
            aria-hidden="true"
            className="grid h-[clamp(22px,2.4vh,34px)] w-[clamp(22px,2.4vh,34px)] place-items-center rounded-[0.4rem] bg-brand-mint/15"
          >
            <span className="h-[38%] w-[38%] rounded-[2px] bg-brand-mint" />
          </span>
          <div className="leading-tight">
            <p
              className="text-kicker text-brand-light/80"
              style={{ fontSize: "clamp(8px, 0.62vw, 14px)" }}
            >
              Show control
            </p>
            <p
              className="text-brand-light/40"
              style={{ fontSize: "clamp(9px, 0.68vw, 15px)" }}
            >
              Draw {Math.min(winnersCount + 1, totalDraws)} of {totalDraws} ·{" "}
              {Math.max(drawsRemaining, 0)} to go
            </p>
          </div>
        </div>

        <div
          className="hidden items-center gap-[0.45vw] rounded-full border border-brand-light/10 px-[0.9vw] py-[0.45vh] sm:flex"
          title={save.hint}
        >
          <span className={`h-2 w-2 rounded-full ${save.tone}`} aria-hidden="true" />
          <span
            className="font-semibold uppercase text-brand-light/55"
            style={{ fontSize: "clamp(8px, 0.6vw, 14px)", letterSpacing: "0.16em" }}
          >
            {save.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-[0.8vw] max-lg:w-full max-lg:justify-start">
        <Button
          variant="hero"
          onClick={onSpin}
          disabled={!canSpin}
          title={spinHint}
          aria-label="Start spin"
          className={actionSize}
        >
          <Play className="h-[1.1em] w-[1.1em]" aria-hidden="true" />
          Start spin
          <span className="kbd ml-[0.3em] hidden md:inline-flex">SPACE</span>
        </Button>

        <Button
          variant="stage"
          onClick={onAdvance}
          disabled={!canAdvance}
          title={canAdvance ? "Remove the winner and set the next draw" : "Available while a result is on screen"}
          aria-label="Advance after reveal"
          className={actionSize}
        >
          Advance
          <ArrowRight className="h-[1.1em] w-[1.1em]" aria-hidden="true" />
          <span className="kbd ml-[0.3em] hidden md:inline-flex">SPACE</span>
        </Button>
      </div>

      <div className="flex items-center gap-[0.5vw]">
        <Button
          variant="quiet"
          onClick={onOpenRoster}
          title="Roster and branding"
          aria-label="Open roster and branding settings"
          className="h-[clamp(34px,4vh,56px)] w-[clamp(34px,4vh,56px)] p-0"
        >
          <Settings2 className="h-[1.15em] w-[1.15em]" aria-hidden="true" />
        </Button>
        <Button
          variant="quiet"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Leave full screen" : "Full screen (F)"}
          aria-label={isFullscreen ? "Leave full screen" : "Enter full screen"}
          className="h-[clamp(34px,4vh,56px)] w-[clamp(34px,4vh,56px)] p-0"
        >
          {isFullscreen ? (
            <Minimize className="h-[1.15em] w-[1.15em]" aria-hidden="true" />
          ) : (
            <Maximize className="h-[1.15em] w-[1.15em]" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
};
