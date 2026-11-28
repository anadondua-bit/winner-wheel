import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { StageCanvas } from "@/components/award-wheel/StageCanvas";
import { resumeWheelAudio } from "@/lib/wheel-sound";
import type { Company, DrawPhase, Winner, WheelConfig } from "@/lib/wheel-types";
import { ScaleToFit } from "./ScaleToFit";

type StagePreviewProps = {
  config: WheelConfig;
  winners: Winner[];
  phase: DrawPhase;
  wheelCompanies: Company[];
  pendingWinner: Winner | null;
  winnerIndex: number;
  phaseChangedAt?: string | null;
};

const SOUND_PREF_KEY = "award-wheel.control-sound.v1";

const readSoundPref = (): boolean => {
  try {
    return localStorage.getItem(SOUND_PREF_KEY) === "true";
  } catch {
    return false;
  }
};

/**
 * A live, same-state mirror of what's on the LED wall. Renders the exact
 * same StageCanvas the real /stage page does — not a hand-copied look-alike
 * — just shrunk to fit this card, so the operator never has to tab over to
 * /stage to see what the audience sees. Driven straight from Control's own
 * draw state (no broadcast round trip), so there's no sync lag to account
 * for, and no way for this preview to structurally drift from the original.
 *
 * Muted by default, since normally the stage display itself makes the
 * sound. The toggle is for a kiosk setup where the projecting machine
 * can't play audio (it's launched headless, with no user gesture to unlock
 * autoplay) — this machine's own speakers stand in instead. There's no
 * extra lag to account for here either: this preview updates from the same
 * local state change Control itself just made, same as the visual above.
 */
export const StagePreview = ({
  config,
  winners,
  phase,
  wheelCompanies,
  pendingWinner,
  winnerIndex,
  phaseChangedAt,
}: StagePreviewProps) => {
  const [soundEnabled, setSoundEnabled] = useState(readSoundPref);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem(SOUND_PREF_KEY, String(next));
    } catch {
      /* storage blocked — the toggle still works for this session */
    }
    if (next) {
      // The click is the user gesture that unlocks audio; resume it right
      // here rather than waiting for the first tick to (silently) fail.
      void resumeWheelAudio();
    }
  };

  return (
    <section className="panel-glass rounded-[1.4rem] p-3">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="text-kicker text-[11px] text-brand-light/45">Stage preview</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? "Playing spin sound from this machine" : "Play spin sound from this machine"}
            aria-label={soundEnabled ? "Mute sound on this machine" : "Play sound on this machine"}
            aria-pressed={soundEnabled}
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${
              soundEnabled
                ? "border-brand-mint/40 bg-brand-mint/15 text-brand-mint"
                : "border-brand-light/15 bg-brand-light/[0.03] text-brand-light/40 hover:text-brand-light/70"
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light/40">
            <span className="live-dot h-[0.5em] w-[0.5em] rounded-full bg-primary" aria-hidden="true" />
            Mirrors /stage
          </span>
        </div>
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
            phaseChangedAt={phaseChangedAt}
            signal="live"
            muted={!soundEnabled}
          />
        </div>
      </ScaleToFit>
    </section>
  );
};
