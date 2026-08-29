import { Hono } from "hono";
import {
  emptyStats,
  FINGERS,
  mergeStats,
  weakestFingers,
  weakestKeys,
  weakestTransitions,
  type CountPair,
  type Difficulty,
  type RankedFingerStat,
  type ReplyUnit,
  type StatsAggregate,
} from "../game/index.ts";

const PLAYER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const MAX_STAT_KEYS = 256;

type ProblemRow = {
  id: number;
  difficulty: string;
  channel: string | null;
  sender: string | null;
  incoming_message: string | null;
  reply_text: string | null;
  reply_reading: string | null;
  reply_units: string | null;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/problems", async (c) => {
  const difficulty = c.req.query("difficulty");
  if (!isDifficulty(difficulty)) {
    return c.json({ error: "invalid_difficulty" }, 400);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT id, difficulty, channel, sender, incoming_message, reply_text, reply_reading, reply_units
     FROM problems WHERE difficulty = ? ORDER BY id`,
  )
    .bind(difficulty)
    .all<ProblemRow>();

  const problems = [];
  for (const row of results) {
    const reply_units = parseUnits(row.reply_units);
    if (!reply_units) continue;
    problems.push({
      id: row.id,
      difficulty: row.difficulty,
      channel: row.channel ?? "",
      sender: row.sender ?? "",
      incoming_message: row.incoming_message ?? "",
      reply_text: row.reply_text ?? "",
      reply_reading: row.reply_reading ?? "",
      reply_units,
    });
  }
  return c.json(problems);
});

app.post("/api/plays", async (c) => {
  const playerId = readPlayerId(c.req.header("X-Player-Id"));
  if (!playerId) return c.json({ error: "invalid_player_id" }, 400);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ error: "invalid_body" }, 400);
  }

  const record = body as Record<string, unknown>;
  if (
    Array.isArray(record.events) ||
    Array.isArray(record.keys) ||
    Array.isArray(record.transitions)
  ) {
    return c.json({ error: "keystroke_log_not_allowed" }, 400);
  }

  const difficulty = record.difficulty;
  if (!isDifficulty(difficulty)) return c.json({ error: "invalid_difficulty" }, 400);

  const salary = asInt(record.salary, 0, 100_000);
  const kpm = asFinite(record.kpm, 0, 10_000);
  const accuracy = asFinite(record.accuracy, 0, 1);
  const missCount = asInt(record.missCount, 0, 100_000);
  const maxCombo = asInt(record.maxCombo, 0, 100_000);
  const sentCount = asInt(record.sentCount, 0, 10_000);
  const keys = parseCountMap(record.keys);
  const transitions = parseCountMap(record.transitions);
  if (
    salary === null ||
    kpm === null ||
    accuracy === null ||
    missCount === null ||
    maxCombo === null ||
    sentCount === null ||
    keys === null ||
    transitions === null
  ) {
    return c.json({ error: "invalid_play" }, 400);
  }

  const incoming: StatsAggregate = { keys, transitions };
  const existing = await c.env.DB.prepare(
    `SELECT keys_json, transitions_json FROM player_key_stats WHERE player_id = ?`,
  )
    .bind(playerId)
    .first<{ keys_json: string; transitions_json: string }>();
  const merged = mergeStats(parseStoredStats(existing), incoming);
  const now = new Date().toISOString();
  const playId = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO plays (id, player_id, difficulty, salary, kpm, accuracy, miss_count, max_combo, sent_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(playId, playerId, difficulty, salary, kpm, accuracy, missCount, maxCombo, sentCount, now)
    .run();

  await c.env.DB.prepare(
    `INSERT INTO player_key_stats (player_id, keys_json, transitions_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(player_id) DO UPDATE SET
       keys_json = excluded.keys_json,
       transitions_json = excluded.transitions_json,
       updated_at = excluded.updated_at`,
  )
    .bind(playerId, JSON.stringify(merged.keys), JSON.stringify(merged.transitions), now)
    .run();

  const bestRow = await c.env.DB.prepare(
    `SELECT MAX(salary) AS salary FROM plays WHERE player_id = ? AND difficulty = ?`,
  )
    .bind(playerId, difficulty)
    .first<{ salary: number | null }>();
  const best = bestRow?.salary ?? salary;
  return c.json({ ok: true, id: playId, best, highscore: salary > 0 && salary >= best });
});

app.get("/api/me/highscores", async (c) => {
  const playerId = readPlayerId(c.req.header("X-Player-Id"));
  if (!playerId) return c.json({ error: "invalid_player_id" }, 400);

  const { results } = await c.env.DB.prepare(
    `SELECT difficulty, MAX(salary) AS salary FROM plays WHERE player_id = ? GROUP BY difficulty`,
  )
    .bind(playerId)
    .all<{ difficulty: string; salary: number }>();

  const highscores: Record<Difficulty, number | null> = {
    beginner: null,
    intermediate: null,
    advanced: null,
  };
  for (const row of results) {
    if (isDifficulty(row.difficulty)) highscores[row.difficulty] = row.salary;
  }
  return c.json(highscores);
});

app.get("/api/me/stats", async (c) => {
  const playerId = readPlayerId(c.req.header("X-Player-Id"));
  if (!playerId) return c.json({ error: "invalid_player_id" }, 400);

  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM plays WHERE player_id = ?`)
    .bind(playerId)
    .first<{ n: number }>();
  const stored = await c.env.DB.prepare(
    `SELECT keys_json, transitions_json FROM player_key_stats WHERE player_id = ?`,
  )
    .bind(playerId)
    .first<{ keys_json: string; transitions_json: string }>();
  const stats = parseStoredStats(stored);
  const byFinger = new Map(weakestFingers(stats).map((row) => [row.finger, row]));
  const fingers: RankedFingerStat[] = FINGERS.map(
    (finger) =>
      byFinger.get(finger) ?? {
        finger,
        hits: 0,
        misses: 0,
        missRate: null,
        status: "empty",
      },
  );

  return c.json({
    playCount: Number(countRow?.n ?? 0),
    fingers,
    keys: weakestKeys(stats).slice(0, 8),
    transitions: weakestTransitions(stats).slice(0, 8),
  });
});

app.post("/api/me/stats/reset", async (c) => {
  const playerId = readPlayerId(c.req.header("X-Player-Id"));
  if (!playerId) return c.json({ error: "invalid_player_id" }, 400);

  await c.env.DB.prepare(`DELETE FROM player_key_stats WHERE player_id = ?`).bind(playerId).run();
  return c.json({ ok: true });
});

export default app;

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

function readPlayerId(header: string | undefined): string | null {
  if (!header || !PLAYER_ID_RE.test(header)) return null;
  return header;
}

function parseUnits(raw: string | null): ReplyUnit[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const units: ReplyUnit[] = [];
    for (const item of parsed) {
      if (item === null || typeof item !== "object") return null;
      const display = (item as { display?: unknown }).display;
      const reading = (item as { reading?: unknown }).reading;
      if (typeof display !== "string" || typeof reading !== "string") return null;
      units.push({ display, reading });
    }
    return units;
  } catch {
    return null;
  }
}

function parseCountMap(value: unknown): Record<string, CountPair> | null {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_STAT_KEYS) return null;
  const out: Record<string, CountPair> = {};
  for (const [key, pair] of entries) {
    if (key.length === 0 || key.length > 40) return null;
    if (pair === null || typeof pair !== "object" || Array.isArray(pair)) return null;
    const hits = (pair as { hits?: unknown }).hits;
    const misses = (pair as { misses?: unknown }).misses;
    if (!Number.isInteger(hits) || !Number.isInteger(misses)) return null;
    if ((hits as number) < 0 || (misses as number) < 0) return null;
    if ((hits as number) > 1_000_000 || (misses as number) > 1_000_000) return null;
    out[key] = { hits: hits as number, misses: misses as number };
  }
  return out;
}

function parseStoredStats(
  row: { keys_json: string; transitions_json: string } | null,
): StatsAggregate {
  if (!row) return emptyStats();
  try {
    const keys = parseCountMap(JSON.parse(row.keys_json));
    const transitions = parseCountMap(JSON.parse(row.transitions_json));
    if (!keys || !transitions) return emptyStats();
    return { keys, transitions };
  } catch {
    return emptyStats();
  }
}

function asInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function asFinite(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}
