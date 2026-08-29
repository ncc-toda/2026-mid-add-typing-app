export type ReplyUnit = {
  display: string;
  reading: string;
};

export type RomajiToken = {
  surface: string;
  start: number;
  end: number;
  patterns: readonly string[];
};

export type TypingSession = {
  readonly units: readonly ReplyUnit[];
  readonly reading: string;
  readonly tokens: readonly RomajiToken[];
  readonly tokenIndex: number;
  readonly prefix: string;
};

export type TypeKeyResult = {
  session: TypingSession;
  accepted: boolean;
  miss: boolean;
};

export type UnitHighlight = {
  display: string;
  reading: string;
  status: "done" | "current" | "pending";
};

const YOUON: Record<string, readonly string[]> = {
  きゃ: ["kya"],
  きゅ: ["kyu"],
  きょ: ["kyo"],
  しゃ: ["sha", "sya"],
  しゅ: ["shu", "syu"],
  しょ: ["sho", "syo"],
  ちゃ: ["cha", "tya", "cya"],
  ちゅ: ["chu", "tyu", "cyu"],
  ちょ: ["cho", "tyo", "cyo"],
  にゃ: ["nya"],
  にゅ: ["nyu"],
  にょ: ["nyo"],
  ひゃ: ["hya"],
  ひゅ: ["hyu"],
  ひょ: ["hyo"],
  みゃ: ["mya"],
  みゅ: ["myu"],
  みょ: ["myo"],
  りゃ: ["rya"],
  りゅ: ["ryu"],
  りょ: ["ryo"],
  ぎゃ: ["gya"],
  ぎゅ: ["gyu"],
  ぎょ: ["gyo"],
  じゃ: ["ja", "zya", "jya"],
  じゅ: ["ju", "zyu", "jyu"],
  じょ: ["jo", "zyo", "jyo"],
  びゃ: ["bya"],
  びゅ: ["byu"],
  びょ: ["byo"],
  ぴゃ: ["pya"],
  ぴゅ: ["pyu"],
  ぴょ: ["pyo"],
  ぢゃ: ["dya", "ja"],
  ぢゅ: ["dyu", "ju"],
  ぢょ: ["dyo", "jo"],
  ふぁ: ["fa"],
  ふぃ: ["fi"],
  ふぇ: ["fe"],
  ふぉ: ["fo"],
  てぃ: ["thi", "texi"],
  でぃ: ["dhi", "dexi"],
  とぅ: ["twu", "toxu"],
  どぅ: ["dwu", "doxu"],
  うぃ: ["wi", "uxi"],
  うぇ: ["we", "uxe"],
  うぉ: ["who", "uxo"],
  ゔぁ: ["va"],
  ゔぃ: ["vi"],
  ゔぇ: ["ve"],
  ゔぉ: ["vo"],
};

const KANA: Record<string, readonly string[]> = {
  あ: ["a"],
  い: ["i"],
  う: ["u"],
  え: ["e"],
  お: ["o"],
  か: ["ka"],
  き: ["ki"],
  く: ["ku"],
  け: ["ke"],
  こ: ["ko"],
  さ: ["sa"],
  し: ["shi", "si"],
  す: ["su"],
  せ: ["se"],
  そ: ["so"],
  た: ["ta"],
  ち: ["chi", "ti"],
  つ: ["tsu", "tu"],
  て: ["te"],
  と: ["to"],
  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],
  は: ["ha"],
  ひ: ["hi"],
  ふ: ["fu", "hu"],
  へ: ["he"],
  ほ: ["ho"],
  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],
  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],
  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],
  わ: ["wa"],
  を: ["wo", "o"],
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],
  ざ: ["za"],
  じ: ["ji", "zi"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],
  だ: ["da"],
  ぢ: ["di", "ji"],
  づ: ["du", "zu"],
  で: ["de"],
  ど: ["do"],
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],
  ぁ: ["xa", "la"],
  ぃ: ["xi", "li"],
  ぅ: ["xu", "lu"],
  ぇ: ["xe", "le"],
  ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"],
  ゅ: ["xyu", "lyu"],
  ょ: ["xyo", "lyo"],
  ゎ: ["xwa", "lwa"],
  っ: ["xtu", "ltu", "xtsu", "ltsu"],
  ゔ: ["vu"],
};

const VOWELS = new Set(["a", "i", "u", "e", "o"]);
const NN_NEXT = new Set(["a", "i", "u", "e", "o", "y", "n"]);

const PUNCTUATION: Record<string, readonly string[]> = {
  "。": [".", "。"],
  "、": [",", "、"],
  "！": ["!", "！"],
  "？": ["?", "？"],
  "（": ["(", "（"],
  "）": [")", "）"],
  "「": ["[", "「"],
  "」": ["]", "」"],
  "…": ["...", "…"],
  "→": ["->", "→"],
};

function toHiragana(ch: string): string {
  const code = ch.codePointAt(0);
  if (code === undefined) return ch;
  if (code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCodePoint(code - 0x60);
  }
  return ch;
}

function isChouon(ch: string): boolean {
  return ch === "ー";
}

function isSokuon(ch: string): boolean {
  return toHiragana(ch) === "っ";
}

function isHatsuon(ch: string): boolean {
  return toHiragana(ch) === "ん";
}

function hasKanaReading(ch: string): boolean {
  if (isChouon(ch) || isSokuon(ch) || isHatsuon(ch)) return true;
  return toHiragana(ch) in KANA;
}

function peekMora(reading: string, index: number): RomajiToken | null {
  if (index >= reading.length) return null;
  const first = reading[index] ?? "";
  const second = reading[index + 1] ?? "";
  const two = toHiragana(first) + toHiragana(second);
  const youon = YOUON[two];
  if (youon && second !== "") {
    return {
      surface: reading.slice(index, index + 2),
      start: index,
      end: index + 2,
      patterns: youon,
    };
  }
  const one = toHiragana(first);
  const kana = KANA[one];
  if (kana) {
    return {
      surface: first,
      start: index,
      end: index + 1,
      patterns: kana,
    };
  }
  return null;
}

function withSokuon(patterns: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const pattern of patterns) {
    if (pattern.length === 0) continue;
    const doubled = pattern[0] + pattern;
    if (!seen.has(doubled)) {
      seen.add(doubled);
      out.push(doubled);
    }
    if (pattern.startsWith("ch")) {
      const tch = `t${pattern}`;
      if (!seen.has(tch)) {
        seen.add(tch);
        out.push(tch);
      }
    }
  }
  return out;
}

function startsWithConsonant(patterns: readonly string[]): boolean {
  const first = patterns[0]?.[0];
  return first !== undefined && !VOWELS.has(first);
}

function lastVowel(patterns: readonly string[]): string | null {
  const preferred = patterns[0];
  if (!preferred) return null;
  for (let i = preferred.length - 1; i >= 0; i--) {
    const ch = preferred[i] ?? "";
    if (VOWELS.has(ch)) return ch;
  }
  return null;
}

function hatsuonPatterns(next: readonly string[] | undefined): string[] {
  const head = next?.[0]?.[0];
  if (head !== undefined && NN_NEXT.has(head)) return ["nn"];
  return ["n", "nn"];
}

export function tokenizeReading(reading: string): RomajiToken[] {
  const tokens: RomajiToken[] = [];
  let i = 0;
  while (i < reading.length) {
    const ch = reading[i] ?? "";

    if (isSokuon(ch)) {
      const next = peekMora(reading, i + 1);
      if (next && startsWithConsonant(next.patterns)) {
        tokens.push({
          surface: reading.slice(i, next.end),
          start: i,
          end: next.end,
          patterns: withSokuon(next.patterns),
        });
        i = next.end;
        continue;
      }
      tokens.push({
        surface: ch,
        start: i,
        end: i + 1,
        patterns: KANA["っ"] ?? ["xtu"],
      });
      i += 1;
      continue;
    }

    if (isHatsuon(ch)) {
      tokens.push({
        surface: ch,
        start: i,
        end: i + 1,
        patterns: ["n", "nn"],
      });
      i += 1;
      continue;
    }

    if (isChouon(ch)) {
      tokens.push({
        surface: ch,
        start: i,
        end: i + 1,
        patterns: ["-"],
      });
      i += 1;
      continue;
    }

    if (hasKanaReading(ch)) {
      const mora = peekMora(reading, i);
      if (mora) {
        tokens.push(mora);
        i = mora.end;
        continue;
      }
    }

    tokens.push({
      surface: ch,
      start: i,
      end: i + 1,
      patterns: PUNCTUATION[ch] ?? [ch],
    });
    i += 1;
  }

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    if (!token) continue;
    if (isHatsuon(token.surface)) {
      tokens[t] = {
        ...token,
        patterns: hatsuonPatterns(tokens[t + 1]?.patterns),
      };
    } else if (isChouon(token.surface)) {
      const vowel = lastVowel(tokens[t - 1]?.patterns ?? []);
      tokens[t] = {
        ...token,
        patterns: vowel ? ["-", vowel] : ["-"],
      };
    }
  }

  return tokens;
}

export function createSession(units: readonly ReplyUnit[]): TypingSession {
  const reading = units.map((unit) => unit.reading).join("");
  return {
    units,
    reading,
    tokens: tokenizeReading(reading),
    tokenIndex: 0,
    prefix: "",
  };
}

export function createSessionFromReading(reading: string): TypingSession {
  return createSession([{ display: reading, reading }]);
}

function lastTokenComplete(session: TypingSession): boolean {
  if (session.tokenIndex !== session.tokens.length - 1) return false;
  const token = session.tokens[session.tokenIndex];
  return token !== undefined && token.patterns.includes(session.prefix);
}

export function isFinished(session: TypingSession): boolean {
  return session.tokenIndex >= session.tokens.length || lastTokenComplete(session);
}

function preferredRest(patterns: readonly string[], prefix: string): string {
  if (prefix.length === 0) return patterns[0] ?? "";
  const match = patterns.find((pattern) => pattern.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  if (patterns.includes(prefix)) return "";
  return (patterns[0] ?? "").slice(prefix.length);
}

export function remainingRomaji(session: TypingSession): string {
  if (isFinished(session)) return "";
  const current = session.tokens[session.tokenIndex];
  if (!current) return "";
  const parts = [preferredRest(current.patterns, session.prefix)];
  for (let i = session.tokenIndex + 1; i < session.tokens.length; i++) {
    parts.push(session.tokens[i]?.patterns[0] ?? "");
  }
  return parts.join("");
}

export function readingCharsDone(session: TypingSession): number {
  if (isFinished(session)) return session.reading.length;
  const current = session.tokens[session.tokenIndex];
  if (!current) return session.reading.length;
  if (session.prefix.length > 0 && current.patterns.includes(session.prefix)) {
    return current.end;
  }
  return current.start;
}

export function highlightUnits(session: TypingSession): UnitHighlight[] {
  const done = readingCharsDone(session);
  let offset = 0;
  return session.units.map((unit) => {
    const start = offset;
    offset += unit.reading.length;
    let status: UnitHighlight["status"];
    if (done >= offset) status = "done";
    else if (done >= start) status = "current";
    else status = "pending";
    return { display: unit.display, reading: unit.reading, status };
  });
}

export function typeKey(session: TypingSession, key: string): TypeKeyResult {
  if (key.length !== 1) {
    return { session, accepted: false, miss: false };
  }
  if (session.tokenIndex >= session.tokens.length) {
    return { session, accepted: false, miss: false };
  }

  const token = session.tokens[session.tokenIndex];
  if (!token) {
    return { session, accepted: false, miss: false };
  }

  const nextPrefix = session.prefix + key;
  const continuing = token.patterns.filter((pattern) => pattern.startsWith(nextPrefix));

  if (continuing.length > 0) {
    const completed = continuing.some((pattern) => pattern === nextPrefix);
    const longer = continuing.some((pattern) => pattern.length > nextPrefix.length);
    if (completed && !longer) {
      return {
        session: {
          ...session,
          tokenIndex: session.tokenIndex + 1,
          prefix: "",
        },
        accepted: true,
        miss: false,
      };
    }
    return {
      session: { ...session, prefix: nextPrefix },
      accepted: true,
      miss: false,
    };
  }

  if (session.prefix.length > 0 && token.patterns.includes(session.prefix)) {
    if (session.tokenIndex + 1 >= session.tokens.length) {
      return { session, accepted: false, miss: false };
    }
    return typeKey(
      {
        ...session,
        tokenIndex: session.tokenIndex + 1,
        prefix: "",
      },
      key,
    );
  }

  return { session, accepted: false, miss: true };
}
