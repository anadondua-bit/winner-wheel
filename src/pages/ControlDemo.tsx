import { useEffect, useState } from "react";
import { CommandHeader } from "@/components/command-center/CommandHeader";
import { DrawActionCard } from "@/components/command-center/DrawActionCard";
import { StagePreview } from "@/components/command-center/StagePreview";
import { StatTile } from "@/components/command-center/StatTile";
import { WinnersLedger } from "@/components/command-center/WinnersLedger";
import { RosterDialog } from "@/components/award-wheel/RosterDialog";
import { useApplyBranding } from "@/hooks/use-apply-branding";
import { useAwardWheel } from "@/hooks/use-award-wheel";

/**
 * Standalone demo build of the command center: the exact same local draw
 * engine as the real page, minus the Supabase broadcast/show-record sync —
 * so this works as a single offline file with no backend. Not the page
 * served at /control; see main-demo-control.tsx for the entry that mounts
 * this instead.
 */
const ControlDemo = () => {
  const wheel = useAwardWheel();
  useApplyBranding(wheel.config.branding);

  const [rosterOpen, setRosterOpen] = useState(false);

  const handleResetDraw = () => {
    wheel.resetDraw();
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
          logoUrl={wheel.config.branding.logoDataUrl ?? undefined}
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

        <StagePreview
          config={wheel.config}
          winners={wheel.winners}
          phase={wheel.phase}
          wheelCompanies={wheel.wheelCompanies}
          pendingWinner={wheel.pendingWinner}
          winnerIndex={wheel.winnerIndex}
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
        winners={wheel.winners}
        phase={wheel.phase}
        wheelCompanies={wheel.wheelCompanies}
        pendingWinner={wheel.pendingWinner}
        winnerIndex={wheel.winnerIndex}
      />
    </div>
  );
};

export default ControlDemo;
