import { MonitorOff, MonitorPlay, Settings2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { SaveStatus } from "@/lib/wheel-types";
import type { BroadcastStatus } from "@/hooks/use-wheel-broadcast";

type CommandHeaderProps = {
  title: string;
  subtitle: string;
  logoUrl?: string;
  /** Omit both to show a single "local demo" chip instead — for a standalone, unsynced build. */
  broadcastStatus?: BroadcastStatus;
  saveStatus?: SaveStatus;
  onOpenRoster: () => void;
  /** Remote-controls the physical stage machine's kiosk browser window — omit both to hide the controls entirely (e.g. the local demo build, which has no stage machine to command). */
  onOpenStage?: () => void;
  onCloseStage?: () => void;
};

const BROADCAST_COPY: Record<BroadcastStatus, { label: string; tone: string }> = {
  connecting: { label: "Connecting to stage", tone: "bg-brand-cyan" },
  live: { label: "Stage connected", tone: "bg-brand-mint" },
  offline: { label: "Stage unreachable", tone: "bg-destructive" },
};

const SAVE_COPY: Record<SaveStatus, { label: string; tone: string }> = {
  idle: { label: "Not recording yet", tone: "bg-brand-light/40" },
  saved: { label: "Show record synced", tone: "bg-brand-mint" },
  saving: { label: "Saving result", tone: "bg-brand-cyan" },
  error: { label: "Record offline — retrying", tone: "bg-destructive" },
};

/** Command center masthead: event identity, the two things that can go dark. */
export const CommandHeader = ({
  title,
  subtitle,
  logoUrl,
  broadcastStatus,
  saveStatus,
  onOpenRoster,
  onOpenStage,
  onCloseStage,
}: CommandHeaderProps) => {
  const broadcast = broadcastStatus ? BROADCAST_COPY[broadcastStatus] : null;
  const save = saveStatus ? SAVE_COPY[saveStatus] : null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-9 w-auto shrink-0 object-contain brightness-0 invert"
            draggable={false}
          />
        ) : null}
        <div className="min-w-0">
          <p className="text-kicker text-[11px] text-brand-light/45">Command center</p>
          <h1
            className="mt-1 truncate text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: "hsl(var(--text-header-title))" }}
          >
            {title}
          </h1>
          {subtitle ? <p className="mt-0.5 text-sm text-brand-light/45">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {broadcast && save ? (
          <>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-brand-light/12 bg-brand-light/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-light/60"
              title="Realtime connection carrying every action to the stage display"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${broadcast.tone}`} aria-hidden="true" />
              {broadcast.label}
            </span>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-brand-light/12 bg-brand-light/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-light/60"
              title="The durable show record every result is written to"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${save.tone}`} aria-hidden="true" />
              {save.label}
            </span>
          </>
        ) : (
          <span
            className="inline-flex items-center gap-2 rounded-full border border-brand-light/12 bg-brand-light/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-light/60"
            title="Standalone demo build — nothing here is synced or saved anywhere"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" aria-hidden="true" />
            Local demo — not synced
          </span>
        )}
        {onOpenStage ? (
          <Button
            variant="stage"
            size="icon"
            onClick={onOpenStage}
            title="Open the stage display's kiosk window"
            aria-label="Open the stage display"
            className="h-9 w-9 rounded-full"
          >
            <MonitorPlay className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
        {onCloseStage ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="stage"
                size="icon"
                title="Close the stage display's kiosk window"
                aria-label="Close the stage display"
                className="h-9 w-9 rounded-full"
              >
                <MonitorOff className="h-4 w-4" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-brand-light/15 bg-card text-foreground">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Close the stage display?</AlertDialogTitle>
                <AlertDialogDescription className="text-brand-light/60">
                  This blanks the kiosk window on the LED wall right now, in front of the audience.
                  Only do this to fix something — not between draws.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full border-brand-light/20 bg-transparent text-brand-light/80 hover:bg-brand-light/10 hover:text-brand-light">
                  Keep it open
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onCloseStage}
                  className="rounded-full bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
                >
                  Close stage display
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        <Button
          variant="stage"
          size="icon"
          onClick={onOpenRoster}
          title="Roster and branding"
          aria-label="Open roster and branding settings"
          className="h-9 w-9 rounded-full"
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
};
