import type { HarvestRecord } from "../types";
import { harvestSummary } from "../lib/harvest";
import { styles } from "../styles";
import { Modal } from "./Modal";

export function HistoryModal({ log, onClose }: { log: HarvestRecord[]; onClose: () => void }) {
  const summary = harvestSummary(log);
  const max = Math.max(1, ...summary.map((s) => s.times));
  return (
    <Modal title="🧺 収穫の記録" onClose={onClose}>
      {log.length === 0 ? (
        <div style={styles.histEmpty}>
          <div style={{ fontSize: 40, marginBottom: 8 }} aria-hidden="true">
            🌾
          </div>
          まだ収穫の記録はありません。
          <br />
          作物を育てて収穫しましょう。
        </div>
      ) : (
        <>
          <div style={styles.eyebrow}>作物ごとの合計</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }} role="list" aria-label="作物ごとの収穫量">
            {summary.map((s) => (
              <div key={s.cropId} role="listitem" style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span aria-hidden="true" style={{ fontSize: 18 }}>
                  {s.emoji}
                </span>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>{s.cropName}</span>
                    <span style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 11.5 }}>
                      {s.times}回{s.count > 0 && `・${s.count}個`}
                      {s.grams > 0 && `・${s.grams >= 1000 ? `${(s.grams / 1000).toFixed(1)}kg` : `${s.grams}g`}`}
                    </span>
                  </div>
                  <div style={styles.growTrack} aria-hidden="true">
                    <div style={{ ...styles.growFill, width: `${(s.times / max) * 100}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 10.5, color: "var(--dim)", whiteSpace: "nowrap" }}>{s.years.join("・")}</span>
              </div>
            ))}
          </div>
          <div style={styles.eyebrow}>履歴</div>
          <ul style={{ ...styles.histList, listStyle: "none", margin: 0, padding: 0 }}>
            {log.map((h) => (
              <li key={h.id} style={styles.histItem}>
                <span style={styles.histEmoji} aria-hidden="true">
                  {h.emoji}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.histName}>{h.projectName || h.cropName}</div>
                  <div style={styles.histMeta}>
                    {h.cropName}
                    {h.varietyName ? `・${h.varietyName}` : ""}
                    {h.count !== null && `・${h.count}個`}
                    {h.grams !== null && `・${h.grams}g`}
                  </div>
                  <div style={styles.histMeta}>
                    {h.soilLabel ? `${h.soilLabel}・` : ""}
                    {h.bedName}・{h.days}日で収穫
                  </div>
                </div>
                <div style={styles.histDate}>{h.harvestDate.slice(5)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
