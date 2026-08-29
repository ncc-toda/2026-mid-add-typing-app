import { useEffect, useRef, useState } from "react";
import type { PlayPayload, Problem } from "../api.ts";
import {
  applyTypingKey,
  currentProblem,
  playHighlights,
  playRomajiHint,
  startPlay,
  summarizePlay,
  typingKeyFromEvent,
  type LivePlay,
} from "../play.ts";
import { DIFFICULTY_META } from "./DifficultyScreen.tsx";

const PLAY_MS = 60_000;
const AVATARS = ["#c4b5fd", "#67e8f9", "#f9a8d4", "#86efac", "#fdba74"];

function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % AVATARS.length;
  return AVATARS[hash] ?? "#c4b5fd";
}

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

type Props = {
  problems: Problem[];
  onFinish: (payload: PlayPayload) => void;
};

export function PlayScreen({ problems, onFinish }: Props) {
  const startedAtRef = useRef(Date.now());
  const [play, setPlay] = useState<LivePlay>(() => startPlay(problems, startedAtRef.current));
  const [remainingMs, setRemainingMs] = useState(PLAY_MS);
  const playRef = useRef(play);
  const finishedRef = useRef(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  playRef.current = play;

  useEffect(() => {
    const startedAt = startedAtRef.current;
    const id = window.setInterval(() => {
      const left = Math.max(0, PLAY_MS - (Date.now() - startedAt));
      setRemainingMs(left);
      if (left === 0) {
        if (finishedRef.current) return;
        finishedRef.current = true;
        onFinishRef.current(summarizePlay(playRef.current, 60));
      }
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (finishedRef.current) return;
      const key = typingKeyFromEvent(event);
      if (key === null) return;
      event.preventDefault();
      setPlay((current) => applyTypingKey(current, key, event.code, Date.now()));
    }
    window.addEventListener("keydown", onKeyDown);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [play.messages.length]);

  const problem = currentProblem(play);
  const meta = DIFFICULTY_META[play.difficulty];
  const highlights = playHighlights(play);
  const visible = play.messages.slice(-8);

  return (
    <div>
      <header className="hud">
        <div className="hud-block">
          <div className="k">オオダ · {meta.short}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
            返信 {play.sentCount} / combo
          </div>
          <span className="combo-pill">{play.combo.current} HIT</span>
        </div>
        <div className="hud-block pay">
          <div className="k">ゲーム内年収</div>
          <div className="v">
            {play.salary}
            <small>万</small>
          </div>
        </div>
        <div className={`hud-block time${remainingMs <= 10_000 ? " is-low" : ""}`}>
          <div className="k">残り</div>
          <div className="v">{formatTime(remainingMs)}</div>
        </div>
      </header>

      <div className="stage">
        <div className="channel-chip">
          <span className="dot" /> {problem?.channel || "#web-app"} に投稿中
        </div>
        <div className="chat" ref={chatRef}>
          {visible.map((message, index) =>
            message.kind === "in" ? (
              <div className="row" key={`in-${index}`}>
                <div className="av" style={{ background: avatarColor(message.sender) }}>
                  {message.sender.slice(0, 1)}
                </div>
                <div>
                  <div className="sender-name">{message.sender}</div>
                  <div className="bubble">{message.text}</div>
                </div>
              </div>
            ) : (
              <div className="row me" key={`out-${index}`}>
                <div className="av" style={{ background: "#fb7185" }}>
                  オ
                </div>
                <div>
                  <div className="sender-name">オオダ</div>
                  <div className="bubble">{message.text}</div>
                  <span className="gain">昇給 +{message.gain}万</span>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="keyboard-stage">
          <input
            ref={inputRef}
            className="ime-trap"
            readOnly
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="ローマ字入力"
            onBlur={() => inputRef.current?.focus()}
          />
          <div className="k" style={{ color: "#fde047" }}>
            いま打つ返信
          </div>
          <div className={`target${play.missTick > 0 ? " is-miss" : ""}`} key={play.missTick}>
            {highlights.map((unit, index) => (
              <span
                key={`${index}-${unit.display}`}
                className={
                  unit.status === "done" ? "done" : unit.status === "current" ? "cur" : "rest"
                }
              >
                {unit.display}
              </span>
            ))}
          </div>
          <div className="romaji">{playRomajiHint(play)}</div>
          <div className="hint">全文一致で自動送信 · ミスするとコンボ消滅 · IME は使わない</div>
        </div>
      </div>
    </div>
  );
}
