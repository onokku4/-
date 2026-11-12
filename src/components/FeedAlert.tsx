import { Leaf } from "lucide-react";
import type { Bed } from "../types";
import { soilType } from "../data/catalog";
import { styles } from "../styles";

interface Props {
  due: Bed[];
  onPick: (bedId: string) => void;
}

/** 追肥どきの場所。押すとその場所の肥料選択が開く */
export function FeedAlert({ due, onPick }: Props) {
  if (due.length === 0) return null;
  return (
    <section style={{ ...styles.alertBox, borderColor: "rgba(61,220,151,.45)", borderLeftColor: "var(--mint)" }} aria-label="追肥アラート">
      <div style={styles.alertHead}>
        <Leaf size={20} color="var(--panel)" aria-hidden="true" />
        <span>追肥のタイミングです</span>
      </div>
      <div style={styles.alertChips}>
        {due.map((b) => (
          <button key={b.id} onClick={() => onPick(b.id)} style={{ ...styles.alertChip, background: "var(--panel-2)", color: "var(--text)" }}>
            <span>
              {soilType(b.type).emoji} {b.name}
            </span>
            <span style={{ ...styles.urgentTag, background: "var(--mint-bg)", color: "var(--mint)" }}>肥料を記録</span>
          </button>
        ))}
      </div>
    </section>
  );
}
