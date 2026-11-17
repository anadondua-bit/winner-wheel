import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Winner } from "@/lib/wheel-types";

type WinnersLedgerProps = {
  winners: Winner[];
  totalDraws: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

/** Dashboard-styled record of every reveal, for the production team to copy. */
export const WinnersLedger = ({ winners, totalDraws }: WinnersLedgerProps) => {
  const [copied, setCopied] = useState(false);

  const copyWinners = async () => {
    if (!winners.length) return;
    const text = winners
      .map((winner) => `${pad(winner.draw)}. ${winner.name} (${formatTime(winner.wonAt)})`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Winners copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy not available in this browser");
    }
  };

  return (
    <section className="panel-glass flex min-h-0 flex-1 flex-col rounded-[1.5rem] px-6 py-5">
      <header className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-kicker text-[12px] text-brand-light/70">Winners</h2>
          <span className="tabular text-sm font-semibold text-brand-mint">
            {pad(winners.length)}
            <span className="text-brand-light/30"> / {pad(totalDraws)}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={copyWinners}
          disabled={!winners.length}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-light/15 bg-brand-light/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-light/60 transition-colors hover:bg-brand-light/10 hover:text-brand-light/90 disabled:opacity-30"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          Copy
        </button>
      </header>

      <div className="panel-rule" />

      {winners.length === 0 ? (
        <p className="flex flex-1 items-center text-sm text-brand-light/40">
          No names revealed yet — the first winner appears here.
        </p>
      ) : (
        <ol className="rail-scroll mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {winners
            .slice()
            .reverse()
            .map((winner) => (
              <li
                key={`${winner.draw}-${winner.companyId}`}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-brand-light/80 odd:bg-brand-light/[0.03]"
              >
                <span className="tabular w-6 shrink-0 text-xs font-semibold text-brand-light/35">
                  {pad(winner.draw)}
                </span>
                <span className="flex-1 truncate text-sm font-semibold" title={winner.name}>
                  {winner.name}
                </span>
                <span className="tabular shrink-0 text-xs text-brand-light/30">
                  {formatTime(winner.wonAt)}
                </span>
              </li>
            ))}
        </ol>
      )}
    </section>
  );
};
