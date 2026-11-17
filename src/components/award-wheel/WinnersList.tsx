import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Winner } from "@/lib/wheel-types";

type WinnersListProps = {
  winners: Winner[];
  totalDraws: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/** Running list of winners in reveal order, kept for the production team. */
export const WinnersList = ({ winners, totalDraws }: WinnersListProps) => {
  const [copied, setCopied] = useState(false);
  const latestId = winners[winners.length - 1]?.companyId;

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
    <section className="panel-glass flex min-h-[10vh] max-h-[31vh] flex-col overflow-hidden rounded-[1.4rem] px-[1.7vw] py-[1.8vh] max-lg:px-5">
      <header className="flex items-center justify-between gap-3 pb-[1.2vh]">
        <div className="flex items-baseline gap-[0.8vw]">
          <h2
            className="text-kicker text-brand-light/80"
            style={{ fontSize: "clamp(9px, 0.72vw, 17px)" }}
          >
            Winners
          </h2>
          <span
            className="tabular font-semibold text-brand-mint"
            style={{ fontSize: "clamp(10px, 0.78vw, 18px)" }}
          >
            {pad(winners.length)}
            <span className="text-brand-light/30"> / {pad(totalDraws)}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={copyWinners}
          disabled={!winners.length}
          className="inline-flex items-center gap-[0.4em] rounded-full border border-brand-light/15 bg-brand-light/[0.04] px-[0.8em] py-[0.35em] font-semibold uppercase text-brand-light/60 transition-colors hover:bg-brand-light/10 hover:text-brand-light/90 disabled:opacity-30"
          style={{ fontSize: "clamp(8px, 0.6vw, 13px)", letterSpacing: "0.2em" }}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          Copy
        </button>
      </header>

      <div className="panel-rule" />

      {winners.length === 0 ? (
        <p
          className="flex flex-1 items-center text-brand-light/40"
          style={{ fontSize: "clamp(11px, 0.82vw, 19px)" }}
        >
          No names revealed yet — the first winner appears here.
        </p>
      ) : (
        <ol className="rail-scroll mt-[1.1vh] grid min-h-0 flex-1 grid-cols-1 content-start gap-x-[1.4vw] gap-y-[0.55vh] overflow-y-auto pr-1 xl:grid-cols-2">
          {winners.map((winner) => {
            const isLatest = winner.companyId === latestId;
            return (
              <li
                key={`${winner.draw}-${winner.companyId}`}
                className={`flex items-baseline gap-[0.7vw] rounded-[0.5rem] py-[0.35vh] pl-[0.6vw] transition-colors ${
                  isLatest
                    ? "bg-brand-mint/10 text-brand-light"
                    : "text-brand-light/70"
                }`}
              >
                <span
                  className={`tabular font-semibold ${
                    isLatest ? "text-brand-mint" : "text-brand-light/35"
                  }`}
                  style={{ fontSize: "clamp(9px, 0.68vw, 15px)" }}
                >
                  {pad(winner.draw)}
                </span>
                <span
                  className="flex-1 truncate font-semibold"
                  style={{ fontSize: "clamp(11px, 0.92vw, 22px)" }}
                  title={winner.name}
                >
                  {winner.name}
                </span>
                <span
                  className="tabular text-brand-light/30"
                  style={{ fontSize: "clamp(8px, 0.6vw, 13px)" }}
                >
                  {formatTime(winner.wonAt)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
