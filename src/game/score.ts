export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Combo = {
  current: number;
  max: number;
};

const DIFFICULTY = {
  beginner: { base: 15, perWeight: 0.5, kpmBaseline: 220 },
  intermediate: { base: 28, perWeight: 0.7, kpmBaseline: 300 },
  advanced: { base: 45, perWeight: 0.9, kpmBaseline: 380 },
} as const;

export const KPM_BASELINE = {
  beginner: DIFFICULTY.beginner.kpmBaseline,
  intermediate: DIFFICULTY.intermediate.kpmBaseline,
  advanced: DIFFICULTY.advanced.kpmBaseline,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function charWeight(char: string): number {
  if (char.length === 0) return 0;
  const code = char.codePointAt(0) ?? 0;
  if (code < 128) return 1.5;
  return 1;
}

export function weightedCharCount(text: string): number {
  let total = 0;
  for (const char of text) {
    total += charWeight(char);
  }
  return total;
}

export function replyBase(difficulty: Difficulty, weightedChars: number): number {
  const { base, perWeight } = DIFFICULTY[difficulty];
  return base + weightedChars * perWeight;
}

export function keysPerMinute(correctKeys: number, seconds: number): number {
  if (seconds <= 0) return correctKeys > 0 ? Number.POSITIVE_INFINITY : 0;
  return (correctKeys / seconds) * 60;
}

export function speedCoefficient(kpm: number, difficulty: Difficulty): number {
  return clamp(kpm / DIFFICULTY[difficulty].kpmBaseline, 0.6, 1.4);
}

export function accuracyRatio(correctKeys: number, misses: number): number {
  const total = correctKeys + misses;
  if (total === 0) return 0;
  return correctKeys / total;
}

export function accuracyCoefficient(accuracy: number): number {
  return 0.7 + accuracy * 0.45;
}

export function replySalary(input: {
  difficulty: Difficulty;
  text: string;
  correctKeys: number;
  misses: number;
  seconds: number;
}): number {
  const weighted = weightedCharCount(input.text);
  const base = replyBase(input.difficulty, weighted);
  const kpm = keysPerMinute(input.correctKeys, input.seconds);
  const speed = speedCoefficient(kpm, input.difficulty);
  const accuracy = accuracyCoefficient(accuracyRatio(input.correctKeys, input.misses));
  return Math.round(base * speed * accuracy);
}

export function emptyCombo(): Combo {
  return { current: 0, max: 0 };
}

export function comboCorrect(combo: Combo): Combo {
  const current = combo.current + 1;
  return { current, max: Math.max(combo.max, current) };
}

export function comboMiss(combo: Combo): Combo {
  return { current: 0, max: combo.max };
}
