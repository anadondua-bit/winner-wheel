import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StageCanvas } from "@/components/award-wheel/StageCanvas";
import { useApplyBranding } from "@/hooks/use-apply-branding";
import { useAwardWheel } from "@/hooks/use-award-wheel";
import { resumeWheelAudio } from "@/lib/wheel-sound";

/**
 * Chrome's --kiosk flag hides the address bar/toolbar/menubar just like
 * the Fullscreen API does, but it isn't the Fullscreen API — this page
 * never sees a `fullscreenchange` event for it, so `document.fullscreenElement`
 * stays null and the "enter fullscreen" button would otherwise show up on
 * top of an already-fullscreen kiosk window. `window.locationbar.visible`
 * reliably reports false in both cases, so it's used here as a one-time
 * check for "is there any browser chrome left to hide at all".
 */
const isChromeHidden = (): boolean =>
  typeof window !== "undefined" && window.locationbar?.visible === false;

/**
 * Standalone demo build of the stage display. The real /stage page is a
 * read-only mirror driven by the command center over a broadcast channel;
 * this build has no command center to mirror, so it runs its own local draw
 * engine directly and exposes the same Space-bar shortcut the operator
 * normally uses, since the design itself has no on-screen buttons. Renders
 * the exact same StageCanvas as the real page, with no demo-only chrome
 * layered on top, so the two can't visually drift apart. Not the page
 * served at /stage; see main-demo-stage.tsx for the entry that mounts this
 * instead.
 */
const StageDemo = () => {
  const wheel = useAwardWheel();
  const [isFullscreen, setIsFullscreen] = useState(isChromeHidden);

  const { config, canSpin, canAdvance, startSpin, advance } = wheel;

  useApplyBranding(config.branding);

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

  useEffect(() => {
    const arm = () => {
      void resumeWheelAudio();
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
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (canAdvance) advance();
        else if (canSpin) startSpin();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen, canAdvance, canSpin, advance, startSpin]);

  return (
    <StageCanvas
      config={wheel.config}
      winners={wheel.winners}
      phase={wheel.phase}
      wheelCompanies={wheel.wheelCompanies}
      pendingWinner={wheel.pendingWinner}
      winnerIndex={wheel.winnerIndex}
      phaseChangedAt={wheel.phaseChangedAt}
      signal="live"
      isFullscreen={isFullscreen}
      onEnterFullscreen={() => void toggleFullscreen()}
    />
  );
};

export default StageDemo;
