import { Thermometer } from "lucide-react";
import { styles } from "../styles";
import type { PlantView } from "./plantView";

/** 今の気温が合わない株。暑すぎ・寒すぎを分けて、対処をひとこと */
export function TempAlert({ views, tempC }: { views: PlantView[]; tempC: number }) {
  const hot = views.filter((v) => v.status.temp.kind === "hot");
  const cold = views.filter((v) => v.status.temp.kind === "cold");
  if (hot.length === 0 && cold.length === 0) return null;
  const Group = ({ list, title, advice }: { list: PlantView[]; title: string; advice: string }) =>
    list.length === 0 ? null : (
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>
          {title}：{list.map((v) => `${v.status.crop.emoji} ${v.plant.projectName}（適温 ${v.status.temp.range.min}〜${v.status.temp.range.max}℃）`).join("、")}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{advice}</div>
      </div>
    );
  return (
    <section style={{ ...styles.alertBox, borderColor: "rgba(201,139,58,.45)", borderLeftColor: "var(--amber)" }} aria-label="気温チェック">
      <div style={styles.alertHead}>
        <Thermometer size={18} color="var(--amber)" aria-hidden="true" />
        <span>今日は {tempC}℃。気温が合わない株があります</span>
      </div>
      <Group list={hot} title="暑すぎ" advice={hot[0]?.status.temp.advice ?? ""} />
      <Group list={cold} title="寒い" advice={cold[0]?.status.temp.advice ?? ""} />
    </section>
  );
}
