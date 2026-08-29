import { useCallback, useEffect, useMemo, useState } from "react";
import type { Difficulty } from "../game/index.ts";
import {
  fetchHighscores,
  fetchProblems,
  fetchStats,
  postPlay,
  resetStats,
  type Highscores,
  type PlayPayload,
  type Problem,
  type StatsResponse,
} from "./api.ts";
import { getPlayerId } from "./player.ts";
import { arrangeProblems } from "./play.ts";
import { CountdownScreen } from "./screens/CountdownScreen.tsx";
import { DifficultyScreen } from "./screens/DifficultyScreen.tsx";
import { PlayScreen } from "./screens/PlayScreen.tsx";
import { ResultScreen } from "./screens/ResultScreen.tsx";
import { StatsScreen } from "./screens/StatsScreen.tsx";
import { TitleScreen } from "./screens/TitleScreen.tsx";

type View = "title" | "difficulty" | "countdown" | "play" | "result" | "stats";

export default function App() {
  const playerId = useMemo(() => getPlayerId(), []);
  const [view, setView] = useState<View>("title");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [lastFirstId, setLastFirstId] = useState<Partial<Record<Difficulty, number>>>({});
  const [highscores, setHighscores] = useState<Highscores | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [result, setResult] = useState<PlayPayload | null>(null);
  const [highscore, setHighscore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHighscores = useCallback(async () => {
    try {
      setHighscores(await fetchHighscores(playerId));
    } catch {
      setHighscores({ beginner: null, intermediate: null, advanced: null });
    }
  }, [playerId]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await fetchStats(playerId));
      setError(null);
    } catch {
      setError("統計を読み込めませんでした");
    }
  }, [playerId]);

  useEffect(() => {
    if (view === "title") void loadHighscores();
    if (view === "stats") void loadStats();
  }, [view, loadHighscores, loadStats]);

  async function pickDifficulty(next: Difficulty) {
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchProblems(next);
      if (loaded.length === 0) {
        setError("この難易度の問題がありません");
        return;
      }
      const arranged = arrangeProblems(loaded, lastFirstId[next] ?? null);
      setProblems(arranged);
      setLastFirstId((current) => ({ ...current, [next]: arranged[0]?.id }));
      setView("countdown");
    } catch {
      setError("問題を読み込めませんでした");
    } finally {
      setLoading(false);
    }
  }

  const goPlay = useCallback(() => setView("play"), []);

  async function finishPlay(payload: PlayPayload) {
    const previous = highscores?.[payload.difficulty] ?? null;
    setHighscore(payload.salary > 0 && (previous === null || payload.salary > previous));
    setResult(payload);
    setView("result");
    try {
      const saved = await postPlay(playerId, payload);
      setHighscore(saved.highscore);
    } catch {
      /* 保存失敗でも結果は表示する */
    }
  }

  async function onResetStats() {
    setResetting(true);
    try {
      await resetStats(playerId);
      await loadStats();
    } catch {
      setError("リセットに失敗しました");
    } finally {
      setResetting(false);
    }
  }

  if (view === "difficulty") {
    return (
      <DifficultyScreen
        loading={loading}
        error={error}
        onPick={pickDifficulty}
        onBack={() => setView("title")}
      />
    );
  }
  if (view === "countdown") {
    return <CountdownScreen onDone={goPlay} />;
  }
  if (view === "play") {
    return <PlayScreen problems={problems} onFinish={finishPlay} />;
  }
  if (view === "result" && result) {
    return (
      <ResultScreen
        result={result}
        highscore={highscore}
        onRetry={() => setView("difficulty")}
        onStats={() => setView("stats")}
        onTitle={() => setView("title")}
      />
    );
  }
  if (view === "stats") {
    return (
      <StatsScreen
        stats={stats}
        error={error}
        resetting={resetting}
        onReset={onResetStats}
        onTitle={() => setView("title")}
      />
    );
  }
  return (
    <TitleScreen
      highscores={highscores}
      error={error}
      onStart={() => {
        setError(null);
        setView("difficulty");
      }}
      onStats={() => setView("stats")}
    />
  );
}
