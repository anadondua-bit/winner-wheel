import { AlertTriangle, Lock, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRoster, parseRoster, sampleRoster } from "@/lib/wheel-roster";
import type { AccentName, Company, WheelConfig } from "@/lib/wheel-types";

type RosterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roster: Company[];
  config: WheelConfig;
  rosterLocked: boolean;
  winnersCount: number;
  onApplyRoster: (companies: Company[]) => void;
  onUpdateConfig: (patch: Partial<Omit<WheelConfig, "totalDraws">>) => void;
  onResetDraw: () => void;
};

const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light/45";

const accents: Array<{ id: AccentName; label: string; swatch: string }> = [
  { id: "teal", label: "Teal", swatch: "hsl(var(--swatch-teal))" },
  { id: "blue", label: "Blue", swatch: "hsl(var(--swatch-blue))" },
  { id: "mint", label: "Mint", swatch: "hsl(var(--swatch-mint))" },
];

const parseSize = (value: string): number => Number(value.replace(/[^0-9]/g, ""));

/** Operator settings: the list, the titles and the guarded rehearsal reset. */
export const RosterDialog = ({
  open,
  onOpenChange,
  roster,
  config,
  rosterLocked,
  winnersCount,
  onApplyRoster,
  onUpdateConfig,
  onResetDraw,
}: RosterDialogProps) => {
  const [title, setTitle] = useState(config.title);
  const [subtitle, setSubtitle] = useState(config.subtitle);
  const [accent, setAccent] = useState<AccentName>(config.accent);
  const [wallWidth, setWallWidth] = useState(String(config.wallWidth));
  const [wallHeight, setWallHeight] = useState(String(config.wallHeight));
  const [rosterText, setRosterText] = useState(() => formatRoster(roster));

  useEffect(() => {
    if (!open) return;
    setTitle(config.title);
    setSubtitle(config.subtitle);
    setAccent(config.accent);
    setWallWidth(String(config.wallWidth));
    setWallHeight(String(config.wallHeight));
    setRosterText(formatRoster(roster));
  }, [open, config, roster]);

  const parsed = useMemo(() => parseRoster(rosterText), [rosterText]);
  const isSample =
    roster.length === sampleRoster.length &&
    roster.every((company, index) => company.id === sampleRoster[index]?.id);

  const width = parseSize(wallWidth);
  const height = parseSize(wallHeight);
  const wallOk = width >= 320 && width <= 7680 && height >= 200 && height <= 4320;
  const canApply = !rosterLocked && parsed.problems.length === 0 && wallOk;

  const apply = () => {
    if (!canApply) return;
    onUpdateConfig({
      title: title.trim() || config.title,
      subtitle: subtitle.trim(),
      accent,
      wallWidth: width,
      wallHeight: height,
    });
    onApplyRoster(parsed.companies);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[min(96vw,980px)] max-w-none gap-0 overflow-y-auto rounded-[1.4rem] border-brand-light/15 bg-card/95 p-[clamp(16px,2.4vw,40px)] text-foreground shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="gap-1">
          <DialogTitle className="font-display text-[clamp(18px,1.6vw,28px)] font-extrabold tracking-tight">
            Roster &amp; branding
          </DialogTitle>
          <DialogDescription className="text-[clamp(11px,0.8vw,14px)] text-brand-light/50">
            One company per line as <span className="text-brand-light/80">Full Name | SHORT</span>.
            Short names are what appears on the wheel; full names appear on the reveal.
          </DialogDescription>
        </DialogHeader>

        {rosterLocked && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[0.9rem] border border-brand-mint/25 bg-brand-mint/[0.07] px-4 py-3">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-mint" aria-hidden="true" />
              <p className="text-[clamp(11px,0.82vw,14px)] leading-relaxed text-brand-light/75">
                The roster is locked while {winnersCount === 1 ? "a result is" : "results are"} on
                screen or saved. Reset the draw to edit the list for a rehearsal.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-destructive/40 bg-transparent text-[clamp(11px,0.8vw,14px)] text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Reset draw
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-brand-light/15 bg-card text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">
                    Clear all {winnersCount} result{winnersCount === 1 ? "" : "s"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-brand-light/60">
                    Every winner is removed and the full roster returns to the wheel. Use this
                    before a rehearsal, never during the ceremony.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full border-brand-light/20 bg-transparent text-brand-light/80 hover:bg-brand-light/10 hover:text-brand-light">
                    Keep results
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onResetDraw}
                    className="rounded-full bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset draw
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="event-title" className={fieldLabel}>
              Event title
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 border-brand-light/15 bg-brand-ink/50 text-brand-light"
              placeholder="Global Innovation Awards"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-subtitle" className={fieldLabel}>
              Stage line
            </Label>
            <Input
              id="event-subtitle"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              className="h-11 border-brand-light/15 bg-brand-ink/50 text-brand-light"
              placeholder="Main Stage · Companies of the Year"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <span className={fieldLabel}>Accent</span>
            <div className="flex gap-2" role="group" aria-label="Conference accent">
              {accents.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccent(option.id)}
                  aria-pressed={accent === option.id}
                  className={`flex-1 rounded-[0.7rem] border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                    accent === option.id
                      ? "border-brand-mint/60 bg-brand-light/10 text-brand-light"
                      : "border-brand-light/12 text-brand-light/45 hover:bg-brand-light/5"
                  }`}
                >
                  <span
                    className="mb-1.5 block h-1.5 w-full rounded-full"
                    style={{ background: option.swatch }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <span className={fieldLabel}>LED wall pixels</span>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                aria-label="Wall width in pixels"
                value={wallWidth}
                onChange={(event) => setWallWidth(event.target.value)}
                className="h-11 border-brand-light/15 bg-brand-ink/50 text-brand-light"
              />
              <span className="text-brand-light/30">×</span>
              <Input
                inputMode="numeric"
                aria-label="Wall height in pixels"
                value={wallHeight}
                onChange={(event) => setWallHeight(event.target.value)}
                className="h-11 border-brand-light/15 bg-brand-ink/50 text-brand-light"
              />
              <span className="text-[11px] text-brand-light/40">px</span>
            </div>
            <p className="text-[11px] leading-relaxed text-brand-light/35">
              {wallOk
                ? `Frame at ${width} × ${height}. The stage is composed for this ratio and fills the wall exactly at this size.`
                : "Use a wall size between 320 × 200 and 7680 × 4320."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="roster" className={fieldLabel}>
              Company list
            </Label>
            <div className="flex items-center gap-2">
              {isSample && (
                <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-light/60">
                  Placeholder roster
                </span>
              )}
              <span className="tabular text-[11px] text-brand-light/40">
                {parsed.companies.length} companies
              </span>
            </div>
          </div>
          <Textarea
            id="roster"
            spellCheck={false}
            value={rosterText}
            onChange={(event) => setRosterText(event.target.value)}
            className="min-h-[clamp(180px,30vh,320px)] resize-y border-brand-light/15 bg-brand-ink/50 font-mono text-[13px] leading-6 text-brand-light/90"
          />
        </div>

        {(parsed.problems.length > 0 || parsed.warnings.length > 0) && (
          <div className="mt-3 space-y-1.5">
            {parsed.problems.map((problem) => (
              <p key={problem} className="flex items-start gap-2 text-[12px] text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {problem}
              </p>
            ))}
            {parsed.warnings.slice(0, 3).map((warning) => (
              <p key={warning} className="flex items-start gap-2 text-[12px] text-brand-light/50">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-cyan" aria-hidden="true" />
                {warning}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-brand-light/10 pt-5">
          <p className="max-w-[46ch] text-[11px] leading-relaxed text-brand-light/35">
            Roster changes apply to the next draw. Saved winners are never re-drawn.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="stage"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="hero"
              className="rounded-full px-6"
              onClick={apply}
              disabled={!canApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
