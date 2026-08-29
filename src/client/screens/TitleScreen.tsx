import type { Highscores } from "../api.ts";

function yen(value: number | null): string {
  return value === null ? "—" : `${value}万`;
}

type Props = {
  highscores: Highscores | null;
  error: string | null;
  onStart: () => void;
  onStats: () => void;
};

export function TitleScreen({ highscores, error, onStart, onStats }: Props) {
  return (
    <div className="screen">
      <div className="panel">
        <div className="stamp">60秒チャレンジ</div>
        <h1>トラブルベース打</h1>
        <p className="tag">炎上チャンネルで返信を打ち、年収を積み上げろ。</p>
        <p className="lead">
          カタカナ語はチャージ。ボケは必須。制限時間がゼロになる前に、できるだけ送れ。
        </p>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onStart}>
            ゲームスタート
          </button>
          <button type="button" className="btn btn-ghost" onClick={onStats}>
            統計
          </button>
        </div>
        <div className="hiscores">
          <div className="hs">
            <span className="k">初級 BEST</span>
            <b>{yen(highscores?.beginner ?? null)}</b>
          </div>
          <div className="hs">
            <span className="k">中級 BEST</span>
            <b>{yen(highscores?.intermediate ?? null)}</b>
          </div>
          <div className="hs">
            <span className="k">上級 BEST</span>
            <b>{yen(highscores?.advanced ?? null)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
