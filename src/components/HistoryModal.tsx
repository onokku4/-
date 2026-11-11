import type { HarvestRecord } from "../types";
import { styles } from "../styles";
import { Modal } from "./Modal";

export function HistoryModal({ log, onClose }: { log: HarvestRecord[]; onClose: () => void }) {
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
      )}
    </Modal>
  );
}
