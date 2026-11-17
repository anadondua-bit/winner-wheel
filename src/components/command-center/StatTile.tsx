type StatTileProps = {
  label: string;
  value: string;
  hint?: string;
};

/** A single scannable metric — the command center's basic unit. */
export const StatTile = ({ label, value, hint }: StatTileProps) => (
  <div className="panel-glass rounded-2xl px-5 py-4">
    <p className="text-kicker text-[11px] text-brand-light/45">{label}</p>
    <p className="tabular mt-1 text-[1.9rem] font-bold leading-none text-brand-light">{value}</p>
    {hint ? <p className="mt-1.5 text-[12px] text-brand-light/40">{hint}</p> : null}
  </div>
);
