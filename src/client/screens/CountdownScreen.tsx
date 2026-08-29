import { useEffect, useState } from "react";

type Props = {
  onDone: () => void;
};

export function CountdownScreen({ onDone }: Props) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onDone();
      return;
    }
    const id = window.setTimeout(() => setCount((value) => value - 1), 700);
    return () => window.clearTimeout(id);
  }, [count, onDone]);

  return (
    <div className="screen">
      <div className="panel" style={{ textAlign: "center" }}>
        <div className="stamp">GET READY</div>
        <p className="tag">ローマ字で打て。全文一致で自動送信。</p>
        <div className="countdown">{count > 0 ? count : "GO"}</div>
      </div>
    </div>
  );
}
