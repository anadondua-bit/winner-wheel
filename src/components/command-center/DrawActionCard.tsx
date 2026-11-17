import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DrawPhase, Winner } from "@/lib/wheel-types";

type DrawActionCardProps = {
  phase: DrawPhase;
  winner: Winner | null;
  winnersCount: number;
  totalDraws: number;
  canSpin: boolean;
  canAdvance: boolean;
  onSpin: () => void;
  onAdvance: () => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The operator's primary screen: one status readout, one action. The
 * winner's name only appears once the phase flips to "result" — exactly
 * when it lands on the wheel — so the operator reacts with the room
 * instead of spoiling the stage reveal a few seconds early.
 */
export const DrawActionCard = ({
  phase,
  winner,
  winnersCount,
  totalDraws,
  canSpin,
  canAdvance,
  onSpin,
  onAdvance,
}: DrawActionCardProps) => {
  const drawNo = Math.min(winnersCount + (phase === "idle" ? 1 : 0), totalDraws);
  const isComplete = phase === "complete";
  const isSpinning = phase === "spinning";
  const isResult = phase === "result" && winner;

  return (
    <section className="panel-glass relative overflow-hidden rounded-[1.75rem] px-7 py-7 sm:px-9 sm:py-8">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/40 to-transparent"
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <span className="eyebrow">
          {isComplete
            ? "Ceremony draw closed"
            : isResult
              ? `Winner · draw ${pad(winner.draw)}`
              : isSpinning
                ? "Spinning"
                : winnersCount === 0
                  ? "Ready"
                  : `Draw ${pad(drawNo)} of ${pad(totalDraws)}`}
        </span>
        <span className="tabular text-sm font-semibold text-brand-light/50">
          DRAW {pad(Math.min(winnersCount + 1, totalDraws))}
          <span className="text-brand-light/25"> / {pad(totalDraws)}</span>
        </span>
      </header>

      <div key={`${phase}-${winner?.companyId ?? "none"}`} className="min-h-[7rem] py-6 sm:min-h-[8rem]">
        {isResult ? (
          <h1 className="display-name name-stamp break-words text-[clamp(1.9rem,4.2vw,3.6rem)]">
            {winner.name}
          </h1>
        ) : isSpinning ? (
          <div className="reveal-enter">
            <p className="display-name text-[clamp(1.5rem,3vw,2.6rem)]">The wheel is turning…</p>
            <p className="mt-2 text-sm text-brand-light/50">
              The result is locked in — watch the stage for the reveal.
            </p>
          </div>
        ) : isComplete ? (
          <div className="reveal-enter">
            <h2 className="display-name text-[clamp(1.6rem,3.2vw,2.8rem)]">
              All {totalDraws} winners announced
            </h2>
            <p className="mt-2 text-sm text-brand-light/50">
              Reset the draw before a rehearsal to run it again.
            </p>
          </div>
        ) : (
          <div className="reveal-enter">
            <h2 className="display-name text-[clamp(1.6rem,3.2vw,2.8rem)]">
              {winnersCount === 0 ? "Let the draw begin" : "Ready for the next name"}
            </h2>
            <p className="mt-2 text-sm text-brand-light/50">
              {totalDraws - winnersCount} draw{totalDraws - winnersCount === 1 ? "" : "s"} to go.
            </p>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-brand-light/10 pt-5">
        <Button
          variant="hero"
          size="lg"
          onClick={onSpin}
          disabled={!canSpin}
          className="h-14 flex-1 gap-2 rounded-full px-8 text-base sm:flex-none"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          Start spin
          <span className="kbd ml-1 hidden sm:inline-flex">SPACE</span>
        </Button>

        <Button
          variant="stage"
          size="lg"
          onClick={onAdvance}
          disabled={!canAdvance}
          className="h-14 flex-1 gap-2 rounded-full px-8 text-base sm:flex-none"
        >
          Advance
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
          <span className="kbd ml-1 hidden sm:inline-flex">SPACE</span>
        </Button>
      </footer>
    </section>
  );
};
