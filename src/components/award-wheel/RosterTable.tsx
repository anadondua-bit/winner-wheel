import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FONT_PRESETS } from "@/lib/wheel-fonts";
import { createRosterRow } from "@/lib/wheel-roster";
import type { RosterRowDraft } from "@/lib/wheel-roster";
import type { FontChoice } from "@/lib/wheel-types";

type RosterTableProps = {
  rows: RosterRowDraft[];
  onChange: (rows: RosterRowDraft[]) => void;
  disabled?: boolean;
  /** Whether a custom font has been uploaded, so "Custom" can be offered per row. */
  hasCustomFont?: boolean;
};

/** One editable row per company — the "objects, not a text blob" view of the roster. */
export const RosterTable = ({ rows, onChange, disabled, hasCustomFont }: RosterTableProps) => {
  const updateRow = (rowKey: string, patch: Partial<Pick<RosterRowDraft, "name" | "short" | "font">>) => {
    onChange(rows.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)));
  };

  const removeRow = (rowKey: string) => {
    onChange(rows.filter((row) => row.rowKey !== rowKey));
  };

  const addRow = () => {
    onChange([...rows, createRosterRow()]);
  };

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-[1fr_minmax(0,9rem)_minmax(0,7.5rem)_2rem] gap-2 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light/40">
          Full name
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light/40">
          Short (on wheel)
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-light/40">
          Font
        </span>
        <span aria-hidden="true" />
      </div>

      <div className="rail-scroll max-h-[clamp(200px,34vh,360px)] overflow-y-auto rounded-[0.8rem] border border-brand-light/10">
        {rows.map((row, index) => (
          <div
            key={row.rowKey}
            className={`grid grid-cols-[1fr_minmax(0,9rem)_minmax(0,7.5rem)_2rem] items-center gap-2 px-2 py-1.5 ${
              index % 2 === 1 ? "bg-brand-light/[0.025]" : ""
            }`}
          >
            <Input
              value={row.name}
              onChange={(event) => updateRow(row.rowKey, { name: event.target.value })}
              placeholder="Full company name"
              disabled={disabled}
              className="h-9 border-brand-light/12 bg-brand-ink/40 text-[13px] text-brand-light"
            />
            <Input
              value={row.short}
              onChange={(event) => updateRow(row.rowKey, { short: event.target.value.toUpperCase() })}
              placeholder="auto"
              disabled={disabled}
              className="h-9 border-brand-light/12 bg-brand-ink/40 text-center text-[13px] uppercase text-brand-light"
            />
            <select
              value={row.font ?? ""}
              onChange={(event) =>
                updateRow(row.rowKey, { font: (event.target.value || null) as FontChoice | null })
              }
              disabled={disabled}
              aria-label={`${row.name || "Company"} font`}
              className="h-9 rounded-md border border-brand-light/12 bg-brand-ink/40 px-1.5 text-[12px] text-brand-light disabled:opacity-50"
            >
              <option value="">Default</option>
              {FONT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
              {hasCustomFont ? <option value="custom">Custom</option> : null}
            </select>
            <button
              type="button"
              onClick={() => removeRow(row.rowKey)}
              disabled={disabled}
              title="Remove company"
              aria-label={`Remove ${row.name || "this row"}`}
              className="grid h-8 w-8 place-items-center rounded-md text-brand-light/30 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-brand-light/35">
            No companies yet — add one below, or import a CSV.
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="quiet"
        size="sm"
        className="h-8 w-fit rounded-full px-3 text-[12px]"
        onClick={addRow}
        disabled={disabled}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Add company
      </Button>
    </div>
  );
};
