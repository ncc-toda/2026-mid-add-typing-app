import { describe, expect, it } from "vite-plus/test";
import {
  addAttempt,
  emptyStats,
  mergeStats,
  missRate,
  missRateLabel,
  STATS_THRESHOLD,
  statStatus,
  weakestFingers,
  weakestKeys,
  weakestTransitions,
} from "./stats.ts";

describe("stats threshold", () => {
  it("treats counts under 5 as データ不足", () => {
    let stats = emptyStats();
    for (let i = 0; i < STATS_THRESHOLD - 1; i++) {
      stats = addAttempt(stats, "KeyK", i % 2 === 0);
    }
    const pair = stats.keys.KeyK;
    expect(pair).toEqual({ hits: 2, misses: 2 });
    expect(statStatus(pair)).toBe("insufficient");
    expect(missRate(pair!)).toBeNull();
    expect(missRateLabel(pair)).toBe("データ不足");
    expect(weakestKeys(stats)).toEqual([]);
  });

  it("exposes miss rate once count reaches 5", () => {
    let stats = emptyStats();
    stats = addAttempt(stats, "KeyK", true);
    stats = addAttempt(stats, "KeyK", true);
    stats = addAttempt(stats, "KeyK", true);
    stats = addAttempt(stats, "KeyK", false);
    stats = addAttempt(stats, "KeyK", false);
    const pair = stats.keys.KeyK!;
    expect(statStatus(pair)).toBe("ok");
    expect(missRate(pair)).toBe(0.4);
    expect(missRateLabel(pair)).toBe("40%");
    expect(weakestKeys(stats)[0]).toMatchObject({
      code: "KeyK",
      hits: 3,
      misses: 2,
      missRate: 0.4,
    });
  });

  it("uses empty status when there is no data", () => {
    expect(statStatus(undefined)).toBe("empty");
    expect(missRateLabel(undefined)).toBe("データ不足");
    expect(weakestKeys(emptyStats())).toEqual([]);
  });
});

describe("transitions and merge", () => {
  it("records 2-key transition miss rate with the same threshold", () => {
    let stats = emptyStats();
    for (let i = 0; i < 5; i++) {
      stats = addAttempt(stats, "KeyY", i !== 0, "KeyK");
    }
    const ranked = weakestTransitions(stats);
    expect(ranked[0]).toMatchObject({
      from: "KeyK",
      to: "KeyY",
      hits: 4,
      misses: 1,
      missRate: 0.2,
    });
  });

  it("merges two aggregates by summing hits and misses", () => {
    let a = emptyStats();
    a = addAttempt(a, "KeyA", true);
    a = addAttempt(a, "KeyA", false);
    a = addAttempt(a, "KeyS", true, "KeyA");

    let b = emptyStats();
    b = addAttempt(b, "KeyA", true);
    b = addAttempt(b, "KeyS", false, "KeyA");

    const merged = mergeStats(a, b);
    expect(merged.keys.KeyA).toEqual({ hits: 2, misses: 1 });
    expect(merged.keys.KeyS).toEqual({ hits: 1, misses: 1 });
    expect(merged.transitions["KeyA>KeyS"]).toEqual({ hits: 1, misses: 1 });
  });

  it("aggregates physical keys into fingers", () => {
    let stats = emptyStats();
    for (let i = 0; i < 5; i++) {
      stats = addAttempt(stats, "KeyA", i !== 2);
    }
    const fingers = weakestFingers(stats);
    expect(fingers[0]?.finger).toBe("左小指");
    expect(fingers[0]?.missRate).toBe(0.2);
    expect(fingers[0]?.status).toBe("ok");
  });
});
