import type { PlayPayload } from "../api.ts";
import { DIFFICULTY_META } from "./DifficultyScreen.tsx";

type Props = {
  result: PlayPayload;
  highscore: boolean;
  onRetry: () => void;
  onStats: () => void;
  onTitle: () => void;
};

export function ResultScreen({ result, highscore, onRetry, onStats, onTitle }: Props) {
  const meta = DIFFICULTY_META[result.difficulty];
  return (
    <div className="screen">
      <div className="panel">
        <div className="hero">
          <div className="stamp">TIME UP</div>
          <div className="k">
            {meta.label} · {meta.role}
          </div>
          <div className="v">{result.salary}万</div>
          <p className="tag">
            {highscore ? "ハイスコア更新！ " : ""}
            {result.sentCount} 件送信
          </p>
        </div>
        <div className="subs">
          <div className="sub">
            <div className="k">速度</div>
            <div className="v">{Math.round(result.kpm)} KPM</div>
          </div>
          <div className="sub">
            <div className="k">正確性</div>
            <div className="v">{Math.round(result.accuracy * 100)}%</div>
          </div>
          <div className="sub">
            <div className="k">ミス</div>
            <div className="v">{result.missCount}</div>
          </div>
          <div className="sub">
            <div className="k">最大コンボ</div>
            <div className="v">{result.maxCombo}</div>
          </div>
        </div>
        <div className="actions center">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            リトライ
          </button>
          <button type="button" className="btn btn-ghost" onClick={onStats}>
            統計
          </button>
          <button type="button" className="btn btn-ghost" onClick={onTitle}>
            タイトル
          </button>
        </div>
      </div>
    </div>
  );
}
