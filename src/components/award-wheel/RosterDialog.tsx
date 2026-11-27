import { AlertTriangle, Download, Eye, EyeOff, Lock, RotateCcw, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { StagePreview } from "@/components/command-center/StagePreview";
import { brandingCssVars } from "@/hooks/use-apply-branding";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandingPanel } from "./BrandingPanel";
import { LayoutPanel } from "./LayoutPanel";
import { RosterTable } from "./RosterTable";
import { downloadTextFile } from "@/lib/csv";
import {
  companiesFromCsv,
  companiesToCsv,
  createRosterRow,
  parseRosterRows,
  sampleRoster,
} from "@/lib/wheel-roster";
import type { RosterRowDraft } from "@/lib/wheel-roster";
import { configToSettingsCsv, settingsCsvToConfigPatch } from "@/lib/wheel-settings-csv";
import type { AccentName, Branding, Company, DrawPhase, Layout, WheelConfig, Winner } from "@/lib/wheel-types";

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
  /** The live draw's own state, straight from the same hook Control itself reads — for the optional stage preview below. */
  winners: Winner[];
  phase: DrawPhase;
  wheelCompanies: Company[];
  pendingWinner: Winner | null;
  winnerIndex: number;
  phaseChangedAt?: string | null;
};

const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light/45";

const accents: Array<{ id: AccentName; label: string; swatch: string }> = [
  { id: "teal", label: "Teal", swatch: "hsl(var(--swatch-teal))" },
  { id: "blue", label: "Blue", swatch: "hsl(var(--swatch-blue))" },
  { id: "mint", label: "Mint", swatch: "hsl(var(--swatch-mint))" },
];

const parseSize = (value: string): number => Number(value.replace(/[^0-9]/g, ""));

const companiesToRows = (companies: Company[]): RosterRowDraft[] =>
  companies.map((company) => ({
    rowKey: company.id,
    name: company.name,
    short: company.short,
    font: company.font,
  }));

const timestampForFilename = (): string => new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");

/** Operator settings: titles, accent and wall size, the roster, and every brand asset. */
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
  winners,
  phase,
  wheelCompanies,
  pendingWinner,
  winnerIndex,
  phaseChangedAt,
}: RosterDialogProps) => {
  const [title, setTitle] = useState(config.title);
  const [subtitle, setSubtitle] = useState(config.subtitle);
  const [accent, setAccent] = useState<AccentName>(config.accent);
  const [wallWidth, setWallWidth] = useState(String(config.wallWidth));
  const [wallHeight, setWallHeight] = useState(String(config.wallHeight));
  const [rows, setRows] = useState<RosterRowDraft[]>(() => companiesToRows(roster));
  const [branding, setBranding] = useState<Branding>(config.branding);
  const [layout, setLayout] = useState<Layout>(config.layout);
  const [activeTab, setActiveTab] = useState("event");
  const [showPreview, setShowPreview] = useState(false);
  const rosterFileRef = useRef<HTMLInputElement>(null);
  const settingsFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(config.title);
    setSubtitle(config.subtitle);
    setAccent(config.accent);
    setWallWidth(String(config.wallWidth));
    setWallHeight(String(config.wallHeight));
    setRows(companiesToRows(roster));
    setBranding(config.branding);
    setLayout(config.layout);
  }, [open, config, roster]);

  const parsed = useMemo(
    () => parseRosterRows(rows.map((row) => ({ name: row.name, short: row.short }))),
    [rows],
  );
  const isSample =
    roster.length === sampleRoster.length &&
    roster.every((company, index) => company.id === sampleRoster[index]?.id);

  const width = parseSize(wallWidth);
  const height = parseSize(wallHeight);
  const wallOk = width >= 320 && width <= 7680 && height >= 200 && height <= 4320;
  // Unsaved edits, live — the same shape apply() sends to onUpdateConfig, so the
  // preview shows exactly what Apply would produce, before you've clicked it.
  const previewConfig: WheelConfig = {
    ...config,
    title: title.trim() || config.title,
    subtitle: subtitle.trim(),
    accent,
    wallWidth: width,
    wallHeight: height,
    branding,
    layout,
  };
  // The roster itself stays locked mid-show (applyRoster no-ops while winners
  // exist) but titles, accent, wall size and every brand asset are cosmetic
  // and safe to change live, so only a genuinely broken roster blocks Apply.
  const canApply = (rosterLocked || parsed.problems.length === 0) && wallOk;

  const handleImportRosterCsv = (file: File | undefined) => {
    if (!file) return;
    void file
      .text()
      .then((text) => {
        const imported = companiesFromCsv(text);
        if (!imported.length) {
          toast.error("No companies found in that file");
          return;
        }
        setRows(imported.map((entry) => ({ ...createRosterRow(), ...entry })));
        toast.success(`Imported ${imported.length} companies`);
      })
      .catch(() => toast.error(`Could not read "${file.name}"`));
  };

  const handleExportRosterCsv = () => {
    downloadTextFile(`roster-${timestampForFilename()}.csv`, companiesToCsv(parsed.companies));
  };

  const handleExportSettingsCsv = () => {
    downloadTextFile(
      `wheel-settings-${timestampForFilename()}.csv`,
      configToSettingsCsv({
        ...config,
        title,
        subtitle,
        accent,
        wallWidth: width,
        wallHeight: height,
        branding,
        layout,
      }),
    );
  };

  const handleImportSettingsCsv = (file: File | undefined) => {
    if (!file) return;
    void file
      .text()
      .then((text) => {
        const patch = settingsCsvToConfigPatch(text);
        if (patch.title !== undefined) setTitle(patch.title);
        if (patch.subtitle !== undefined) setSubtitle(patch.subtitle);
        if (patch.accent !== undefined) setAccent(patch.accent);
        if (patch.wallWidth !== undefined) setWallWidth(String(patch.wallWidth));
        if (patch.wallHeight !== undefined) setWallHeight(String(patch.wallHeight));
        if (patch.branding !== undefined) setBranding(patch.branding);
        if (patch.layout !== undefined) setLayout(patch.layout);
        toast.success("Settings imported — review, then Apply");
      })
      .catch(() => toast.error(`Could not read "${file.name}"`));
  };

  const apply = () => {
    if (!canApply) return;
    onUpdateConfig({
      title: title.trim() || config.title,
      subtitle: subtitle.trim(),
      accent,
      wallWidth: width,
      wallHeight: height,
      branding,
      layout,
    });
    onApplyRoster(parsed.companies);
    // Branding is iterative — tweak a color, see it land on stage, tweak again — so
    // Apply there shouldn't bounce the operator out of the dialog each time.
    if (activeTab === "branding") {
      toast.success("Branding applied");
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[min(96vw,980px)] max-w-none flex-col gap-0 overflow-hidden rounded-[1.4rem] border-brand-light/15 bg-card/95 p-0 text-foreground shadow-2xl backdrop-blur-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto p-[clamp(16px,2.4vw,40px)]">
        <DialogHeader className="gap-1">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="font-display text-[clamp(18px,1.6vw,28px)] font-extrabold tracking-tight">
                Roster &amp; branding
              </DialogTitle>
              <DialogDescription className="text-[clamp(11px,0.8vw,14px)] text-brand-light/50">
                Everything the audience sees that isn't the draw itself.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={handleExportSettingsCsv}
                title="Download every title, accent, wall-size and branding value as a CSV backup"
              >
                <Download className="mr-1.5 h-3 w-3" aria-hidden="true" />
                Export settings
              </Button>
              <Button
                type="button"
                variant="quiet"
                size="sm"
                className="h-7 rounded-full px-3 text-[11px]"
                onClick={() => settingsFileRef.current?.click()}
                title="Restore titles, accent, wall size and branding from a settings CSV"
              >
                <Upload className="mr-1.5 h-3 w-3" aria-hidden="true" />
                Import settings
              </Button>
              <input
                ref={settingsFileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => handleImportSettingsCsv(event.target.files?.[0])}
              />
            </div>
          </div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="sizing">Sizing</TabsTrigger>
          </TabsList>

          <TabsContent value="event" className="mt-5 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
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

            <div className="grid gap-5 md:grid-cols-2">
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
          </TabsContent>

          <TabsContent value="roster" className="mt-5 grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className={fieldLabel}>Company list</Label>
              <div className="flex items-center gap-2">
                {isSample && (
                  <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-light/60">
                    Placeholder roster
                  </span>
                )}
                <span className="tabular text-[11px] text-brand-light/40">
                  {parsed.companies.length} companies
                </span>
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  className="h-7 rounded-full px-3 text-[11px]"
                  onClick={handleExportRosterCsv}
                  disabled={!parsed.companies.length}
                >
                  <Download className="mr-1.5 h-3 w-3" aria-hidden="true" />
                  Export CSV
                </Button>
                <Button
                  type="button"
                  variant="quiet"
                  size="sm"
                  className="h-7 rounded-full px-3 text-[11px]"
                  onClick={() => rosterFileRef.current?.click()}
                  disabled={rosterLocked}
                >
                  <Upload className="mr-1.5 h-3 w-3" aria-hidden="true" />
                  Import CSV
                </Button>
                <input
                  ref={rosterFileRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  onChange={(event) => handleImportRosterCsv(event.target.files?.[0])}
                />
              </div>
            </div>

            <RosterTable
              rows={rows}
              onChange={setRows}
              disabled={rosterLocked}
              hasCustomFont={Boolean(branding.customFontDataUrl)}
            />

            <p className="text-[11px] leading-relaxed text-brand-light/35">
              Leave "Short" blank to derive it from the name, and "Font" on Default to use the
              wheel's own label font. Import replaces the whole list; export downloads exactly
              what's in the table right now.
            </p>

            {!rosterLocked && (parsed.problems.length > 0 || parsed.warnings.length > 0) && (
              <div className="mt-1 space-y-1.5">
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
          </TabsContent>

          <TabsContent value="branding" className="mt-5">
            <BrandingPanel branding={branding} accent={accent} onChange={setBranding} />
          </TabsContent>

          <TabsContent value="sizing" className="mt-5">
            <LayoutPanel layout={layout} onChange={setLayout} />
          </TabsContent>
        </Tabs>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-brand-light/10 bg-card/95 px-[clamp(16px,2.4vw,40px)] py-4 backdrop-blur-2xl">
          {showPreview ? (
            // Scoped to just this subtree, via inline custom properties — never
            // touches :root, so unsaved edits preview live without the real
            // applied look (elsewhere in this same document) flickering too.
            <div
              className="mx-auto w-full max-w-[380px]"
              style={brandingCssVars(branding) as CSSProperties}
            >
              <StagePreview
                config={previewConfig}
                winners={winners}
                phase={phase}
                wheelCompanies={wheelCompanies}
                pendingWinner={pendingWinner}
                winnerIndex={winnerIndex}
                phaseChangedAt={phaseChangedAt}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-[46ch] text-[11px] leading-relaxed text-brand-light/35">
              Changes apply to the next draw. Saved winners are never re-drawn.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="quiet"
                size="sm"
                className="h-9 rounded-full px-3 text-[11px]"
                onClick={() => setShowPreview((value) => !value)}
              >
                {showPreview ? (
                  <EyeOff className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                )}
                {showPreview ? "Hide preview" : "Show preview"}
              </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
