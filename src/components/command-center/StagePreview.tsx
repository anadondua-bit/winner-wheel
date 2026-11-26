import { StageCanvas } from "@/components/award-wheel/StageCanvas";
import type { Company, DrawPhase, Winner, WheelConfig } from "@/lib/wheel-types";
import { ScaleToFit } from "./ScaleToFit";

type StagePreviewProps = {
  config: WheelConfig;
  winners: Winner[];
  phase: DrawPhase;
  wheelCompanies: Company[];
  pendingWinner: Winner | null;
  winnerIndex: number;
};

/**
 * A live, same-state mirror of what's on the LED wall. Renders the exact
 * same StageCanvas the real /stage page does — not a hand-copied look-alike
 * — just shrunk to fit this card, so the operator never has to tab over to
 * /stage to see what the audience sees. Driven straight from Control's own
 * draw state (no broadcast round trip), so there's no sync lag to account
 * for, and no way for this preview to structurally drift from the original.
 * Muted: the real /stage page (wherever it's actually open) is the one that
 * should make noise, not a second wheel sitting in the operator's browser.
 */
export const StagePreview = ({
  config,
  winners,
  phase,
  wheelCompanies,
  pendingWinner,
  winnerIndex,
}: StagePreviewProps) => (
  <section className="panel-glass rounded-[1.4rem] p-3">
    <div className="mb-2.5 flex items-center justify-between px-1">
      <span className="text-kicker text-[11px] text-brand-light/45">Stage preview</span>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light/40">
        <span className="live-dot h-[0.5em] w-[0.5em] rounded-full bg-primary" aria-hidden="true" />
        Mirrors /stage
      </span>
    </div>

    <ScaleToFit
      className="w-full rounded-xl bg-background"
      style={{ aspectRatio: `${config.wallWidth} / ${config.wallHeight}` }}
    >
      <div style={{ width: config.wallWidth, height: config.wallHeight }}>
        <StageCanvas
          config={config}
          winners={winners}
          phase={phase}
          wheelCompanies={wheelCompanies}
          pendingWinner={pendingWinner}
          winnerIndex={winnerIndex}
          signal="live"
          isFullscreen
          muted
        />
      </div>
    </ScaleToFit>
  </section>
);
