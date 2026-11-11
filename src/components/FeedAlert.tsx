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
    <section style={{ ...styles.alertBox, background: "linear-gradient(135deg,#6b9d4f,#4f7d3a)", boxShadow: "0 8px 22px rgba(80,120,60,.3)" }} aria-label="追肥アラート">
      <div style={styles.alertHead}>
        <Leaf size={20} color="#fff" aria-hidden="true" />
        <span>追肥のタイミングです</span>
      </div>
      <div style={styles.alertChips}>
        {due.map((b) => (
          <button key={b.id} onClick={() => onPick(b.id)} style={{ ...styles.alertChip, background: "#fff", color: "#3d5236" }}>
            <span>
              {soilType(b.type).emoji} {b.name}
            </span>
            <span style={{ ...styles.urgentTag, background: "#eef4e6", color: "#4f7d3a" }}>肥料を記録</span>
          </button>
        ))}
      </div>
    </section>
  );
}
