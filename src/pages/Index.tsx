import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AwardWheel } from "@/components/award-wheel/AwardWheel";
import { OperatorBar } from "@/components/award-wheel/OperatorBar";
import { RosterDialog } from "@/components/award-wheel/RosterDialog";
import { StageBackdrop } from "@/components/award-wheel/StageBackdrop";
import { StageHeader } from "@/components/award-wheel/StageHeader";
import { WinnerPanel } from "@/components/award-wheel/WinnerPanel";
import { WinnersList } from "@/components/award-wheel/WinnersList";
import { useAwardWheel } from "@/hooks/use-award-wheel";
import { useDrawSync } from "@/hooks/use-draw-sync";

/** The ceremony's LED wall: the wheel, the reveal and the host's controls. */
const Index = () => {
  const wheel = useAwardWheel();
  const sync = useDrawSync({
    winners: wheel.winners,
    baseRoster: wheel.baseRoster,
    config: wheel.config,
    adoptRemote: wheel.adoptRemote,
  });

  const [rosterOpen, setRosterOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    config,
    winners,
    phase,
    wheelCompanies,
    pendingWinner,
    winnerIndex,
    drawsRemaining,
    canSpin,
    canAdvance,
    rosterLocked,
    startSpin,
    landSpin,
    advance,
    applyRoster,
    updateConfig,
    resetDraw,
  } = wheel;

  const { resetRemote } = sync;

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

  const handleResetDraw = useCallback(() => {
    resetDraw();
    resetRemote();
  }, [resetDraw, resetRemote]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (rosterOpen) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (canAdvance) advance();
        else if (canSpin) startSpin();
        return;
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rosterOpen, canAdvance, canSpin, advance, startSpin, toggleFullscreen]);

  // A drawn name must not appear in the list before the wheel has landed on it.
  const revealedWinners = phase === "spinning" ? winners.slice(0, -1) : winners;

  const backdrop =
    phase === "complete" ? "closing" : phase === "result" ? "reveal" : "stage";

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-background"
      data-accent={config.accent}
    >
      <StageBackdrop variant={backdrop} />

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
          />

          <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.03fr)_minmax(0,1fr)] items-stretch gap-[2.2vw] max-lg:grid-cols-1 max-lg:items-start max-lg:gap-5">
            <div className="flex min-h-0 items-center justify-center">
              <AwardWheel
                companies={wheelCompanies}
                phase={phase}
                winnerIndex={winnerIndex}
                landedKey={phase === "result" && pendingWinner ? pendingWinner.draw : null}
                onLanded={landSpin}
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

          <OperatorBar
            phase={phase}
            canSpin={canSpin}
            canAdvance={canAdvance}
            winnersCount={winners.length}
            totalDraws={config.totalDraws}
            drawsRemaining={drawsRemaining}
            saveStatus={sync.status}
            isFullscreen={isFullscreen}
            onSpin={startSpin}
            onAdvance={advance}
            onOpenRoster={() => setRosterOpen(true)}
            onToggleFullscreen={toggleFullscreen}
          />
        </div>
      </div>

      <RosterDialog
        open={rosterOpen}
        onOpenChange={setRosterOpen}
        roster={wheel.baseRoster}
        config={config}
        rosterLocked={rosterLocked}
        winnersCount={winners.length}
        onApplyRoster={applyRoster}
        onUpdateConfig={updateConfig}
        onResetDraw={handleResetDraw}
      />
    </div>
  );
};

export default Index;
