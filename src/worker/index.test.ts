import { describe, expect, it } from "vite-plus/test";
import app from "./index.ts";

const PLAYER = "11111111-1111-4111-8111-111111111111";

type ProblemRow = {
  id: number;
  difficulty: string;
  channel: string;
  sender: string;
  incoming_message: string;
  reply_text: string;
  reply_reading: string;
  reply_units: string;
};

type PlayRow = {
  id: string;
  player_id: string;
  difficulty: string;
  salary: number;
};

type StatRow = {
  player_id: string;
  keys_json: string;
  transitions_json: string;
};

function unitsJson(): string {
  return JSON.stringify([{ display: "確認", reading: "かくにん" }]);
}

function createDb(seed?: { problems?: ProblemRow[]; plays?: PlayRow[]; stats?: StatRow[] }) {
  const problems = seed?.problems ?? [
    {
      id: 1,
      difficulty: "beginner",
      channel: "#web-app",
      sender: "サトウ",
      incoming_message: "レビューお願い",
      reply_text: "確認します。",
      reply_reading: "かくにんします。",
      reply_units: unitsJson(),
    },
  ];
  const plays = [...(seed?.plays ?? [])];
  const stats = [...(seed?.stats ?? [])];

  const db = {
    prepare(sql: string) {
      const bound: unknown[] = [];
      const stmt = {
        bind(...values: unknown[]) {
          bound.push(...values);
          return stmt;
        },
        async all() {
          if (sql.includes("FROM problems")) {
            const difficulty = bound[0];
            return { results: problems.filter((row) => row.difficulty === difficulty) };
          }
          if (sql.includes("GROUP BY difficulty")) {
            const playerId = bound[0];
            const best = new Map<string, number>();
            for (const play of plays) {
              if (play.player_id !== playerId) continue;
              best.set(play.difficulty, Math.max(best.get(play.difficulty) ?? 0, play.salary));
            }
            return {
              results: [...best.entries()].map(([difficulty, salary]) => ({ difficulty, salary })),
            };
          }
          return { results: [] };
        },
        async first() {
          if (sql.includes("FROM player_key_stats")) {
            return stats.find((row) => row.player_id === bound[0]) ?? null;
          }
          if (sql.includes("COUNT(*)")) {
            return { n: plays.filter((row) => row.player_id === bound[0]).length };
          }
          if (sql.includes("MAX(salary)")) {
            const playerId = bound[0];
            const difficulty = bound[1];
            let max: number | null = null;
            for (const play of plays) {
              if (play.player_id !== playerId || play.difficulty !== difficulty) continue;
              max = Math.max(max ?? 0, play.salary);
            }
            return { salary: max };
          }
          return null;
        },
        async run() {
          if (sql.includes("INSERT INTO plays")) {
            plays.push({
              id: String(bound[0]),
              player_id: String(bound[1]),
              difficulty: String(bound[2]),
              salary: Number(bound[3]),
            });
          }
          if (sql.includes("INSERT INTO player_key_stats")) {
            const row = {
              player_id: String(bound[0]),
              keys_json: String(bound[1]),
              transitions_json: String(bound[2]),
            };
            const index = stats.findIndex((item) => item.player_id === row.player_id);
            if (index >= 0) stats[index] = row;
            else stats.push(row);
          }
          if (sql.includes("DELETE FROM player_key_stats")) {
            const playerId = bound[0];
            for (let i = stats.length - 1; i >= 0; i--) {
              if (stats[i]?.player_id === playerId) stats.splice(i, 1);
            }
          }
          return { success: true };
        },
      };
      return stmt;
    },
  };

  return { db, plays, stats };
}

function env(db: ReturnType<typeof createDb>["db"]) {
  return { DB: db };
}

describe("GET /api/problems", () => {
  it("returns problems for a difficulty and rejects unknown ones", async () => {
    const { db } = createDb();
    const ok = await app.request("/api/problems?difficulty=beginner", {}, env(db));
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { id: number; reply_units: { display: string }[] }[];
    expect(body).toHaveLength(1);
    expect(body[0]?.reply_units[0]?.display).toBe("確認");

    const bad = await app.request("/api/problems?difficulty=legend", {}, env(db));
    expect(bad.status).toBe(400);
  });
});

describe("player id and play save", () => {
  it("rejects missing player id and per-keystroke arrays", async () => {
    const { db } = createDb();
    const missing = await app.request("/api/plays", { method: "POST", body: "{}" }, env(db));
    expect(missing.status).toBe(400);

    const streamed = await app.request(
      "/api/plays",
      {
        method: "POST",
        headers: { "X-Player-Id": PLAYER, "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: "beginner",
          salary: 10,
          kpm: 100,
          accuracy: 1,
          missCount: 0,
          maxCombo: 0,
          sentCount: 1,
          keys: [{ code: "KeyA", t: 1 }],
        }),
      },
      env(db),
    );
    expect(streamed.status).toBe(400);
  });

  it("saves a play summary and merges key stats", async () => {
    const { db, plays, stats } = createDb({
      stats: [
        {
          player_id: PLAYER,
          keys_json: JSON.stringify({ KeyA: { hits: 2, misses: 1 } }),
          transitions_json: "{}",
        },
      ],
    });
    const res = await app.request(
      "/api/plays",
      {
        method: "POST",
        headers: { "X-Player-Id": PLAYER, "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: "beginner",
          salary: 120,
          kpm: 240,
          accuracy: 0.9,
          missCount: 3,
          maxCombo: 12,
          sentCount: 2,
          keys: { KeyA: { hits: 4, misses: 0 }, KeyS: { hits: 1, misses: 0 } },
          transitions: { "KeyA>KeyS": { hits: 1, misses: 0 } },
        }),
      },
      env(db),
    );
    expect(res.status).toBe(200);
    expect(plays).toHaveLength(1);
    expect(plays[0]?.salary).toBe(120);
    const merged = JSON.parse(stats[0]?.keys_json ?? "{}") as Record<string, { hits: number }>;
    expect(merged.KeyA?.hits).toBe(6);
    expect(merged.KeyS?.hits).toBe(1);
  });
});

describe("GET /api/me/* and reset", () => {
  it("returns highscores and clears key stats only", async () => {
    const { db, plays, stats } = createDb({
      plays: [{ id: "p1", player_id: PLAYER, difficulty: "beginner", salary: 320 }],
      stats: [
        {
          player_id: PLAYER,
          keys_json: JSON.stringify({ KeyK: { hits: 10, misses: 8 } }),
          transitions_json: "{}",
        },
      ],
    });

    const scores = await app.request(
      "/api/me/highscores",
      { headers: { "X-Player-Id": PLAYER } },
      env(db),
    );
    expect(await scores.json()).toEqual({
      beginner: 320,
      intermediate: null,
      advanced: null,
    });

    const reset = await app.request(
      "/api/me/stats/reset",
      { method: "POST", headers: { "X-Player-Id": PLAYER } },
      env(db),
    );
    expect(reset.status).toBe(200);
    expect(stats).toHaveLength(0);
    expect(plays).toHaveLength(1);
  });
});
