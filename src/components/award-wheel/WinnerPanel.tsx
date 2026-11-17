import type { DrawPhase, Winner } from "@/lib/wheel-types";

type WinnerPanelProps = {
  phase: DrawPhase;
  totalDraws: number;
  winnersCount: number;
  winner: Winner | null;
  /** Companies currently drawn on the wheel before the pending reveal. */
  companiesInPlay: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const phaseDot = (tone: "live" | "idle" | "done") =>
  tone === "live" ? "live-dot" : tone === "done" ? "opacity-80" : "opacity-60";

const StatusPill = ({ tone, label }: { tone: "live" | "idle" | "done"; label: string }) => {
  const tones = {
    live: "border-brand-mint/45 bg-brand-mint/12 text-brand-mint",
    idle: "border-brand-light/20 bg-brand-light/5 text-brand-light/70",
    done: "border-brand-blue/50 bg-brand-blue/15 text-brand-light/85",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-[0.55em] rounded-full border px-[0.95em] py-[0.4em] font-semibold uppercase ${tones[tone]}`}
      style={{ fontSize: "clamp(9px, 0.62vw, 15px)", letterSpacing: "0.24em" }}
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
}: WinnerPanelProps) => {
  const isResult = phase === "result" && winner !== null;
  const isSpinning = phase === "spinning";
  const isComplete = phase === "complete";
  const drawNo = isResult || isSpinning ? winnersCount : Math.min(winnersCount + 1, totalDraws);

  const status = isComplete
    ? { tone: "done" as const, label: "Draw complete" }
    : isResult
      ? { tone: "live" as const, label: "Winner" }
      : isSpinning
        ? { tone: "idle" as const, label: "In play" }
        : winnersCount === 0
          ? { tone: "idle" as const, label: "Ready" }
          : { tone: "idle" as const, label: "Next draw" };

  return (
    <section
      className="panel-glass relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-[1.7rem] px-[2.1vw] py-[2.4vh] max-lg:px-6"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/40 to-transparent"
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <StatusPill tone={status.tone} label={status.label} />
        <span
          className="tabular font-semibold text-brand-light/55"
          style={{ fontSize: "clamp(10px, 0.78vw, 18px)", letterSpacing: "0.18em" }}
        >
          DRAW {pad(drawNo)} <span className="text-brand-light/25">/</span> {pad(totalDraws)}
        </span>
      </header>

      <div key={`${phase}-${winner?.companyId ?? "none"}`} className="flex flex-col justify-center py-[2.2vh]">
        {isResult && winner ? (
          <div className="reveal-enter">
            <div className="mb-[1.4vh] h-[2px] w-[4.4vw] min-w-[46px] bg-gradient-to-r from-brand-mint to-transparent" />
            <span className="eyebrow text-brand-mint/90">Winner · draw {pad(winner.draw)}</span>
            <h1
              className={`display-name mt-[1.1vh] break-words ${
                winner.name.length > 22 ? "winner-name--long" : "winner-name"
              }`}
            >
              {winner.name}
            </h1>
          </div>
        ) : isSpinning ? (
          <div className="reveal-enter">
            <span className="eyebrow">
              {winnersCount === 1 ? "The wheel is turning" : "Draw in progress"}
            </span>
            <p
              className="display-name mt-[1.2vh]"
              style={{ fontSize: "clamp(1.6rem, 3.4vw, 4.6rem)" }}
            >
              {companiesInPlay} companies
            </p>
            <p className="mt-[1.2vh] text-brand-light/60" style={{ fontSize: "clamp(11px, 0.9vw, 22px)" }}>
              Still on the wheel for this draw.
            </p>
          </div>
        ) : isComplete ? (
          <div className="reveal-enter">
            <div className="mb-[1.4vh] h-[2px] w-[4.4vw] min-w-[46px] bg-gradient-to-r from-brand-blue to-transparent" />
            <span className="eyebrow">Ceremony draw closed</span>
            <h2 className="display-name mt-[1.1vh]" style={{ fontSize: "clamp(1.9rem, 3.9vw, 5.4rem)" }}>
              All {totalDraws} winners announced
            </h2>
            <p className="mt-[1.4vh] text-brand-light/65" style={{ fontSize: "clamp(11px, 0.92vw, 23px)" }}>
              {companiesInPlay} companies remain on the wheel.
            </p>
          </div>
        ) : (
          <div className="reveal-enter">
            <span className="eyebrow">
              {winnersCount === 0 ? "The wheel is set" : `Draw ${pad(drawNo)} of ${pad(totalDraws)}`}
            </span>
            <h2
              className="display-name mt-[1.1vh]"
              style={{ fontSize: "clamp(1.8rem, 3.7vw, 5.1rem)" }}
            >
              {winnersCount === 0 ? "Let the draw begin" : "Ready for the next name"}
            </h2>
            <p className="mt-[1.4vh] text-brand-light/65" style={{ fontSize: "clamp(11px, 0.92vw, 23px)" }}>
              {winnersCount === 0
                ? `${companiesInPlay} companies on the wheel · ${totalDraws} winners to reveal`
                : `${companiesInPlay} companies in play · ${totalDraws - winnersCount} reveals to go`}
            </p>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-brand-light/10 pt-[1.6vh]">
        <span
          className="text-kicker text-brand-light/45"
          style={{ fontSize: "clamp(8px, 0.6vw, 14px)" }}
        >
          {isResult && winner
            ? `Revealed ${formatTime(winner.wonAt)}`
            : isComplete
              ? "Further spins disabled"
              : "Main stage · live"}
        </span>
        <span
          className="tabular font-semibold text-brand-light/70"
          style={{ fontSize: "clamp(10px, 0.72vw, 17px)" }}
        >
          {winnersCount} / {totalDraws} REVEALED
        </span>
      </footer>
    </section>
  );
};
