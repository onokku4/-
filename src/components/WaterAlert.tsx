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
        <Droplets size={20} color="#fff" aria-hidden="true" />
        <span>水やりのタイミングです（{weatherLabel}補正済み）</span>
      </div>
      <div style={styles.alertChips}>
        {due.map(({ plant, status }) => (
          <button
            key={plant.uid}
            onClick={() => dispatch({ type: "water", uid: plant.uid, today: localDate() })}
            style={{
              ...styles.alertChip,
              background: status.urgent ? "#c0432a" : "#fff",
              color: status.urgent ? "#fff" : "#3d5236",
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
