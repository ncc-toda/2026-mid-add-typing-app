import { describe, expect, it } from "vite-plus/test";
import type { Problem } from "./api.ts";
import {
  applyTypingKey,
  arrangeProblems,
  startPlay,
  summarizePlay,
  typingKeyFromEvent,
} from "./play.ts";

const problemA: Problem = {
  id: 1,
  difficulty: "beginner",
  channel: "#web-app",
  sender: "サトウ",
  incoming_message: "レビューお願い",
  reply_text: "あ",
  reply_reading: "あ",
  reply_units: [{ display: "あ", reading: "あ" }],
};

const problemB: Problem = {
  ...problemA,
  id: 2,
  incoming_message: "進捗どう",
  reply_text: "い",
  reply_reading: "い",
  reply_units: [{ display: "い", reading: "い" }],
};

describe("arrangeProblems", () => {
  it("avoids repeating the previous first problem when possible", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    for (let i = 0; i < 20; i++) {
      expect(arrangeProblems(items, 1)[0]?.id).not.toBe(1);
    }
  });
});

describe("typingKeyFromEvent", () => {
  it("maps Enter to newline and ignores modifiers", () => {
    expect(
      typingKeyFromEvent({
        key: "Enter",
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        isComposing: false,
        repeat: false,
      }),
    ).toBe("\n");
    expect(
      typingKeyFromEvent({
        key: "a",
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        isComposing: false,
        repeat: false,
      }),
    ).toBeNull();
    expect(
      typingKeyFromEvent({
        key: "Shift",
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        isComposing: false,
        repeat: false,
      }),
    ).toBeNull();
  });
});

describe("applyTypingKey", () => {
  it("counts a miss without advancing, then scores only a finished reply", () => {
    let play = startPlay([problemA, problemB], 1_000);
    play = applyTypingKey(play, "x", "KeyX", 1_100);
    expect(play.totalMisses).toBe(1);
    expect(play.salary).toBe(0);
    expect(play.sentCount).toBe(0);
    expect(play.combo.current).toBe(0);

    play = applyTypingKey(play, "a", "KeyA", 1_400);
    expect(play.sentCount).toBe(1);
    expect(play.salary).toBeGreaterThan(0);
    expect(play.index).toBe(1);

    const summary = summarizePlay(play, 60);
    expect(summary.missCount).toBe(1);
    expect(summary.sentCount).toBe(1);
    expect(summary.keys.KeyX?.misses).toBe(1);
    expect(summary.keys.KeyA?.hits).toBe(1);
  });
});
