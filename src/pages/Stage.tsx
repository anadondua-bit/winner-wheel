import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AwardWheel } from "@/components/award-wheel/AwardWheel";
import { StageBackdrop } from "@/components/award-wheel/StageBackdrop";
import { StageHeader } from "@/components/award-wheel/StageHeader";
import { WinnerPanel } from "@/components/award-wheel/WinnerPanel";
import { WinnersList } from "@/components/award-wheel/WinnersList";
import { useWheelMirror } from "@/hooks/use-wheel-mirror";
import { isWheelAudioReady, resumeWheelAudio } from "@/lib/wheel-sound";

/**
 * The LED wall: a read-only mirror of the draw, driven live from the
 * command center. No buttons, no roster editor — this page only renders
 * whatever state arrives.
 */
const Stage = () => {
  const wheel = useWheelMirror();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioArmed, setAudioArmed] = useState(false);

  const {
    config,
    winners,
    phase,
    wheelCompanies,
    pendingWinner,
    winnerIndex,
    status,
  } = wheel;

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      toast.error("Full screen is blocked in this browser");
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Audio can't start until a real gesture happens on this page — the first
  // tap, click or keypress on the TV machine arms it for the rest of the show.
  useEffect(() => {
    if (isWheelAudioReady()) {
      setAudioArmed(true);
      return;
    }

    const arm = () => {
      void resumeWheelAudio().then(() => setAudioArmed(isWheelAudioReady()));
    };

    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  // A drawn name must not appear in the list before the wheel has landed on it.
  const revealedWinners = phase === "spinning" ? winners.slice(0, -1) : winners;
  const landedKey = phase === "result" && pendingWinner ? pendingWinner.draw : null;

  const backdrop =
    phase === "complete" ? "closing" : phase === "result" ? "reveal" : "stage";

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-background"
      data-accent={config.accent}
    >
      <StageBackdrop variant={backdrop} />

      {!audioArmed ? (
        <button
          type="button"
          onClick={() => {
            void resumeWheelAudio().then(() => setAudioArmed(isWheelAudioReady()));
          }}
          className="absolute bottom-[1.8vh] right-[1.8vh] z-20 rounded-full border border-brand-light/20 bg-brand-ink/60 px-[1em] py-[0.5em] text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-light/70 backdrop-blur transition-colors hover:bg-brand-ink/80 hover:text-brand-light"
        >
          Tap for sound
        </button>
      ) : null}

      <div className="relative z-10 flex h-full w-full items-center justify-center p-[1.8vh] max-lg:p-0">
        <div
          className="flex h-full flex-col gap-[1.7vh] max-lg:gap-4 max-lg:overflow-y-auto max-lg:px-4 max-lg:py-4"
          style={{
            aspectRatio: `${config.wallWidth} / ${config.wallHeight}`,
            maxWidth: "100%",
          }}
        >
          <StageHeader
            title={config.title}
            subtitle={config.subtitle}
            companiesInPlay={wheelCompanies.length}
            totalCompanies={wheel.baseRoster.length}
            signal={status}
          />

          <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.03fr)_minmax(0,1fr)] items-stretch gap-[2.2vw] max-lg:grid-cols-1 max-lg:items-start max-lg:gap-5">
            <div className="flex min-h-0 items-center justify-center">
              <AwardWheel
                companies={wheelCompanies}
                phase={phase}
                winnerIndex={winnerIndex}
                landedKey={landedKey}
              />
            </div>

            <div className="flex min-h-0 flex-col justify-center gap-[1.6vh] max-lg:w-full">
              <WinnerPanel
                phase={phase}
                totalDraws={config.totalDraws}
                winnersCount={winners.length}
                winner={pendingWinner}
                companiesInPlay={wheelCompanies.length}
              />
              <WinnersList winners={revealedWinners} totalDraws={config.totalDraws} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Stage;
