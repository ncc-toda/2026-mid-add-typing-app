import {
  accuracyRatio,
  addAttempt,
  comboCorrect,
  comboMiss,
  createSession,
  emptyCombo,
  emptyStats,
  highlightUnits,
  isFinished,
  keysPerMinute,
  remainingRomaji,
  replySalary,
  typeKey,
  type Combo,
  type StatsAggregate,
  type TypingSession,
} from "../game/index.ts";
import type { PlayPayload, Problem } from "./api.ts";

const IGNORED_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Tab",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "Delete",
  "Backspace",
  "Fn",
  "ContextMenu",
  "NumLock",
  "ScrollLock",
  "Pause",
  "Process",
  "Dead",
  "Unidentified",
]);

export type ChatMessage =
  | { kind: "in"; sender: string; text: string }
  | { kind: "out"; text: string; gain: number };

export type LivePlay = {
  problems: Problem[];
  difficulty: Problem["difficulty"];
  index: number;
  session: TypingSession;
  combo: Combo;
  salary: number;
  sentCount: number;
  totalCorrect: number;
  totalMisses: number;
  replyCorrect: number;
  replyMisses: number;
  replyStartedAt: number;
  keyStats: StatsAggregate;
  previousCode: string | null;
  messages: ChatMessage[];
  missTick: number;
};

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = out[i]!;
    out[i] = out[j]!;
    out[j] = current;
  }
  return out;
}

export function arrangeProblems<T extends { id: number }>(
  items: readonly T[],
  avoidFirstId: number | null,
): T[] {
  const shuffled = shuffle(items);
  if (avoidFirstId === null || shuffled.length < 2) return shuffled;
  if (shuffled[0]?.id !== avoidFirstId) return shuffled;
  const swapAt = 1 + Math.floor(Math.random() * (shuffled.length - 1));
  const first = shuffled[0]!;
  shuffled[0] = shuffled[swapAt]!;
  shuffled[swapAt] = first;
  return shuffled;
}

export function typingKeyFromEvent(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  isComposing: boolean;
  repeat: boolean;
}): string | null {
  if (event.isComposing || event.repeat) return null;
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  if (IGNORED_KEYS.has(event.key)) return null;
  if (/^F\d+$/.test(event.key)) return null;
  if (event.key === "Enter") return "\n";
  if (event.key.length === 1) return event.key;
  return null;
}

export function startPlay(problems: Problem[], now: number): LivePlay {
  const first = problems[0];
  if (!first) {
    throw new Error("no problems");
  }
  return {
    problems,
    difficulty: first.difficulty,
    index: 0,
    session: createSession(first.reply_units),
    combo: emptyCombo(),
    salary: 0,
    sentCount: 0,
    totalCorrect: 0,
    totalMisses: 0,
    replyCorrect: 0,
    replyMisses: 0,
    replyStartedAt: now,
    keyStats: emptyStats(),
    previousCode: null,
    messages: [incoming(first)],
    missTick: 0,
  };
}

export function applyTypingKey(play: LivePlay, key: string, code: string, now: number): LivePlay {
  const result = typeKey(play.session, key);
  if (!result.accepted && !result.miss) return play;

  const keyStats = addAttempt(play.keyStats, code, result.accepted, play.previousCode);
  const previousCode = code;

  if (result.miss) {
    return {
      ...play,
      session: result.session,
      combo: comboMiss(play.combo),
      totalMisses: play.totalMisses + 1,
      replyMisses: play.replyMisses + 1,
      keyStats,
      previousCode,
      missTick: play.missTick + 1,
    };
  }

  const advanced: LivePlay = {
    ...play,
    session: result.session,
    combo: comboCorrect(play.combo),
    totalCorrect: play.totalCorrect + 1,
    replyCorrect: play.replyCorrect + 1,
    keyStats,
    previousCode,
  };

  if (!isFinished(result.session)) return advanced;
  return sendCurrentReply(advanced, now);
}

function sendCurrentReply(play: LivePlay, now: number): LivePlay {
  const problem = play.problems[play.index];
  if (!problem) return play;

  const seconds = Math.max(0.05, (now - play.replyStartedAt) / 1000);
  const gain = replySalary({
    difficulty: play.difficulty,
    text: problem.reply_text,
    correctKeys: play.replyCorrect,
    misses: play.replyMisses,
    seconds,
  });

  let problems = play.problems;
  let index = play.index + 1;
  if (index >= problems.length) {
    problems = arrangeProblems(play.problems, problem.id);
    index = 0;
  }
  const next = problems[index];
  if (!next) return play;

  return {
    ...play,
    problems,
    index,
    salary: play.salary + gain,
    sentCount: play.sentCount + 1,
    session: createSession(next.reply_units),
    replyCorrect: 0,
    replyMisses: 0,
    replyStartedAt: now,
    messages: [...play.messages, { kind: "out", text: problem.reply_text, gain }, incoming(next)],
  };
}

export function summarizePlay(play: LivePlay, elapsedSeconds: number): PlayPayload {
  return {
    difficulty: play.difficulty,
    salary: play.salary,
    kpm: keysPerMinute(play.totalCorrect, elapsedSeconds),
    accuracy: accuracyRatio(play.totalCorrect, play.totalMisses),
    missCount: play.totalMisses,
    maxCombo: play.combo.max,
    sentCount: play.sentCount,
    keys: play.keyStats.keys,
    transitions: play.keyStats.transitions,
  };
}

export function currentProblem(play: LivePlay): Problem | undefined {
  return play.problems[play.index];
}

export function playHighlights(play: LivePlay) {
  return highlightUnits(play.session);
}

export function playRomajiHint(play: LivePlay): string {
  return remainingRomaji(play.session);
}

function incoming(problem: Problem): ChatMessage {
  return { kind: "in", sender: problem.sender, text: problem.incoming_message };
}
