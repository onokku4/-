import { useState } from "react";
import { Droplets, Star, Sun, Trash2 } from "lucide-react";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { soilType } from "../data/catalog";
import { formatMonths } from "../ui/format";
import { newId } from "../ui/id";
import { styles } from "../styles";
import { PollinationBadge } from "./PollinationBadge";
import type { PlantView } from "./plantView";

interface Props {
  view: PlantView;
  dispatch: (a: Action) => void;
}

export function PlantCard({ view, dispatch }: Props) {
  const { plant, bed, status, diagnosis } = view;
  const { crop, variety, due, urgent, interval, daysSinceWater, growthPct } = status;
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const soil = bed ? soilType(bed.type) : undefined;
  const perennial = crop.perennial === true;

  return (
    <article style={{ ...styles.card, borderColor: urgent ? "#c0432a" : due ? "#d8a93f" : "#e3ddcf" }}>
      <div style={styles.cardTop}>
        <div style={styles.cropEmoji} aria-hidden="true">
          {crop.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={styles.cropName}>{plant.projectName}</h3>
          <div style={styles.tagRow}>
            <span style={styles.catTag}>{crop.category}</span>
            <span style={styles.varTagSm}>
              {crop.name}・{variety.name}
            </span>
          </div>
          <div style={styles.cropMeta}>
            <Sun size={12} aria-hidden="true" /> {crop.sun}
            {bed && soil && (
              <span style={styles.bedTag}>
                {soil.emoji} {bed.name}
              </span>
            )}
          </div>
        </div>
        <button
          style={styles.iconBtn}
          title={perennial ? "収穫を記録" : "収穫する"}
          aria-label={perennial ? `${plant.projectName}の収穫を記録` : `${plant.projectName}を収穫する`}
          onClick={() => dispatch({ type: "harvest", uid: plant.uid, recordId: newId(), today: localDate() })}
        >
          <span aria-hidden="true">🧺</span>
        </button>
      </div>

      {growthPct !== null ? (
        <div style={styles.growRow}>
          <span style={styles.growLabel}>成長</span>
          <div
            style={styles.growTrack}
            role="progressbar"
            aria-label="成長"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={growthPct}
          >
            <div style={{ ...styles.growFill, width: `${growthPct}%` }} />
          </div>
          <span style={styles.growPct}>{growthPct}%</span>
        </div>
      ) : (
        <div style={styles.perennialRow}>
          <span>
            植えて{status.ageDays}日目・収穫期 {formatMonths(crop.harvestMonths)}
          </span>
          {status.inSeason && <span style={styles.seasonTag}>収穫期</span>}
          {plant.harvestCount > 0 && <span style={styles.harvestTag}>収穫{plant.harvestCount}回</span>}
        </div>
      )}

      {status.frostRisk && crop.coldTenderBelowC !== undefined && (
        <div style={styles.frostWarn}>
          🧣 冷え込み注意：{crop.coldTenderBelowC}℃を下回っています。軒下や室内へ
        </div>
      )}

      <PollinationBadge diagnosis={diagnosis} />

      <div
        style={{
          ...styles.waterStatus,
          background: urgent ? "#fbe9e4" : due ? "#fdf4e0" : "#eef4e6",
          color: urgent ? "#9c2e1a" : due ? "#8a6315" : "#4a6b3a",
        }}
      >
        <Droplets size={15} aria-hidden="true" />
        {due
          ? urgent
            ? `${daysSinceWater}日 水やりなし — 急いで！`
            : "そろそろ水やりを"
          : `あと約${interval - daysSinceWater}日でOK`}
      </div>

      <div style={styles.cardActions}>
        {due && (
          <button style={styles.waterBtn} onClick={() => dispatch({ type: "water", uid: plant.uid, today: localDate() })}>
            <Droplets size={16} aria-hidden="true" /> 水やりする
          </button>
        )}
        <button
          style={{ ...styles.removeBtn, ...(confirmingRemove ? styles.removeBtnConfirm : {}) }}
          aria-label={confirmingRemove ? "本当に片付ける？" : `${plant.projectName}を片付ける`}
          onBlur={() => setConfirmingRemove(false)}
          onClick={() => {
            if (confirmingRemove) dispatch({ type: "remove", uid: plant.uid });
            else setConfirmingRemove(true);
          }}
        >
          <Trash2 size={15} aria-hidden="true" />
          {confirmingRemove && "本当に片付ける？"}
        </button>
      </div>

      <div style={styles.tip}>
        <Star size={13} color="#c98b3a" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <b style={{ color: "#8a6a3a" }}>{variety.name}：</b>
          {variety.tip}
        </span>
      </div>
    </article>
  );
}
