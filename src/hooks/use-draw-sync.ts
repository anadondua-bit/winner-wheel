import { useCallback, useEffect, useRef, useState } from "react";
import { appendWinners, createDrawRun, fetchLatestDraw } from "@/lib/wheel-cloud";
import type {
  AccentName,
  Branding,
  Company,
  SaveStatus,
  WheelConfig,
  Winner,
} from "@/lib/wheel-types";

const RUN_KEY = "award-wheel.run.v1";
const RESET_KEY = "award-wheel.reset.v1";

const readRunId = (): string | null => {
  try {
    return localStorage.getItem(RUN_KEY);
  } catch {
    return null;
  }
};

const writeRunId = (id: string | null): void => {
  try {
    if (id) localStorage.setItem(RUN_KEY, id);
    else localStorage.removeItem(RUN_KEY);
  } catch {
    /* storage can be blocked; the show still runs from memory */
  }
};

const readResetAt = (): number => {
  try {
    const stored = localStorage.getItem(RESET_KEY);
    return stored ? Number(stored) || 0 : 0;
  } catch {
    return 0;
  }
};

export type RemoteAdoption = {
  title: string;
  subtitle: string;
  roster: Company[];
  winners: Winner[];
  accent: AccentName;
  wallWidth: number;
  wallHeight: number;
  branding: Branding;
};

type Params = {
  winners: Winner[];
  baseRoster: Company[];
  config: WheelConfig;
  adoptRemote: (draw: RemoteAdoption) => void;
};

export type DrawSyncApi = {
  status: SaveStatus;
  /** Clears the link to the saved record so the next session starts fresh. */
  resetRemote: () => void;
};

/**
 * Mirrors the draw into the show record without ever blocking the wheel.
 * The local draw is authoritative on the operator's machine; the record is
 * used to recover the same results after a crash or on another laptop.
 */
export const useDrawSync = ({
  winners,
  baseRoster,
  config,
  adoptRemote,
}: Params): DrawSyncApi => {
  const [status, setStatus] = useState<SaveStatus>("saving");
  const [ready, setReady] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const runIdRef = useRef<string | null>(readRunId());
  const syncedRef = useRef(0);
  const busyRef = useRef(false);

  const winnersRef = useRef(winners);
  winnersRef.current = winners;
  const rosterRef = useRef(baseRoster);
  rosterRef.current = baseRoster;
  const configRef = useRef(config);
  configRef.current = config;

  // Reconcile with the saved record once on load: recover results on a new
  // machine, otherwise keep this machine's draw and upload what is missing.
  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      let nextStatus: SaveStatus = "saved";
      try {
        const remote = await fetchLatestDraw();
        if (cancelled) return;

        const localWinners = winnersRef.current;
        const remoteIsAfterReset = remote
          ? new Date(remote.startedAt).getTime() > readResetAt()
          : false;

        if (remote && remoteIsAfterReset && remote.winners.length > localWinners.length) {
          adoptRemote({
            title: remote.title || configRef.current.title,
            subtitle: remote.subtitle,
            accent:
              remote.accent === "blue" || remote.accent === "mint"
                ? remote.accent
                : "teal",
            wallWidth: remote.wallWidth,
            wallHeight: remote.wallHeight,
            branding: remote.branding,
            roster:
              remote.roster.length >= configRef.current.totalDraws
                ? remote.roster
                : rosterRef.current,
            winners: remote.winners,
          });
          runIdRef.current = remote.runId;
          writeRunId(remote.runId);
          syncedRef.current = remote.winners.length;
        } else if (remote && runIdRef.current === remote.runId) {
          syncedRef.current = Math.min(remote.winners.length, localWinners.length);
        } else {
          // A different session's run, or no run yet: start a fresh one.
          runIdRef.current = null;
          writeRunId(null);
          syncedRef.current = 0;
        }
      } catch {
        nextStatus = "error";
      } finally {
        if (!cancelled) {
          setStatus(nextStatus);
          setReady(true);
        }
      }
    };

    void reconcile();
    return () => {
      cancelled = true;
    };
  }, [adoptRemote]);

  // Push every result that is not in the record yet.
  useEffect(() => {
    if (!ready || busyRef.current) return;

    const pending = winners.slice(syncedRef.current);
    if (!pending.length) {
      setStatus(winners.length ? "saved" : "idle");
      return;
    }

    busyRef.current = true;
    setStatus("saving");

    void (async () => {
      try {
        let runId = runIdRef.current;
        if (!runId) {
          runId = await createDrawRun({
            title: configRef.current.title,
            subtitle: configRef.current.subtitle,
            accent: configRef.current.accent,
            wallWidth: configRef.current.wallWidth,
            wallHeight: configRef.current.wallHeight,
            branding: configRef.current.branding,
            roster: rosterRef.current,
          });
          runIdRef.current = runId;
          writeRunId(runId);
        }
        await appendWinners(runId, winners.slice(syncedRef.current));
        syncedRef.current = winners.length;
        setStatus("saved");
      } catch {
        setStatus("error");
      } finally {
        busyRef.current = false;
      }
    })();
  }, [winners, ready, retryTick]);

  // Retry quietly while the show continues.
  useEffect(() => {
    if (status !== "error") return;
    const timer = window.setTimeout(() => setRetryTick((tick) => tick + 1), 4000);
    return () => window.clearTimeout(timer);
  }, [status, retryTick]);

  const resetRemote = useCallback(() => {
    runIdRef.current = null;
    syncedRef.current = 0;
    writeRunId(null);
    try {
      localStorage.setItem(RESET_KEY, String(Date.now()));
    } catch {
      /* storage blocked */
    }
    setStatus("idle");
  }, []);

  return { status, resetRemote };
};
