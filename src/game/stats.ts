import { FINGERS, type Finger, fingerForCode } from "./fingers.ts";

export const STATS_THRESHOLD = 5;

export type CountPair = {
  hits: number;
  misses: number;
};

export type StatsAggregate = {
  keys: Record<string, CountPair>;
  transitions: Record<string, CountPair>;
};

export type StatStatus = "empty" | "insufficient" | "ok";

export type RankedKeyStat = {
  code: string;
  hits: number;
  misses: number;
  missRate: number;
};

export type RankedTransitionStat = {
  from: string;
  to: string;
  hits: number;
  misses: number;
  missRate: number;
};

export type RankedFingerStat = {
  finger: Finger;
  hits: number;
  misses: number;
  missRate: number | null;
  status: StatStatus;
};

function emptyPair(): CountPair {
  return { hits: 0, misses: 0 };
}

function bump(pair: CountPair, correct: boolean): CountPair {
  return correct
    ? { hits: pair.hits + 1, misses: pair.misses }
    : { hits: pair.hits, misses: pair.misses + 1 };
}

function mergePair(a: CountPair | undefined, b: CountPair | undefined): CountPair {
  return {
    hits: (a?.hits ?? 0) + (b?.hits ?? 0),
    misses: (a?.misses ?? 0) + (b?.misses ?? 0),
  };
}

function mergeMaps(
  a: Record<string, CountPair>,
  b: Record<string, CountPair>,
): Record<string, CountPair> {
  const out: Record<string, CountPair> = { ...a };
  for (const [key, pair] of Object.entries(b)) {
    out[key] = mergePair(out[key], pair);
  }
  return out;
}

export function emptyStats(): StatsAggregate {
  return { keys: {}, transitions: {} };
}

export function transitionKey(from: string, to: string): string {
  return `${from}>${to}`;
}

export function parseTransitionKey(key: string): { from: string; to: string } {
  const sep = key.indexOf(">");
  if (sep < 0) return { from: key, to: "" };
  return { from: key.slice(0, sep), to: key.slice(sep + 1) };
}

export function addAttempt(
  stats: StatsAggregate,
  expectedCode: string,
  correct: boolean,
  previousCode: string | null = null,
): StatsAggregate {
  const keys = { ...stats.keys };
  keys[expectedCode] = bump(keys[expectedCode] ?? emptyPair(), correct);

  if (previousCode === null) {
    return { keys, transitions: stats.transitions };
  }

  const transitions = { ...stats.transitions };
  const id = transitionKey(previousCode, expectedCode);
  transitions[id] = bump(transitions[id] ?? emptyPair(), correct);
  return { keys, transitions };
}

export function mergeStats(a: StatsAggregate, b: StatsAggregate): StatsAggregate {
  return {
    keys: mergeMaps(a.keys, b.keys),
    transitions: mergeMaps(a.transitions, b.transitions),
  };
}

export function attemptCount(pair: CountPair): number {
  return pair.hits + pair.misses;
}

export function missRate(pair: CountPair): number | null {
  const n = attemptCount(pair);
  if (n < STATS_THRESHOLD) return null;
  return pair.misses / n;
}

export function statStatus(pair: CountPair | undefined): StatStatus {
  if (!pair || attemptCount(pair) === 0) return "empty";
  if (attemptCount(pair) < STATS_THRESHOLD) return "insufficient";
  return "ok";
}

export function missRateLabel(pair: CountPair | undefined): string {
  if (statStatus(pair) !== "ok" || !pair) return "データ不足";
  return `${Math.round((pair.misses / attemptCount(pair)) * 100)}%`;
}

function rankByMissRate<T extends { missRate: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.missRate - a.missRate);
}

export function weakestKeys(stats: StatsAggregate): RankedKeyStat[] {
  const ranked: RankedKeyStat[] = [];
  for (const [code, pair] of Object.entries(stats.keys)) {
    const rate = missRate(pair);
    if (rate === null) continue;
    ranked.push({ code, hits: pair.hits, misses: pair.misses, missRate: rate });
  }
  return rankByMissRate(ranked);
}

export function weakestTransitions(stats: StatsAggregate): RankedTransitionStat[] {
  const ranked: RankedTransitionStat[] = [];
  for (const [key, pair] of Object.entries(stats.transitions)) {
    const rate = missRate(pair);
    if (rate === null) continue;
    const { from, to } = parseTransitionKey(key);
    ranked.push({ from, to, hits: pair.hits, misses: pair.misses, missRate: rate });
  }
  return rankByMissRate(ranked);
}

export function fingerAggregates(stats: StatsAggregate): Partial<Record<Finger, CountPair>> {
  const out: Partial<Record<Finger, CountPair>> = {};
  for (const [code, pair] of Object.entries(stats.keys)) {
    const finger = fingerForCode(code);
    if (!finger) continue;
    out[finger] = mergePair(out[finger], pair);
  }
  return out;
}

export function weakestFingers(stats: StatsAggregate): RankedFingerStat[] {
  const byFinger = fingerAggregates(stats);
  const ranked: RankedFingerStat[] = [];
  for (const finger of FINGERS) {
    const pair = byFinger[finger];
    if (!pair) continue;
    ranked.push({
      finger,
      hits: pair.hits,
      misses: pair.misses,
      missRate: missRate(pair),
      status: statStatus(pair),
    });
  }
  return ranked.sort((a, b) => (b.missRate ?? -1) - (a.missRate ?? -1));
}
