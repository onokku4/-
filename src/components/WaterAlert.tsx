import { Droplets } from "lucide-react";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { styles } from "../styles";
import type { PlantView } from "./plantView";

interface Props {
  due: PlantView[];
  weatherLabel: string;
  dispatch: (a: Action) => void;
}

export function WaterAlert({ due, weatherLabel, dispatch }: Props) {
  if (due.length === 0) return null;
  return (
    <section style={styles.alertBox} aria-label="水やりアラート">
      <div style={styles.alertHead}>
        <Droplets size={20} color="var(--panel)" aria-hidden="true" />
        <span>水やりのタイミングです（{weatherLabel}補正済み）</span>
      </div>
      <div style={styles.alertChips}>
        {due.map(({ plant, status }) => (
          <button
            key={plant.uid}
            onClick={() => dispatch({ type: "water", uid: plant.uid, today: localDate() })}
            style={{
              ...styles.alertChip,
              background: status.urgent ? "var(--flame)" : "var(--panel-2)",
              color: status.urgent ? "var(--panel)" : "var(--text)",
            }}
          >
            <span>
              {status.crop.emoji} {status.crop.name}
            </span>
            {status.urgent && <span style={styles.urgentTag}>急ぎ</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
