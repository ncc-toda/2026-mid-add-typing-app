export type {
  ReplyUnit,
  RomajiToken,
  TypeKeyResult,
  TypingSession,
  UnitHighlight,
} from "./romaji.ts";
export {
  createSession,
  createSessionFromReading,
  highlightUnits,
  isFinished,
  readingCharsDone,
  remainingRomaji,
  tokenizeReading,
  typeKey,
} from "./romaji.ts";

export type { Combo, Difficulty } from "./score.ts";
export {
  accuracyCoefficient,
  accuracyRatio,
  charWeight,
  comboCorrect,
  comboMiss,
  emptyCombo,
  keysPerMinute,
  KPM_BASELINE,
  replyBase,
  replySalary,
  speedCoefficient,
  weightedCharCount,
} from "./score.ts";

export type { Finger } from "./fingers.ts";
export { FINGERS, fingerForCode } from "./fingers.ts";

export type {
  CountPair,
  RankedFingerStat,
  RankedKeyStat,
  RankedTransitionStat,
  StatsAggregate,
  StatStatus,
} from "./stats.ts";
export {
  addAttempt,
  attemptCount,
  emptyStats,
  fingerAggregates,
  mergeStats,
  missRate,
  missRateLabel,
  parseTransitionKey,
  STATS_THRESHOLD,
  statStatus,
  transitionKey,
  weakestFingers,
  weakestKeys,
  weakestTransitions,
} from "./stats.ts";
