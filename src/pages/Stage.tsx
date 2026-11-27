import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StageCanvas } from "@/components/award-wheel/StageCanvas";
import { useApplyBranding } from "@/hooks/use-apply-branding";
import { useWheelMirror } from "@/hooks/use-wheel-mirror";
import { resumeWheelAudio } from "@/lib/wheel-sound";

/**
 * Chrome's --kiosk flag hides the address bar/toolbar/menubar just like
 * the Fullscreen API does, but it isn't the Fullscreen API — this page
 * never sees a `fullscreenchange` event for it, so `document.fullscreenElement`
 * stays null and the "enter fullscreen" button would otherwise show up on
 * top of an already-fullscreen kiosk window. `window.locationbar.visible`
 * (and friends) reliably reports false in both cases, so it's used here as
 * a one-time check for "is there any browser chrome left to hide at all".
 */
const isChromeHidden = (): boolean =>
  typeof window !== "undefined" && window.locationbar?.visible === false;

/**
 * The LED wall: a read-only mirror of the draw, driven live from the
 * command center. No buttons, no roster editor — this page only renders
 * whatever state arrives.
 */
const Stage = () => {
  const wheel = useWheelMirror();
  const [isFullscreen, setIsFullscreen] = useState(isChromeHidden);

  useApplyBranding(wheel.config.branding);

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
  // tap, click or keypress on the TV machine (e.g. the fullscreen button, or
  // F) arms it for the rest of the show. No on-screen prompt for this: it's
  // a silent side effect of whatever the AV tech does to set the page up.
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
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  return (
    <StageCanvas
      config={wheel.config}
      winners={wheel.winners}
      phase={wheel.phase}
      wheelCompanies={wheel.wheelCompanies}
      pendingWinner={wheel.pendingWinner}
      winnerIndex={wheel.winnerIndex}
      phaseChangedAt={wheel.phaseChangedAt}
      signal={wheel.status}
      isFullscreen={isFullscreen}
      onEnterFullscreen={() => void toggleFullscreen()}
    />
  );
};

export default Stage;
