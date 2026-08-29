import { useState } from "react";
import type { StatsResponse } from "../api.ts";

function labelForCode(code: string): string {
  if (code.startsWith("Key") && code.length === 4) return code.slice(3).toLowerCase();
  if (code.startsWith("Digit")) return code.slice(5);
  const labels: Record<string, string> = {
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backquote: "`",
    Space: "Space",
    Enter: "Enter",
    IntlRo: "_",
    IntlYen: "¥",
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
  };
  return labels[code] ?? code;
}

function rateLabel(rate: number | null, status: string): string {
  if (status !== "ok" || rate === null) return "データ不足";
  return `${Math.round(rate * 1000) / 10}%`;
}

type Props = {
  stats: StatsResponse | null;
  error: string | null;
  resetting: boolean;
  onReset: () => void;
  onTitle: () => void;
};

export function StatsScreen({ stats, error, resetting, onReset, onTitle }: Props) {
  const [confirming, setConfirming] = useState(false);
  const worstOk =
    stats?.fingers.filter((finger) => finger.status === "ok" && (finger.missRate ?? 0) > 0) ?? [];
  const badLimit = Math.max(...worstOk.map((finger) => finger.missRate ?? 0), 0);

  return (
    <div className="screen">
      <div className="panel">
        <div className="stamp">YOUR WEAK SPOTS</div>
        <h1>統計</h1>
        <p className="tag">累計 {stats?.playCount ?? 0} プレイ</p>
        {error ? <p className="error">{error}</p> : null}

        <h2 style={{ fontSize: 16, margin: "20px 0 8px" }}>苦手な指</h2>
        <div className="fingers">
          {(stats?.fingers ?? []).map((finger) => {
            const bad = finger.status === "ok" && finger.missRate === badLimit && badLimit > 0;
            return (
              <div key={finger.finger} className={bad ? "finger bad" : "finger"}>
                {finger.finger} {rateLabel(finger.missRate, finger.status)}
              </div>
            );
          })}
        </div>
        {!stats || stats.fingers.length === 0 ? <p className="empty-note">データ不足</p> : null}

        <div className="cols">
          <div>
            <h2 style={{ fontSize: 16 }}>苦手キー</h2>
            {stats && stats.keys.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>キー</th>
                    <th>入力</th>
                    <th>ミス</th>
                    <th>率</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.keys.map((row) => (
                    <tr key={row.code}>
                      <td>{labelForCode(row.code)}</td>
                      <td>{row.hits + row.misses}</td>
                      <td>{row.misses}</td>
                      <td>{Math.round(row.missRate * 1000) / 10}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-note">データ不足</p>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: 16 }}>苦手な動き</h2>
            {stats && stats.transitions.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>遷移</th>
                    <th>回数</th>
                    <th>率</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.transitions.map((row) => (
                    <tr key={`${row.from}>${row.to}`}>
                      <td>
                        {labelForCode(row.from)} → {labelForCode(row.to)}
                      </td>
                      <td>{row.hits + row.misses}</td>
                      <td>{Math.round(row.missRate * 1000) / 10}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-note">データ不足</p>
            )}
          </div>
        </div>

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={onTitle}>
            タイトルへ
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={resetting}
            onClick={() => setConfirming(true)}
          >
            リセット
          </button>
        </div>
      </div>

      {confirming ? (
        <div className="overlay">
          <div className="dialog">
            <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>統計をリセットしますか？</h2>
            <p className="tag">キーと遷移の累計だけ消します。ハイスコアは残ります。</p>
            <div className="actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={resetting}
                onClick={() => {
                  setConfirming(false);
                  onReset();
                }}
              >
                リセットする
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                やめる
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
