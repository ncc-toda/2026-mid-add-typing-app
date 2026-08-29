import { describe, expect, it } from "vite-plus/test";
import {
  createSession,
  createSessionFromReading,
  highlightUnits,
  isFinished,
  remainingRomaji,
  typeKey,
  tokenizeReading,
} from "./romaji.ts";

function feed(reading: string, keys: string) {
  let session = createSessionFromReading(reading);
  let misses = 0;
  let hits = 0;
  for (const key of keys) {
    const result = typeKey(session, key);
    session = result.session;
    if (result.accepted) hits += 1;
    if (result.miss) misses += 1;
  }
  return { session, hits, misses, finished: isFinished(session) };
}

describe("romaji variants", () => {
  it("accepts si and shi for し", () => {
    expect(feed("し", "shi").finished).toBe(true);
    expect(feed("し", "si").finished).toBe(true);
    expect(remainingRomaji(createSessionFromReading("し"))).toBe("shi");
  });

  it("accepts ti and chi for ち", () => {
    expect(feed("ち", "chi").finished).toBe(true);
    expect(feed("ち", "ti").finished).toBe(true);
  });

  it("accepts tu and tsu for つ", () => {
    expect(feed("つ", "tsu").finished).toBe(true);
    expect(feed("つ", "tu").finished).toBe(true);
  });

  it("accepts hu and fu for ふ", () => {
    expect(feed("ふ", "fu").finished).toBe(true);
    expect(feed("ふ", "hu").finished).toBe(true);
  });

  it("accepts sha/sya and ja/zya youon", () => {
    expect(feed("しゃ", "sha").finished).toBe(true);
    expect(feed("しゃ", "sya").finished).toBe(true);
    expect(feed("じゃ", "ja").finished).toBe(true);
    expect(feed("じゃ", "zya").finished).toBe(true);
  });
});

describe("ん IME rules", () => {
  it("allows n or nn before a consonant", () => {
    expect(feed("んか", "nka").finished).toBe(true);
    expect(feed("んか", "nnka").finished).toBe(true);
    expect(remainingRomaji(createSessionFromReading("んか"))).toBe("nka");
  });

  it("requires nn before a vowel", () => {
    expect(feed("んあ", "nna").finished).toBe(true);
    expect(feed("んあ", "na").finished).toBe(false);
    expect(feed("んあ", "na").misses).toBeGreaterThan(0);
    expect(remainingRomaji(createSessionFromReading("んあ"))).toBe("nna");
  });

  it("requires nn before y", () => {
    expect(feed("んや", "nnya").finished).toBe(true);
    expect(feed("んや", "nya").finished).toBe(false);
  });

  it("requires nn before な", () => {
    expect(feed("んな", "nnna").finished).toBe(true);
    expect(feed("んな", "nna").finished).toBe(false);
  });

  it("allows n or nn at end of reading", () => {
    expect(feed("かん", "kan").finished).toBe(true);
    expect(feed("かん", "kann").finished).toBe(true);
  });
});

describe("っ doubled consonant", () => {
  it("doubles the next consonant", () => {
    expect(feed("った", "tta").finished).toBe(true);
    expect(feed("っか", "kka").finished).toBe(true);
    expect(feed("っし", "sshi").finished).toBe(true);
    expect(feed("っし", "ssi").finished).toBe(true);
  });

  it("accepts cchi/tti/tchi for っち", () => {
    expect(feed("っち", "cchi").finished).toBe(true);
    expect(feed("っち", "tti").finished).toBe(true);
    expect(feed("っち", "tchi").finished).toBe(true);
  });
});

describe("long vowel ー", () => {
  it("accepts hyphen and the previous vowel", () => {
    expect(feed("かー", "ka-").finished).toBe(true);
    expect(feed("かー", "kaa").finished).toBe(true);
    expect(feed("しー", "shi-").finished).toBe(true);
    expect(feed("しー", "shii").finished).toBe(true);
  });
});

describe("mixed ASCII", () => {
  it("types letters, digits, symbols, and newlines as displayed", () => {
    expect(feed("PR #12", "PR #12").finished).toBe(true);
    expect(feed("ok!\n", "ok!\n").finished).toBe(true);
    expect(feed("かくPR", "kakuPR").finished).toBe(true);
  });
});

describe("punctuation without IME", () => {
  it("accepts ASCII keys for fullwidth symbols and shows them in the hint", () => {
    expect(remainingRomaji(createSessionFromReading("。"))).toBe(".");
    expect(remainingRomaji(createSessionFromReading("…"))).toBe("...");
    expect(feed("。", ".").finished).toBe(true);
    expect(feed("、", ",").finished).toBe(true);
    expect(feed("！", "!").finished).toBe(true);
    expect(feed("（5）", "(5)").finished).toBe(true);
    expect(feed("「あ」", "[a]").finished).toBe(true);
    expect(feed("…", "...").finished).toBe(true);
    expect(feed("→", "->").finished).toBe(true);
    expect(feed("かくにんします。", "kakuninshimasu.").finished).toBe(true);
  });
});

describe("force-correct", () => {
  it("counts a wrong key as a miss and does not advance", () => {
    const start = createSessionFromReading("か");
    const missed = typeKey(start, "x");
    expect(missed.accepted).toBe(false);
    expect(missed.miss).toBe(true);
    expect(missed.session.tokenIndex).toBe(0);
    expect(missed.session.prefix).toBe("");
    expect(remainingRomaji(missed.session)).toBe("ka");

    const after = typeKey(missed.session, "k");
    expect(after.accepted).toBe(true);
    expect(remainingRomaji(after.session)).toBe("a");
  });
});

describe("reply_units highlight", () => {
  it("tracks unit progress from reading consumption", () => {
    const units = [
      { display: "確認", reading: "かくにん" },
      { display: "します", reading: "します" },
      { display: "。", reading: "." },
    ];
    let session = createSession(units);
    expect(highlightUnits(session).map((u) => u.status)).toEqual(["current", "pending", "pending"]);
    expect(remainingRomaji(session).length).toBeGreaterThan(0);

    for (const key of "kakunin") {
      session = typeKey(session, key).session;
    }
    expect(highlightUnits(session).map((u) => u.status)).toEqual(["done", "current", "pending"]);

    for (const key of "shimasu.") {
      session = typeKey(session, key).session;
    }
    expect(isFinished(session)).toBe(true);
    expect(highlightUnits(session).map((u) => u.status)).toEqual(["done", "done", "done"]);
    expect(remainingRomaji(session)).toBe("");
  });
});

describe("tokenizeReading", () => {
  it("keeps ASCII as literal tokens", () => {
    const tokens = tokenizeReading("A\n");
    expect(tokens.map((t) => t.patterns[0])).toEqual(["A", "\n"]);
  });
});
