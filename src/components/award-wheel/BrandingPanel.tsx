import { ClipboardPaste, Copy, Image as ImageIcon, RotateCcw, Type as TypeIcon, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FONT_PRESETS } from "@/lib/wheel-fonts";
import { WHEEL_PART_DEFAULT_HEX, accentDefaultHex, defaultSegmentHex } from "@/lib/wheel-palette";
import { joinRgbaHex, splitRgbaHex } from "@/lib/wheel-color";
import {
  MAX_BACKGROUND_BYTES,
  MAX_FONT_BYTES,
  MAX_LOGO_BYTES,
  readFileAsDataUrl,
  readImageFileFitted,
} from "@/lib/wheel-upload";
import type { AccentName, Branding, FontChoice } from "@/lib/wheel-types";

type BrandingPanelProps = {
  branding: Branding;
  accent: AccentName;
  onChange: (next: Branding) => void;
};

const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light/45";

type AccentDefaults = ReturnType<typeof accentDefaultHex>;

const BRAND_FIELDS: Array<{
  key: "brandMint" | "brandTeal" | "brandCyan" | "brandBlue";
  label: string;
  getDefault: (defaults: AccentDefaults) => string;
}> = [
  { key: "brandMint", label: "Mint", getDefault: (d) => d.mint },
  { key: "brandTeal", label: "Teal", getDefault: (d) => d.teal },
  { key: "brandCyan", label: "Cyan", getDefault: (d) => d.cyan },
  { key: "brandBlue", label: "Blue", getDefault: (d) => d.blue },
];

type FixedColorKey = keyof typeof WHEEL_PART_DEFAULT_HEX;

type FixedColorFieldSpec = { key: FixedColorKey; label: string; description?: string };

const WINNER_SEGMENT_FIELDS: FixedColorFieldSpec[] = [
  { key: "winnerFill", label: "Highlight fill" },
  { key: "winnerLabel", label: "Highlight label" },
];

const RIM_FRAME_FIELDS: FixedColorFieldSpec[] = [
  { key: "rimStart", label: "Rim start" },
  { key: "rimEnd", label: "Rim end" },
  { key: "rimHalo", label: "Rim glow", description: "Soft halo just outside the rim." },
  { key: "rimEdgeLight", label: "Rim highlight", description: "Thin light line on the rim's outer edge." },
  { key: "rimEdgeDark", label: "Rim shadow edge", description: "Thin dark line on the rim's inner edge." },
  { key: "frameShadow", label: "Frame", description: "The shadow ring framing the segments." },
];

const HUB_FIELDS: FixedColorFieldSpec[] = [
  { key: "hub", label: "Hub" },
  { key: "hubRing", label: "Hub ring" },
  { key: "hubEdge", label: "Hub edge" },
  { key: "hubCore", label: "Hub core" },
  { key: "hubDot", label: "Hub dot" },
];

const STUD_FIELDS: FixedColorFieldSpec[] = [
  { key: "stud", label: "Stud" },
  { key: "studRing", label: "Stud ring" },
  { key: "studCore", label: "Stud center" },
];

const SEGMENT_DETAIL_FIELDS: FixedColorFieldSpec[] = [
  { key: "hairline", label: "Divider lines", description: "Thin lines between segments." },
  { key: "labelBright", label: "Label", description: "Default (non-winning) segment text." },
  { key: "labelHalo", label: "Label outline", description: "Dark outline behind every label for legibility." },
];

const CANVAS_TEXT_FIELDS: FixedColorFieldSpec[] = [
  {
    key: "stageText",
    label: "Stage text (fallback)",
    description: "Used by event title, live indicator and winner panel text that hasn't been given its own color.",
  },
  { key: "accentButtons", label: "Accent & buttons", description: "Start spin, live dot and highlights." },
];

type ComponentFontKey =
  | "headerTitleFont"
  | "statusFont"
  | "winnerPanelFont"
  | "winnerStatusFont"
  | "winnerEyebrowFont"
  | "winnerNameFont"
  | "drawCounterFont"
  | "revealedCounterFont"
  | "footerCaptionFont"
  | "bodyHeadlineFont"
  | "bodySubtextFont";

type TextLabelKey =
  | "statusLiveLabel"
  | "statusConnectingLabel"
  | "statusOfflineLabel"
  | "winnerStatusCompleteLabel"
  | "winnerStatusWinnerLabel"
  | "winnerStatusInPlayLabel"
  | "winnerStatusReadyLabel"
  | "winnerStatusNextDrawLabel"
  | "eyebrowWinnerDrawLabel"
  | "eyebrowTurningLabel"
  | "eyebrowInProgressLabel"
  | "eyebrowCeremonyClosedLabel"
  | "eyebrowWheelSetLabel"
  | "eyebrowDrawOfLabel"
  | "drawCounterLabel"
  | "revealedCounterLabel"
  | "footerCaptionRevealedLabel"
  | "footerCaptionCompleteLabel"
  | "footerCaptionLiveLabel"
  | "bodyHeadlineSpinningLabel"
  | "bodyHeadlineCompleteLabel"
  | "bodyHeadlineFirstLabel"
  | "bodyHeadlineNextLabel"
  | "bodySubtextSpinningLabel"
  | "bodySubtextCompleteLabel"
  | "bodySubtextFirstLabel"
  | "bodySubtextNextLabel";

type TextLabelFieldSpec = { key: TextLabelKey; label: string; placeholder: string };

type ComponentColorKey =
  | "headerTitle"
  | "statusText"
  | "winnerPanelText"
  | "winnerStatusColor"
  | "winnerEyebrowColor"
  | "winnerNameColor"
  | "drawCounterColor"
  | "revealedCounterColor"
  | "footerCaptionColor"
  | "bodyHeadlineColor"
  | "bodySubtextColor";

/** Which stage element a per-component row belongs under. */
type ComponentFontGroup = "title" | "status" | "winnerPanel";

const COMPONENT_FONT_FIELDS: Array<{
  key: ComponentFontKey;
  label: string;
  /** Which stage-element section this row renders under. */
  group: ComponentFontGroup;
  textFields?: TextLabelFieldSpec[];
  /** This part's own color override, alongside its font — null inherits "Winner panel" text color. */
  colorKey?: ComponentColorKey;
  /** Swatch shown before an override is picked; the real on-stage default may differ (e.g. mint for the reveal eyebrow/status). */
  colorDefaultHex?: string;
}> = [
  { key: "headerTitleFont", label: "Event title", group: "title", colorKey: "headerTitle", colorDefaultHex: "#EEF2F2" },
  {
    key: "statusFont",
    label: "Live indicator",
    group: "status",
    colorKey: "statusText",
    colorDefaultHex: "#EEF2F2",
    textFields: [
      { key: "statusLiveLabel", label: "Live", placeholder: "Live" },
      { key: "statusConnectingLabel", label: "Connecting", placeholder: "Connecting" },
      { key: "statusOfflineLabel", label: "Offline", placeholder: "Offline" },
    ],
  },
  {
    key: "winnerPanelFont",
    label: "Winner panel (fallback)",
    group: "winnerPanel",
    colorKey: "winnerPanelText",
    colorDefaultHex: "#EEF2F2",
  },
  {
    key: "winnerStatusFont",
    label: "Winner status",
    group: "winnerPanel",
    colorKey: "winnerStatusColor",
    colorDefaultHex: "#4BDDBB",
    textFields: [
      { key: "winnerStatusWinnerLabel", label: "Winner", placeholder: "Winner" },
      { key: "winnerStatusInPlayLabel", label: "In play", placeholder: "In play" },
      { key: "winnerStatusReadyLabel", label: "Ready", placeholder: "Ready" },
      { key: "winnerStatusNextDrawLabel", label: "Next draw", placeholder: "Next draw" },
      { key: "winnerStatusCompleteLabel", label: "Draw complete", placeholder: "Draw complete" },
    ],
  },
  {
    key: "drawCounterFont",
    label: "Draw counter",
    group: "winnerPanel",
    colorKey: "drawCounterColor",
    colorDefaultHex: "#EEF2F2",
    textFields: [{ key: "drawCounterLabel", label: "Prefix word", placeholder: "DRAW" }],
  },
  {
    key: "winnerEyebrowFont",
    label: "Draw eyebrow",
    group: "winnerPanel",
    colorKey: "winnerEyebrowColor",
    colorDefaultHex: "#4BDDBB",
    textFields: [
      { key: "eyebrowWinnerDrawLabel", label: "Winner reveal", placeholder: "Winner · draw" },
      { key: "eyebrowTurningLabel", label: "First spin", placeholder: "The wheel is turning" },
      { key: "eyebrowInProgressLabel", label: "Spinning", placeholder: "Draw in progress" },
      { key: "eyebrowWheelSetLabel", label: "Before first draw", placeholder: "The wheel is set" },
      { key: "eyebrowDrawOfLabel", label: "Between draws ({n}/{m})", placeholder: "Draw {n} of {m}" },
      { key: "eyebrowCeremonyClosedLabel", label: "All done", placeholder: "Ceremony draw closed" },
    ],
  },
  {
    key: "winnerNameFont",
    label: "Winner name",
    group: "winnerPanel",
    colorKey: "winnerNameColor",
    colorDefaultHex: "#EEF2F2",
  },
  {
    key: "bodyHeadlineFont",
    label: "Body headline",
    group: "winnerPanel",
    colorKey: "bodyHeadlineColor",
    colorDefaultHex: "#EEF2F2",
    textFields: [
      { key: "bodyHeadlineSpinningLabel", label: "Spinning ({n})", placeholder: "{n} companies" },
      { key: "bodyHeadlineCompleteLabel", label: "All done ({n})", placeholder: "All {n} winners announced" },
      { key: "bodyHeadlineFirstLabel", label: "Before first draw", placeholder: "Let the draw begin" },
      { key: "bodyHeadlineNextLabel", label: "Between draws", placeholder: "Ready for the next name" },
    ],
  },
  {
    key: "bodySubtextFont",
    label: "Body subtext",
    group: "winnerPanel",
    colorKey: "bodySubtextColor",
    colorDefaultHex: "#EEF2F2",
    textFields: [
      { key: "bodySubtextSpinningLabel", label: "Spinning", placeholder: "Still on the wheel for this draw." },
      { key: "bodySubtextCompleteLabel", label: "All done ({n})", placeholder: "{n} companies remain on the wheel." },
      {
        key: "bodySubtextFirstLabel",
        label: "Before first draw ({n}/{m})",
        placeholder: "{n} companies on the wheel · {m} winners to reveal",
      },
      {
        key: "bodySubtextNextLabel",
        label: "Between draws ({n}/{m})",
        placeholder: "{n} companies in play · {m} reveals to go",
      },
    ],
  },
  {
    key: "footerCaptionFont",
    label: "Footer caption",
    group: "winnerPanel",
    colorKey: "footerCaptionColor",
    colorDefaultHex: "#EEF2F2",
    textFields: [
      { key: "footerCaptionRevealedLabel", label: "After a reveal ({time})", placeholder: "Revealed {time}" },
      { key: "footerCaptionCompleteLabel", label: "All done", placeholder: "Further spins disabled" },
      { key: "footerCaptionLiveLabel", label: "Otherwise", placeholder: "Main stage · live" },
    ],
  },
  {
    key: "revealedCounterFont",
    label: "Revealed counter",
    group: "winnerPanel",
    colorKey: "revealedCounterColor",
    colorDefaultHex: "#EEF2F2",
    textFields: [{ key: "revealedCounterLabel", label: "Suffix word", placeholder: "REVEALED" }],
  },
];

/** Renders the subset of COMPONENT_FONT_FIELDS belonging to one stage-element section. */
const fontFieldsByGroup = (group: ComponentFontGroup) => COMPONENT_FONT_FIELDS.filter((f) => f.group === group);

/** Separate from the above since it lives in the Wheel section, not the stage-text list. */
const WHEEL_LABEL_FONT_FIELD = { key: "wheelLabelFont" as const, label: "Segment names" };

const PANEL_TINT_FIELDS: FixedColorFieldSpec[] = [
  { key: "tintWinnerPanel", label: "Winner panel", description: "The large result card." },
  {
    key: "tintWinnerPanelEnd",
    label: "Winner panel (fade to)",
    description: "The color the Winner panel's gradient fades into at the bottom.",
  },
];

type ColorClipboardProps = {
  /** This swatch's current hex (what "Copy" grabs). */
  hex: string;
  /** The shared clipboard value, null until something's been copied. */
  copied: string | null;
  onCopy: (hex: string) => void;
  onPaste: (hex: string) => void;
};

/** Copy this swatch's color, or paste the last-copied one onto it — the same two buttons on every color field. */
const ColorClipboardActions = ({ hex, copied, onCopy, onPaste }: ColorClipboardProps) => (
  <>
    <button
      type="button"
      onClick={() => onCopy(hex)}
      title="Copy color"
      className="shrink-0 text-brand-light/30 hover:text-brand-light/70"
    >
      <Copy className="h-3 w-3" aria-hidden="true" />
    </button>
    <button
      type="button"
      onClick={() => copied && onPaste(copied)}
      disabled={!copied}
      title={copied ? `Paste ${copied}` : "Copy a color first"}
      className="shrink-0 text-brand-light/30 hover:text-brand-light/70 disabled:opacity-20 disabled:hover:text-brand-light/30"
    >
      <ClipboardPaste className="h-3 w-3" aria-hidden="true" />
    </button>
  </>
);

type ColorPickerFieldProps = {
  label: string;
  description?: string;
  value: string;
  overridden: boolean;
  onPick: (hex: string) => void;
  onReset: () => void;
  copiedColor: string | null;
  onCopyColor: (hex: string) => void;
};

/** One labeled swatch with an optional description line, copy/paste and a reset-to-default action. */
const ColorPickerField = ({
  label,
  description,
  value,
  overridden,
  onPick,
  onReset,
  copiedColor,
  onCopyColor,
}: ColorPickerFieldProps) => (
  <div className="flex items-center gap-3 rounded-[0.7rem] border border-brand-light/12 px-3 py-2.5">
    <input
      type="color"
      value={value}
      onChange={(event) => onPick(event.target.value)}
      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-brand-light/20 bg-transparent p-0"
      aria-label={label}
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-[12px] font-semibold text-brand-light/80">{label}</p>
      {description ? <p className="truncate text-[10.5px] text-brand-light/40">{description}</p> : null}
    </div>
    <ColorClipboardActions hex={value} copied={copiedColor} onCopy={onCopyColor} onPaste={onPick} />
    {overridden ? (
      <button
        type="button"
        onClick={onReset}
        title="Reset to default"
        className="shrink-0 text-brand-light/30 hover:text-brand-light/70"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    ) : null}
  </div>
);

type RgbaPickerFieldProps = {
  label: string;
  description?: string;
  hex: string;
  alpha: number;
  overridden: boolean;
  onPick: (hex: string, alpha: number) => void;
  onReset: () => void;
  copiedColor: string | null;
  onCopyColor: (hex: string) => void;
  /** An independent on/off switch for this field, shown above the slider — e.g. "show this at all." */
  toggle?: { checked: boolean; label: string; onChange: (checked: boolean) => void };
};

/**
 * Same as ColorPickerField, plus an alpha slider — the color's own transparency,
 * not a fixed one baked into the CSS. Paste only ever touches the hue, never
 * the opacity you've already dialed in here.
 */
const RgbaPickerField = ({
  label,
  description,
  hex,
  alpha,
  overridden,
  onPick,
  onReset,
  copiedColor,
  onCopyColor,
  toggle,
}: RgbaPickerFieldProps) => (
  <div className="flex items-center gap-3 rounded-[0.7rem] border border-brand-light/12 px-3 py-2.5">
    <input
      type="color"
      value={hex}
      onChange={(event) => onPick(event.target.value, alpha)}
      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-brand-light/20 bg-transparent p-0"
      aria-label={label}
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[12px] font-semibold text-brand-light/80">{label}</p>
        {toggle ? (
          <label className="flex shrink-0 items-center gap-1.5 text-[10.5px] text-brand-light/40">
            {toggle.label}
            <input
              type="checkbox"
              checked={toggle.checked}
              onChange={(event) => toggle.onChange(event.target.checked)}
              className="h-3 w-3 cursor-pointer accent-brand-teal"
            />
          </label>
        ) : null}
      </div>
      {description ? <p className="truncate text-[10.5px] text-brand-light/40">{description}</p> : null}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(alpha * 100)}
          onChange={(event) => onPick(hex, Number(event.target.value) / 100)}
          className="h-1 flex-1 accent-brand-teal"
          aria-label={`${label} opacity`}
        />
        <span className="w-9 shrink-0 text-right text-[10.5px] tabular-nums text-brand-light/40">
          {Math.round(alpha * 100)}%
        </span>
      </div>
    </div>
    <ColorClipboardActions
      hex={hex}
      copied={copiedColor}
      onCopy={onCopyColor}
      onPaste={(pasted) => onPick(pasted, alpha)}
    />
    {overridden ? (
      <button
        type="button"
        onClick={onReset}
        title="Reset to default"
        className="shrink-0 text-brand-light/30 hover:text-brand-light/70"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    ) : null}
  </div>
);

type OpacitySliderFieldProps = {
  label: string;
  description?: string;
  value: number;
  overridden: boolean;
  onChange: (value: number) => void;
  onReset: () => void;
};

/** A single opacity slider with no color of its own — for chrome like a border that only ever fades in/out. */
const OpacitySliderField = ({
  label,
  description,
  value,
  overridden,
  onChange,
  onReset,
}: OpacitySliderFieldProps) => (
  <div className="flex items-center gap-3 rounded-[0.7rem] border border-brand-light/12 px-3 py-2.5">
    <div className="min-w-0 flex-1">
      <p className="truncate text-[12px] font-semibold text-brand-light/80">{label}</p>
      {description ? <p className="truncate text-[10.5px] text-brand-light/40">{description}</p> : null}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
          className="h-1 flex-1 accent-brand-teal"
          aria-label={`${label} opacity`}
        />
        <span className="w-9 shrink-0 text-right text-[10.5px] tabular-nums text-brand-light/40">
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
    {overridden ? (
      <button
        type="button"
        onClick={onReset}
        title="Reset to default"
        className="shrink-0 text-brand-light/30 hover:text-brand-light/70"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    ) : null}
  </div>
);

type FontOverrideFieldProps = {
  label: string;
  value: FontChoice | null;
  hasCustomFont: boolean;
  onChange: (value: FontChoice | null) => void;
  children?: ReactNode;
  /** This part's own color, shown as a swatch next to the font select; omit the whole group to skip it. */
  color?: {
    value: string | null;
    defaultHex: string;
    onPick: (hex: string) => void;
    onReset: () => void;
    copiedColor: string | null;
    onCopyColor: (hex: string) => void;
  };
};

/** Lets one component use a different font (and color) from the base choice above; null inherits it. */
const FontOverrideField = ({ label, value, hasCustomFont, onChange, children, color }: FontOverrideFieldProps) => (
  <div className="grid gap-2 rounded-[0.7rem] border border-brand-light/12 px-3 py-2.5">
    <div className="flex items-center justify-between gap-3">
      <p className="truncate text-[12px] font-semibold text-brand-light/80">{label}</p>
      <div className="flex shrink-0 items-center gap-1.5">
        {color ? (
          <>
            <input
              type="color"
              value={color.value ?? color.defaultHex}
              onChange={(event) => color.onPick(event.target.value)}
              className="h-7 w-7 cursor-pointer rounded border border-brand-light/20 bg-transparent p-0"
              aria-label={`${label} color`}
            />
            <ColorClipboardActions
              hex={color.value ?? color.defaultHex}
              copied={color.copiedColor}
              onCopy={color.onCopyColor}
              onPaste={color.onPick}
            />
            {color.value ? (
              <button
                type="button"
                onClick={color.onReset}
                title="Reset color to default"
                className="text-brand-light/30 hover:text-brand-light/70"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              </button>
            ) : null}
          </>
        ) : null}
        <select
          value={value ?? ""}
          onChange={(event) => onChange((event.target.value || null) as FontChoice | null)}
          className="h-8 shrink-0 rounded-md border border-brand-light/15 bg-brand-ink/60 px-2 text-[11px] text-brand-light"
          aria-label={`${label} font`}
        >
          <option value="">Default</option>
          {FONT_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          {hasCustomFont ? <option value="custom">Custom upload</option> : null}
        </select>
      </div>
    </div>
    {children}
  </div>
);

type LabelTextFieldProps = {
  label: string;
  placeholder: string;
  value: string | null;
  onChange: (next: string | null) => void;
};

/** One editable word/phrase — the built-in default shows as a placeholder until overridden. */
const LabelTextField = ({ label, placeholder, value, onChange }: LabelTextFieldProps) => (
  <div className="flex items-center gap-2">
    <span className="w-[8rem] shrink-0 truncate text-[10.5px] text-brand-light/40">{label}</span>
    <input
      type="text"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value || null)}
      className="h-7 flex-1 rounded-md border border-brand-light/12 bg-brand-ink/40 px-2 text-[11px] text-brand-light placeholder:text-brand-light/30"
    />
  </div>
);

/** Logo, background, display font and every brand/segment color, each independently editable. */
export const BrandingPanel = ({ branding, accent, onChange }: BrandingPanelProps) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  /** Shared across every color field on this panel — copy one, paste it onto any other. */
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const accentDefaults = accentDefaultHex(accent);
  const segmentDefaults = defaultSegmentHex();

  const statusFillParsed =
    (branding.statusFillColor ? splitRgbaHex(branding.statusFillColor) : null) ??
    splitRgbaHex(WHEEL_PART_DEFAULT_HEX.statusFillColor) ?? { hex: "#000000", alpha: 1 };
  const statusOutlineParsed =
    (branding.statusOutlineColor ? splitRgbaHex(branding.statusOutlineColor) : null) ??
    splitRgbaHex(WHEEL_PART_DEFAULT_HEX.statusOutlineColor) ?? { hex: "#000000", alpha: 1 };

  const renderFixedField = (field: FixedColorFieldSpec) => {
    const override = branding[field.key];
    return (
      <ColorPickerField
        key={field.key}
        label={field.label}
        description={field.description}
        value={override ?? WHEEL_PART_DEFAULT_HEX[field.key]}
        overridden={Boolean(override)}
        onPick={(hex) => onChange({ ...branding, [field.key]: hex })}
        onReset={() => onChange({ ...branding, [field.key]: null })}
        copiedColor={copiedColor}
        onCopyColor={setCopiedColor}
      />
    );
  };

  const renderTintField = (field: FixedColorFieldSpec) => {
    const override = branding[field.key];
    const defaultHex = WHEEL_PART_DEFAULT_HEX[field.key];
    // A plain 6-digit default means "no alpha suffix" → splitRgbaHex reports alpha 1,
    // which is right for tintWinnerPanel (alpha there is a 0–1 intensity
    // multiplier, not a literal opacity). An 8-digit default like
    // tintWinnerPanelEnd's carries its own real default alpha instead.
    const fallback = splitRgbaHex(defaultHex) ?? { hex: defaultHex, alpha: 1 };
    const parsed = (override ? splitRgbaHex(override) : null) ?? fallback;
    return (
      <RgbaPickerField
        key={field.key}
        label={field.label}
        description={field.description}
        hex={parsed.hex}
        alpha={parsed.alpha}
        overridden={Boolean(override)}
        onPick={(hex, alpha) => onChange({ ...branding, [field.key]: joinRgbaHex(hex, alpha) })}
        onReset={() => onChange({ ...branding, [field.key]: null })}
        copiedColor={copiedColor}
        onCopyColor={setCopiedColor}
      />
    );
  };

  const withUploadError = async (task: () => Promise<void>) => {
    try {
      await task();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that file");
    }
  };

  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    void withUploadError(async () => {
      const dataUrl = await readFileAsDataUrl(file, MAX_LOGO_BYTES);
      onChange({ ...branding, logoDataUrl: dataUrl });
    });
  };

  const handleBackgroundFile = (file: File | undefined) => {
    if (!file) return;
    void withUploadError(async () => {
      const wasOversized = file.size > MAX_BACKGROUND_BYTES;
      const dataUrl = await readImageFileFitted(file, MAX_BACKGROUND_BYTES);
      onChange({ ...branding, backgroundDataUrl: dataUrl });
      if (wasOversized) {
        toast.success(`"${file.name}" was compressed to fit the ${Math.round(MAX_BACKGROUND_BYTES / 1024)} KB live-sync limit.`);
      }
    });
  };

  const handleFontFile = (file: File | undefined) => {
    if (!file) return;
    void withUploadError(async () => {
      const dataUrl = await readFileAsDataUrl(file, MAX_FONT_BYTES);
      onChange({ ...branding, font: "custom", customFontDataUrl: dataUrl, customFontName: file.name });
    });
  };

  const setSegmentColor = (index: number, hex: string) => {
    const next = branding.segmentColors.slice();
    next[index] = hex;
    onChange({ ...branding, segmentColors: next });
  };

  const resetSegmentColor = (index: number) => {
    const next = branding.segmentColors.slice();
    next[index] = null;
    onChange({ ...branding, segmentColors: next });
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <span className={fieldLabel}>Logo</span>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-brand-light/20 bg-brand-ink/40">
            {branding.logoDataUrl ? (
              <img
                src={branding.logoDataUrl}
                alt=""
                className="max-h-full max-w-full object-contain p-1.5"
                draggable={false}
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-brand-light/25" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant="stage"
              size="sm"
              className="rounded-full"
              onClick={() => logoInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Upload logo
            </Button>
            {branding.logoDataUrl ? (
              <button
                type="button"
                onClick={() => onChange({ ...branding, logoDataUrl: null })}
                className="text-left text-[11px] text-brand-light/40 hover:text-brand-light/70"
              >
                Remove
              </button>
            ) : (
              <span className="text-[11px] text-brand-light/35">
                PNG, JPG, WebP or SVG — up to {Math.round(MAX_LOGO_BYTES / 1024)} KB
              </span>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(event) => handleLogoFile(event.target.files?.[0])}
          />
        </div>
      </section>

      <section className="grid gap-2">
        <span className={fieldLabel}>Stage background</span>
        <div className="flex items-center gap-3">
          <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-brand-light/15 bg-brand-ink/40">
            <img
              src={branding.backgroundDataUrl || "/brand/reveal.jpg"}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant="stage"
              size="sm"
              className="rounded-full"
              onClick={() => backgroundInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Upload background
            </Button>
            {branding.backgroundDataUrl ? (
              <button
                type="button"
                onClick={() => onChange({ ...branding, backgroundDataUrl: null })}
                className="text-left text-[11px] text-brand-light/40 hover:text-brand-light/70"
              >
                Reset to default
              </button>
            ) : (
              <span className="text-[11px] text-brand-light/35">
                JPG, PNG or WebP — larger images are compressed automatically to fit the live
                sync limit (~{Math.round(MAX_BACKGROUND_BYTES / 1024 / 1024 * 10) / 10} MB)
              </span>
            )}
          </div>
          <input
            ref={backgroundInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => handleBackgroundFile(event.target.files?.[0])}
          />
        </div>
      </section>

      <section className="grid gap-2">
        <span className={fieldLabel}>Display font</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Display font">
          {FONT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...branding, font: preset.id })}
              aria-pressed={branding.font === preset.id}
              className={`rounded-[0.7rem] border px-3 py-2 text-[12px] font-semibold transition-colors ${
                branding.font === preset.id
                  ? "border-brand-mint/60 bg-brand-light/10 text-brand-light"
                  : "border-brand-light/12 text-brand-light/55 hover:bg-brand-light/5"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fontInputRef.current?.click()}
            aria-pressed={branding.font === "custom"}
            className={`inline-flex max-w-[14rem] items-center gap-1.5 rounded-[0.7rem] border px-3 py-2 text-[12px] font-semibold transition-colors ${
              branding.font === "custom"
                ? "border-brand-mint/60 bg-brand-light/10 text-brand-light"
                : "border-brand-light/12 text-brand-light/55 hover:bg-brand-light/5"
            }`}
          >
            <TypeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {branding.font === "custom" && branding.customFontName
                ? branding.customFontName
                : "Upload font…"}
            </span>
          </button>
          <input
            ref={fontInputRef}
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            className="hidden"
            onChange={(event) => handleFontFile(event.target.files?.[0])}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-brand-light/35">
          Presets use fonts already on this machine, so they work offline. A custom upload is
          registered in the browser and travels with the show record. Every per-component font
          below falls back to this one; Event title, Live indicator and Winner panel also have
          their own color, right next to their font.
        </p>
      </section>

      <section className="grid gap-2">
        <span className={fieldLabel}>Brand colors</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BRAND_FIELDS.map((field) => {
            const override = branding[field.key];
            const value = override ?? field.getDefault(accentDefaults);
            return (
              <div
                key={field.key}
                className="flex items-center gap-2 rounded-[0.7rem] border border-brand-light/12 px-2.5 py-2"
              >
                <input
                  type="color"
                  value={value}
                  onChange={(event) => onChange({ ...branding, [field.key]: event.target.value })}
                  className="h-7 w-7 shrink-0 cursor-pointer rounded border border-brand-light/20 bg-transparent p-0"
                  aria-label={field.label}
                />
                <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-brand-light/70">
                  {field.label}
                </p>
                <ColorClipboardActions
                  hex={value}
                  copied={copiedColor}
                  onCopy={setCopiedColor}
                  onPaste={(hex) => onChange({ ...branding, [field.key]: hex })}
                />
                {override ? (
                  <button
                    type="button"
                    onClick={() => onChange({ ...branding, [field.key]: null })}
                    title="Reset to theme default"
                    className="shrink-0 text-brand-light/30 hover:text-brand-light/70"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-2">
        <span className={fieldLabel}>Stage text</span>
        <p className="text-[11px] leading-relaxed text-brand-light/35">
          Never affects the command center's own screen, only the LED wall.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CANVAS_TEXT_FIELDS.map(renderFixedField)}
        </div>
      </section>

      <section className="grid gap-2">
        <span className={fieldLabel}>Event title</span>
        <p className="text-[11px] leading-relaxed text-brand-light/35">
          The event name, bottom left. Font and color together.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {fontFieldsByGroup("title").map((field) => (
            <FontOverrideField
              key={field.key}
              label={field.label}
              value={branding[field.key]}
              hasCustomFont={Boolean(branding.customFontDataUrl)}
              onChange={(value) => onChange({ ...branding, [field.key]: value })}
              color={
                field.colorKey && field.colorDefaultHex
                  ? {
                      value: branding[field.colorKey],
                      defaultHex: field.colorDefaultHex,
                      onPick: (hex) => onChange({ ...branding, [field.colorKey as ComponentColorKey]: hex }),
                      onReset: () => onChange({ ...branding, [field.colorKey as ComponentColorKey]: null }),
                      copiedColor,
                      onCopyColor: setCopiedColor,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="grid gap-2">
        <span className={fieldLabel}>Live indicator</span>
        <p className="text-[11px] leading-relaxed text-brand-light/35">
          The status pill, top left — font, color and every word it can show.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {fontFieldsByGroup("status").map((field) => (
            <FontOverrideField
              key={field.key}
              label={field.label}
              value={branding[field.key]}
              hasCustomFont={Boolean(branding.customFontDataUrl)}
              onChange={(value) => onChange({ ...branding, [field.key]: value })}
              color={
                field.colorKey && field.colorDefaultHex
                  ? {
                      value: branding[field.colorKey],
                      defaultHex: field.colorDefaultHex,
                      onPick: (hex) => onChange({ ...branding, [field.colorKey as ComponentColorKey]: hex }),
                      onReset: () => onChange({ ...branding, [field.colorKey as ComponentColorKey]: null }),
                      copiedColor,
                      onCopyColor: setCopiedColor,
                    }
                  : undefined
              }
            >
              {field.textFields?.map((textField) => (
                <LabelTextField
                  key={textField.key}
                  label={textField.label}
                  placeholder={textField.placeholder}
                  value={branding[textField.key]}
                  onChange={(next) => onChange({ ...branding, [textField.key]: next })}
                />
              ))}
            </FontOverrideField>
          ))}
        </div>

        <span className={`${fieldLabel} mt-3`}>Pill chrome</span>
        <p className="text-[11px] leading-relaxed text-brand-light/35">
          The pill's own fill and outline — each can be switched off entirely, independent of its
          color. The dot tracks live/connecting/offline unless given its own color here.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <RgbaPickerField
            label="Fill"
            description="The pill's own background."
            hex={statusFillParsed.hex}
            alpha={statusFillParsed.alpha}
            overridden={Boolean(branding.statusFillColor)}
            onPick={(hex, alpha) => onChange({ ...branding, statusFillColor: joinRgbaHex(hex, alpha) })}
            onReset={() => onChange({ ...branding, statusFillColor: null })}
            copiedColor={copiedColor}
            onCopyColor={setCopiedColor}
            toggle={{
              checked: branding.statusFillEnabled,
              label: "Show",
              onChange: (checked) => onChange({ ...branding, statusFillEnabled: checked }),
            }}
          />
          <RgbaPickerField
            label="Outline"
            description="The pill's own edge."
            hex={statusOutlineParsed.hex}
            alpha={statusOutlineParsed.alpha}
            overridden={Boolean(branding.statusOutlineColor)}
            onPick={(hex, alpha) => onChange({ ...branding, statusOutlineColor: joinRgbaHex(hex, alpha) })}
            onReset={() => onChange({ ...branding, statusOutlineColor: null })}
            copiedColor={copiedColor}
            onCopyColor={setCopiedColor}
            toggle={{
              checked: branding.statusOutlineEnabled,
              label: "Show",
              onChange: (checked) => onChange({ ...branding, statusOutlineEnabled: checked }),
            }}
          />
          <ColorPickerField
            label="Dot"
            description="The small signal dot inside the pill."
            value={branding.statusDotColor ?? WHEEL_PART_DEFAULT_HEX.statusDotColor}
            overridden={Boolean(branding.statusDotColor)}
            onPick={(hex) => onChange({ ...branding, statusDotColor: hex })}
            onReset={() => onChange({ ...branding, statusDotColor: null })}
            copiedColor={copiedColor}
            onCopyColor={setCopiedColor}
          />
        </div>
      </section>

      <section className="grid gap-5 rounded-[1rem] border border-brand-light/10 bg-brand-light/[0.02] p-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-light/75">
            Winner panel
          </span>
          <p className="mt-0.5 text-[11px] leading-relaxed text-brand-light/35">
            The large result card: its own background and border, then every piece of text inside
            it, in the order it reads on stage. Numbers in curly braces, like <code>{"{n}"}</code>{" "}
            or <code>{"{time}"}</code>, get replaced automatically — keep them somewhere in the word
            if you change it. The winner's name is roster data, so only its font and color are
            editable, not its wording.
          </p>
        </div>

        <div className="grid gap-2">
          <span className={fieldLabel}>Card</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PANEL_TINT_FIELDS.map(renderTintField)}
          </div>
          <OpacitySliderField
            label="Winner panel border"
            description="The card's edge outline, on stage and in the command center's mini preview."
            value={branding.winnerPanelBorderOpacity ?? 0.14}
            overridden={branding.winnerPanelBorderOpacity !== null}
            onChange={(value) => onChange({ ...branding, winnerPanelBorderOpacity: value })}
            onReset={() => onChange({ ...branding, winnerPanelBorderOpacity: null })}
          />
        </div>

        <div className="grid gap-2">
          <span className={fieldLabel}>Text</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fontFieldsByGroup("winnerPanel").map((field) => (
              <FontOverrideField
                key={field.key}
                label={field.label}
                value={branding[field.key]}
                hasCustomFont={Boolean(branding.customFontDataUrl)}
                onChange={(value) => onChange({ ...branding, [field.key]: value })}
                color={
                  field.colorKey && field.colorDefaultHex
                    ? {
                        value: branding[field.colorKey],
                        defaultHex: field.colorDefaultHex,
                        onPick: (hex) => onChange({ ...branding, [field.colorKey as ComponentColorKey]: hex }),
                        onReset: () => onChange({ ...branding, [field.colorKey as ComponentColorKey]: null }),
                        copiedColor,
                        onCopyColor: setCopiedColor,
                      }
                    : undefined
                }
              >
                {field.textFields?.map((textField) => (
                  <LabelTextField
                    key={textField.key}
                    label={textField.label}
                    placeholder={textField.placeholder}
                    value={branding[textField.key]}
                    onChange={(next) => onChange({ ...branding, [textField.key]: next })}
                  />
                ))}
              </FontOverrideField>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-[1rem] border border-brand-light/10 bg-brand-light/[0.02] p-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-light/75">
            Wheel
          </span>
          <p className="mt-0.5 text-[11px] leading-relaxed text-brand-light/35">
            Every part of the physical wheel graphic — the segments, the winning highlight, the rim
            and frame around them, the hub, and the rivet studs.
          </p>
        </div>

        <div className="grid gap-2">
          <span className={fieldLabel}>Winning segment</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {WINNER_SEGMENT_FIELDS.map(renderFixedField)}
          </div>
        </div>

        <div className="grid gap-2">
          <span className={fieldLabel}>Segment detail</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SEGMENT_DETAIL_FIELDS.map(renderFixedField)}
            <FontOverrideField
              label={WHEEL_LABEL_FONT_FIELD.label}
              value={branding[WHEEL_LABEL_FONT_FIELD.key]}
              hasCustomFont={Boolean(branding.customFontDataUrl)}
              onChange={(value) => onChange({ ...branding, [WHEEL_LABEL_FONT_FIELD.key]: value })}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <span className={fieldLabel}>Rim &amp; frame</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RIM_FRAME_FIELDS.map(renderFixedField)}
          </div>
        </div>

        <div className="grid gap-2">
          <span className={fieldLabel}>Hub</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {HUB_FIELDS.map(renderFixedField)}
          </div>
        </div>

        <div className="grid gap-2">
          <span className={fieldLabel}>Studs</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STUD_FIELDS.map(renderFixedField)}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className={fieldLabel}>Wheel segment colors</span>
            <button
              type="button"
              onClick={() =>
                onChange({ ...branding, segmentColors: branding.segmentColors.map(() => null) })
              }
              className="text-[11px] text-brand-light/40 hover:text-brand-light/70"
            >
              Reset all
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-brand-light/35">
            Cycles across however many companies are on the wheel.
          </p>

          <div className="flex items-center gap-3 rounded-[0.7rem] border border-brand-light/12 px-3 py-2">
            <label htmlFor="segment-color-count" className="text-[11px] font-semibold text-brand-light/70">
              Number of wheel colors
            </label>
            <input
              id="segment-color-count"
              type="range"
              min={2}
              max={segmentDefaults.length}
              value={branding.segmentColorCount}
              onChange={(event) =>
                onChange({ ...branding, segmentColorCount: Number(event.target.value) })
              }
              className="h-1.5 flex-1 accent-brand-mint"
            />
            <span className="tabular w-5 text-right text-[12px] font-semibold text-brand-light">
              {branding.segmentColorCount}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-brand-light/35">
            Fewer colors repeat the pattern sooner for a bolder, more graphic wheel. Dimmed swatches
            below aren't currently used.
          </p>

          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-10">
            {branding.segmentColors.map((hex, index) => (
              <div
                key={index}
                className={`flex flex-col items-center gap-1 ${
                  index >= branding.segmentColorCount ? "opacity-35" : ""
                }`}
              >
                <input
                  type="color"
                  value={hex ?? segmentDefaults[index]}
                  onChange={(event) => setSegmentColor(index, event.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-md border border-brand-light/20 bg-transparent p-0"
                  aria-label={`Segment ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => resetSegmentColor(index)}
                  className={`text-[9px] ${hex ? "text-brand-light/45 hover:text-brand-light/80" : "text-brand-light/20"}`}
                  disabled={!hex}
                >
                  {index + 1}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
