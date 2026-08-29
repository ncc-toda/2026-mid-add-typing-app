import type { Difficulty } from "../../game/index.ts";

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; role: string; short: string; className: string; blurb: string }
> = {
  beginner: {
    label: "初級",
    role: "新米エンジニア",
    short: "新米",
    className: "beginner",
    blurb: "短文・記号少なめ。丁寧で初々しい。ボケは小さめ。",
  },
  intermediate: {
    label: "中級",
    role: "慣れてきたエンジニア",
    short: "慣れてきた",
    className: "middle",
    blurb: "@、PR、Markdown。ちょっと盛る。調子に乗り始める。",
  },
  advanced: {
    label: "上級",
    role: "つよつよエンジニア",
    short: "つよつよ",
    className: "senior",
    blurb: "複数行・引用・技術用語。自分は神、という設定。",
  },
};

type Props = {
  loading: boolean;
  error: string | null;
  onPick: (difficulty: Difficulty) => void;
  onBack: () => void;
};

export function DifficultyScreen({ loading, error, onPick, onBack }: Props) {
  return (
    <div className="screen">
      <div className="panel">
        <div className="stamp">SELECT ROLE</div>
        <h1>どのエンジニアで打つ？</h1>
        <p className="tag">時間は全部 60 秒。文章がキツくなるだけ。</p>
        {error ? <p className="error">{error}</p> : null}
        <div className="cards">
          {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((difficulty) => {
            const meta = DIFFICULTY_META[difficulty];
            return (
              <button
                key={difficulty}
                type="button"
                className={`card ${meta.className}`}
                disabled={loading}
                onClick={() => onPick(difficulty)}
              >
                <strong>{meta.label}</strong>
                <h2>{meta.role}</h2>
                <p>{meta.blurb}</p>
              </button>
            );
          })}
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}
