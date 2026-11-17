import { useEffect, useMemo, useState } from "react";
import { CommandHeader } from "@/components/command-center/CommandHeader";
import { DrawActionCard } from "@/components/command-center/DrawActionCard";
import { StatTile } from "@/components/command-center/StatTile";
import { WinnersLedger } from "@/components/command-center/WinnersLedger";
import { RosterDialog } from "@/components/award-wheel/RosterDialog";
import { useAwardWheel } from "@/hooks/use-award-wheel";
import { useDrawSync } from "@/hooks/use-draw-sync";
import { useWheelBroadcast, type BroadcastStatus } from "@/hooks/use-wheel-broadcast";
import type { DrawState } from "@/lib/wheel-types";

/**
 * The operator's desk: one action, a live status readout and the winners
 * ledger — no wheel graphic. This is the authoritative half of the show;
 * every change here is persisted to the show record and broadcast live to
 * the stage display at /stage.
 */
const Control = () => {
  const wheel = useAwardWheel();
  const sync = useDrawSync({
    winners: wheel.winners,
    baseRoster: wheel.baseRoster,
    config: wheel.config,
    adoptRemote: wheel.adoptRemote,
  });

  const [rosterOpen, setRosterOpen] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus>("connecting");

  const liveState: DrawState = useMemo(
    () => ({
      config: wheel.config,
      baseRoster: wheel.baseRoster,
      winners: wheel.winners,
      phase: wheel.phase,
    }),
    [wheel.config, wheel.baseRoster, wheel.winners, wheel.phase],
  );
  useWheelBroadcast(liveState, setBroadcastStatus);

  const { resetRemote } = sync;
  const handleResetDraw = () => {
    wheel.resetDraw();
    resetRemote();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (rosterOpen) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (wheel.canAdvance) wheel.advance();
        else if (wheel.canSpin) wheel.startSpin();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rosterOpen, wheel]);

  return (
    <div className="h-full w-full overflow-y-auto bg-background" data-accent={wheel.config.accent}>
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8">
        <CommandHeader
          title={wheel.config.title}
          subtitle={wheel.config.subtitle}
          broadcastStatus={broadcastStatus}
          saveStatus={sync.status}
          onOpenRoster={() => setRosterOpen(true)}
        />

        <DrawActionCard
          phase={wheel.phase}
          winner={wheel.pendingWinner}
          winnersCount={wheel.winners.length}
          totalDraws={wheel.config.totalDraws}
          canSpin={wheel.canSpin}
          canAdvance={wheel.canAdvance}
          onSpin={wheel.startSpin}
          onAdvance={wheel.advance}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            label="On the wheel"
            value={String(wheel.wheelCompanies.length)}
            hint={`of ${wheel.baseRoster.length} total`}
          />
          <StatTile label="Draws remaining" value={String(Math.max(wheel.drawsRemaining, 0))} />
          <StatTile label="Roster size" value={String(wheel.baseRoster.length)} hint="companies loaded" />
        </div>

        <WinnersLedger winners={wheel.winners} totalDraws={wheel.config.totalDraws} />
      </div>

      <RosterDialog
        open={rosterOpen}
        onOpenChange={setRosterOpen}
        roster={wheel.baseRoster}
        config={wheel.config}
        rosterLocked={wheel.rosterLocked}
        winnersCount={wheel.winners.length}
        onApplyRoster={wheel.applyRoster}
        onUpdateConfig={wheel.updateConfig}
        onResetDraw={handleResetDraw}
      />
    </div>
  );
};

export default Control;
