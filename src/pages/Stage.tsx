import { useEffect } from "react";
import { StageCanvas } from "@/components/award-wheel/StageCanvas";
import { useApplyBranding } from "@/hooks/use-apply-branding";
import { useWheelMirror } from "@/hooks/use-wheel-mirror";
import { resumeWheelAudio } from "@/lib/wheel-sound";

/**
 * The LED wall: a read-only mirror of the draw, driven live from the
 * command center. No buttons, no roster editor — this page only renders
 * whatever state arrives. Fullscreen is handled entirely outside this page
 * (the kiosk launch already covers it); there's no in-page toggle.
 */
const Stage = () => {
  const wheel = useWheelMirror();

  useApplyBranding(wheel.config.branding);

  // Audio can't start until a real gesture happens on this page — the
  // first tap, click or keypress on the TV machine arms it for the rest of
  // the show. No on-screen prompt for this: it's a silent side effect of
  // whatever the AV tech does to set the page up.
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
    />
  );
};

export default Stage;
