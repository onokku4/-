import { styles } from "../styles";
import type { PlantView } from "./plantView";

/** 受粉に手助けが要る株（ng / action）だけを集めて知らせる */
export function PollinationAlert({ views }: { views: PlantView[] }) {
  const needy = views.filter((v) => v.diagnosis?.verdict === "ng" || v.diagnosis?.verdict === "action");
  if (needy.length === 0) return null;
  return (
    <section style={styles.pollAlert} aria-label="受粉チェック">
      <div style={styles.pollAlertHead}>
        <span aria-hidden="true">🐝</span> 受粉チェック
      </div>
      <ul style={styles.pollAlertList}>
        {needy.map(({ plant, diagnosis }) => (
          <li key={plant.uid} style={styles.pollAlertItem}>
            <b>
              {plant.projectName}：{diagnosis?.headline}
            </b>
            {diagnosis?.suggestions.slice(0, 2).map((s) => (
              <p key={s} style={styles.pollAlertSuggest}>
                ・{s} を加えると解決
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
