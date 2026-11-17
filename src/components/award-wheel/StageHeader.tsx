type StageHeaderProps = {
  title: string;
  subtitle: string;
  companiesInPlay: number;
  totalCompanies: number;
  /** Connection to the command center; omit when this page has no remote link. */
  signal?: "live" | "connecting" | "offline";
};

const SIGNAL_COPY: Record<NonNullable<StageHeaderProps["signal"]>, string> = {
  live: "Live",
  connecting: "Connecting",
  offline: "Offline",
};

/** Ceremony masthead: event identity on the left, wheel status on the right. */
export const StageHeader = ({
  title,
  subtitle,
  companiesInPlay,
  totalCompanies,
  signal = "live",
}: StageHeaderProps) => (
  <header className="flex shrink-0 flex-wrap items-start justify-between gap-x-6 gap-y-3">
    <div className="min-w-0">
      <div className="flex items-center gap-[0.7vw]">
        <span
          aria-hidden="true"
          className="h-[3px] w-[clamp(18px,2vw,44px)] rounded-full bg-gradient-to-r from-brand-mint to-brand-cyan"
        />
        <span className="eyebrow truncate">{subtitle || "Live draw"}</span>
      </div>
      <h1
        className="mt-[0.7vh] truncate font-display font-extrabold uppercase text-brand-light/90"
        style={{ fontSize: "clamp(13px, 1.42vw, 33px)", letterSpacing: "0.17em" }}
      >
        {title}
      </h1>
    </div>

    <div className="flex items-center gap-[1.4vw] max-lg:gap-5">
      <div className="flex items-center gap-[0.5vw] rounded-full border border-brand-light/15 bg-brand-ink/25 px-[1vw] py-[0.55vh] backdrop-blur">
        <span
          className={`h-[0.5em] w-[0.5em] rounded-full ${
            signal === "live" ? "live-dot bg-brand-mint" : signal === "connecting" ? "bg-brand-cyan" : "bg-destructive"
          }`}
          aria-hidden="true"
        />
        <span
          className="font-semibold uppercase text-brand-light/70"
          style={{ fontSize: "clamp(8px, 0.62vw, 14px)", letterSpacing: "0.24em" }}
        >
          {SIGNAL_COPY[signal]}
        </span>
      </div>

      <div className="text-right leading-none">
        <p
          className="tabular font-bold text-brand-light/90"
          style={{ fontSize: "clamp(15px, 1.35vw, 30px)" }}
        >
          {companiesInPlay}
          <span className="text-brand-light/30"> / {totalCompanies}</span>
        </p>
        <p
          className="mt-[0.5vh] font-semibold uppercase text-brand-light/40"
          style={{ fontSize: "clamp(7px, 0.55vw, 12px)", letterSpacing: "0.22em" }}
        >
          On the wheel
        </p>
      </div>
    </div>
  </header>
);
