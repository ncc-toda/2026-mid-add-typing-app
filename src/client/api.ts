import type {
  CountPair,
  Difficulty,
  RankedFingerStat,
  RankedKeyStat,
  RankedTransitionStat,
  ReplyUnit,
} from "../game/index.ts";

export type Problem = {
  id: number;
  difficulty: Difficulty;
  channel: string;
  sender: string;
  incoming_message: string;
  reply_text: string;
  reply_reading: string;
  reply_units: ReplyUnit[];
};

export type Highscores = Record<Difficulty, number | null>;

export type PlayPayload = {
  difficulty: Difficulty;
  salary: number;
  kpm: number;
  accuracy: number;
  missCount: number;
  maxCombo: number;
  sentCount: number;
  keys: Record<string, CountPair>;
  transitions: Record<string, CountPair>;
};

export type StatsResponse = {
  playCount: number;
  fingers: RankedFingerStat[];
  keys: RankedKeyStat[];
  transitions: RankedTransitionStat[];
};

async function request<T>(path: string, playerId: string | null, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (playerId) headers.set("X-Player-Id", playerId);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return (await res.json()) as T;
}

export function fetchProblems(difficulty: Difficulty): Promise<Problem[]> {
  return request(`/api/problems?difficulty=${encodeURIComponent(difficulty)}`, null);
}

export function fetchHighscores(playerId: string): Promise<Highscores> {
  return request("/api/me/highscores", playerId);
}

export function fetchStats(playerId: string): Promise<StatsResponse> {
  return request("/api/me/stats", playerId);
}

export function postPlay(
  playerId: string,
  payload: PlayPayload,
): Promise<{ ok: true; highscore: boolean; best: number }> {
  return request("/api/plays", playerId, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetStats(playerId: string): Promise<{ ok: true }> {
  return request("/api/me/stats/reset", playerId, { method: "POST" });
}
