import { Image as ImageIcon, RotateCcw, Type as TypeIcon, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { accentDefaultHex, defaultSegmentHex } from "@/lib/wheel-palette";
import { MAX_BACKGROUND_BYTES, MAX_FONT_BYTES, MAX_LOGO_BYTES, readFileAsDataUrl } from "@/lib/wheel-upload";
import type { AccentName, Branding, FontChoice } from "@/lib/wheel-types";

type BrandingPanelProps = {
  branding: Branding;
  accent: AccentName;
  onChange: (next: Branding) => void;
};

const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light/45";

const FONT_PRESETS: Array<{ id: Exclude<FontChoice, "custom">; label: string }> = [
  { id: "manrope", label: "Manrope" },
  { id: "system-sans", label: "System sans" },
  { id: "system-serif", label: "Serif" },
  { id: "system-mono", label: "Mono" },
];

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

/** Logo, background, display font and every brand/segment color, each independently editable. */
export const BrandingPanel = ({ branding, accent, onChange }: BrandingPanelProps) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const accentDefaults = accentDefaultHex(accent);
  const segmentDefaults = defaultSegmentHex();

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
      const dataUrl = await readFileAsDataUrl(file, MAX_BACKGROUND_BYTES);
      onChange({ ...branding, backgroundDataUrl: dataUrl });
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
                JPG, PNG or WebP — up to {Math.round(MAX_BACKGROUND_BYTES / 1024)} KB
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
          registered in the browser and travels with the show record.
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
        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-10">
          {branding.segmentColors.map((hex, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
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
      </section>
    </div>
  );
};
