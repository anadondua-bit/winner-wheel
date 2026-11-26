import { Maximize } from "lucide-react";
import type { Branding } from "@/lib/wheel-types";

type StageHeaderProps = {
  subtitle: string;
  /** Connection to the command center; omit when this page has no remote link. */
  signal?: "live" | "connecting" | "offline";
  /** Hidden once the page is already fullscreen — omit entirely to never show it. */
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
  logoUrl?: string;
  /** For the operator's custom wording on the status label; omit to use the built-in words. */
  branding?: Branding;
};

const SIGNAL_COPY_DEFAULTS: Record<NonNullable<StageHeaderProps["signal"]>, string> = {
  live: "Live",
  connecting: "Connecting",
  offline: "Offline",
};

/** Ceremony masthead: event identity on the left, wheel status on the right. */
export const StageHeader = ({
  subtitle,
  signal = "live",
  isFullscreen,
  onEnterFullscreen,
  logoUrl,
  branding,
}: StageHeaderProps) => {
  const signalLabel =
    (signal === "live"
      ? branding?.statusLiveLabel
      : signal === "connecting"
        ? branding?.statusConnectingLabel
        : branding?.statusOfflineLabel) || SIGNAL_COPY_DEFAULTS[signal];

  return (
  <header className="flex shrink-0 flex-wrap items-start justify-between gap-x-6 gap-y-3">
    <div className="flex min-w-0 items-center gap-[1.4vw] max-lg:gap-5">
      <div
        className="flex items-center gap-[0.6vw] rounded-full border border-brand-light/15 bg-brand-ink/25 px-[1.2vw] backdrop-blur"
        style={{ height: "calc(var(--scale-status, 1) * clamp(30px, 4.14vh, 60px))" }}
      >
        <span
          className={`h-[0.5em] w-[0.5em] rounded-full ${
            signal === "live" ? "live-dot bg-primary" : signal === "connecting" ? "bg-brand-cyan" : "bg-destructive"
          }`}
          aria-hidden="true"
        />
        <span
          className="font-semibold uppercase"
          style={{
            fontSize: "calc(var(--scale-status, 1) * clamp(11px, 1.6vh, 22px))",
            letterSpacing: "0.22em",
            color: "hsl(var(--status-text, var(--stage-text, var(--brand-light))) / 0.7)",
            fontFamily: "var(--font-status, var(--font-sans))",
          }}
        >
          {signalLabel}
        </span>
      </div>

      {!isFullscreen && onEnterFullscreen ? (
        <button
          type="button"
          onClick={onEnterFullscreen}
          title="Full screen (F)"
          aria-label="Enter full screen"
          className="grid shrink-0 place-items-center rounded-full border border-brand-light/15 bg-brand-ink/25 text-brand-light/70 backdrop-blur transition-colors hover:bg-brand-ink/50 hover:text-brand-light"
          style={{
            height: "calc(var(--scale-status, 1) * clamp(26px, 3vh, 40px))",
            width: "calc(var(--scale-status, 1) * clamp(26px, 3vh, 40px))",
            fontSize: "calc(var(--scale-status, 1) * clamp(26px, 3vh, 40px))",
          }}
        >
          <Maximize className="h-[0.4em] w-[0.4em]" aria-hidden="true" />
        </button>
      ) : null}

      {!logoUrl ? (
        <div className="flex items-center gap-[0.7vw]">
          <span
            aria-hidden="true"
            className="h-[3px] w-[clamp(18px,2vw,44px)] rounded-full bg-gradient-to-r from-brand-mint to-brand-cyan"
          />
          <span className="eyebrow truncate">{subtitle || "Live draw"}</span>
        </div>
      ) : null}
    </div>

    {logoUrl ? (
      <img
        src={logoUrl}
        alt=""
        className="w-auto shrink-0 object-contain brightness-0 invert"
        style={{ height: "calc(var(--scale-logo, 1) * clamp(30px, 4.14vh, 60px))" }}
        draggable={false}
      />
    ) : null}
  </header>
  );
};
