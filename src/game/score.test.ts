import { describe, expect, it } from "vite-plus/test";
import {
  accuracyCoefficient,
  accuracyRatio,
  comboCorrect,
  comboMiss,
  emptyCombo,
  keysPerMinute,
  replyBase,
  replySalary,
  speedCoefficient,
  weightedCharCount,
} from "./score.ts";

describe("weighted chars", () => {
  it("counts Japanese as 1 and ASCII/newline as 1.5", () => {
    expect(weightedCharCount("あ")).toBe(1);
    expect(weightedCharCount("A")).toBe(1.5);
    expect(weightedCharCount("#")).toBe(1.5);
    expect(weightedCharCount("\n")).toBe(1.5);
    expect(weightedCharCount("あA\n")).toBe(4);
  });
});

describe("score formula", () => {
  it("uses difficulty base + weighted * coefficient", () => {
    expect(replyBase("beginner", 10)).toBe(15 + 10 * 0.5);
    expect(replyBase("intermediate", 10)).toBe(28 + 10 * 0.7);
    expect(replyBase("advanced", 10)).toBe(45 + 10 * 0.9);
  });

  it("computes KPM as correctKeys / seconds * 60", () => {
    expect(keysPerMinute(10, 2)).toBe(300);
  });

  it("clamps speed to 0.6–1.4 against the baseline", () => {
    expect(speedCoefficient(220, "beginner")).toBe(1);
    expect(speedCoefficient(300, "intermediate")).toBe(1);
    expect(speedCoefficient(380, "advanced")).toBe(1);
    expect(speedCoefficient(0, "beginner")).toBe(0.6);
    expect(speedCoefficient(1000, "beginner")).toBe(1.4);
  });

  it("uses 0.7 + accuracy * 0.45, and 0 when no keys", () => {
    expect(accuracyRatio(0, 0)).toBe(0);
    expect(accuracyRatio(3, 1)).toBe(0.75);
    expect(accuracyCoefficient(0)).toBe(0.7);
    expect(accuracyCoefficient(1)).toBe(1.15);
    expect(accuracyCoefficient(0.75)).toBe(1.0375);
  });

  it("rounds beginner salary to integer 万円", () => {
    // weighted 1, kpm 220, accuracy 100%
    // base 15.5, speed 1, acc 1.15 → 17.825 → 18
    expect(
      replySalary({
        difficulty: "beginner",
        text: "あ",
        correctKeys: 220,
        misses: 0,
        seconds: 60,
      }),
    ).toBe(18);
  });

  it("rounds intermediate salary at baseline KPM", () => {
    // weighted 10 from 10 kana, base 35, speed 1, acc 1.15 → 40.25 → 40
    expect(
      replySalary({
        difficulty: "intermediate",
        text: "あいうえおかきくけこ",
        correctKeys: 300,
        misses: 0,
        seconds: 60,
      }),
    ).toBe(40);
  });

  it("applies speed floor and accuracy floor together", () => {
    // advanced, weighted 10, kpm 0, accuracy 0
    // base 54, speed 0.6, acc 0.7 → 22.68 → 23
    expect(
      replySalary({
        difficulty: "advanced",
        text: "あいうえおかきくけこ",
        correctKeys: 0,
        misses: 10,
        seconds: 1,
      }),
    ).toBe(23);
  });

  it("matches a mixed ASCII example with clamp", () => {
    // "a" weight 1.5, beginner base 15.75
    // 3 hits 1 miss in 2s → kpm 90 → speed 0.6
    // acc 0.75 → 1.0375 → 9.804375 → 10
    expect(
      replySalary({
        difficulty: "beginner",
        text: "a",
        correctKeys: 3,
        misses: 1,
        seconds: 2,
      }),
    ).toBe(10);
  });
});

describe("combo", () => {
  it("increments on correct keys, resets on miss, keeps max", () => {
    let combo = emptyCombo();
    combo = comboCorrect(combo);
    combo = comboCorrect(combo);
    expect(combo).toEqual({ current: 2, max: 2 });
    combo = comboMiss(combo);
    expect(combo).toEqual({ current: 0, max: 2 });
    combo = comboCorrect(combo);
    expect(combo).toEqual({ current: 1, max: 2 });
  });
});
