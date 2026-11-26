import { RotateCcw } from "lucide-react";
import { defaultLayout } from "@/lib/wheel-roster";
import type { Layout } from "@/lib/wheel-types";

type LayoutPanelProps = {
  layout: Layout;
  onChange: (next: Layout) => void;
};

const fieldLabel = "text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-light/45";

const SCALE_FIELDS: Array<{ key: keyof Layout; label: string; description: string }> = [
  { key: "logoScale", label: "Logo", description: "The conference logo, top right." },
  {
    key: "statusScale",
    label: "Live indicator",
    description: "The \"Live\" pill and the fullscreen button beside it.",
  },
  { key: "wheelScale", label: "Wheel", description: "The spinning wheel graphic." },
  {
    key: "winnerPanelScale",
    label: "Winner panel",
    description: "The result card on the right, text included.",
  },
  { key: "titleScale", label: "Event title", description: "The event name, bottom left." },
];

const MIN_SCALE = 0.7;
const MAX_SCALE = 1.4;

/** One slider per main-stage component, scaling its size (and any text inside it) as a unit. */
export const LayoutPanel = ({ layout, onChange }: LayoutPanelProps) => (
  <div className="grid gap-5">
    <div>
      <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-light/75">Sizing</span>
      <p className="mt-0.5 text-[11px] leading-relaxed text-brand-light/35">
        Resize any piece of the main stage on its own — useful for rebalancing the composition on a
        wall with an unusual aspect ratio.
      </p>
    </div>

    <div className="grid gap-3">
      {SCALE_FIELDS.map(({ key, label, description }) => {
        const value = layout[key];
        const isDefault = value === defaultLayout[key];
        return (
          <div
            key={key}
            className="grid gap-1.5 rounded-[0.7rem] border border-brand-light/12 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`layout-${key}`} className={fieldLabel}>
                {label}
              </label>
              <div className="flex items-center gap-2">
                <span className="tabular w-11 text-right text-[12px] font-semibold text-brand-light">
                  {Math.round(value * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ ...layout, [key]: defaultLayout[key] })}
                  disabled={isDefault}
                  title="Reset to 100%"
                  className={`${
                    isDefault ? "text-brand-light/20" : "text-brand-light/45 hover:text-brand-light/80"
                  }`}
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </div>
            <input
              id={`layout-${key}`}
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.05}
              value={value}
              onChange={(event) => onChange({ ...layout, [key]: Number(event.target.value) })}
              className="h-1.5 flex-1 accent-brand-mint"
            />
            <p className="text-[11px] leading-relaxed text-brand-light/35">{description}</p>
          </div>
        );
      })}
    </div>
  </div>
);
