import { useState } from "react";
import { BookOpen, Check, Droplets, Pencil, Star, Sun, Thermometer, Trash2, X } from "lucide-react";
import type { Bed } from "../types";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { canGrowIn, soilType } from "../data/catalog";
import { formatMonths } from "../ui/format";
import { newId } from "../ui/id";
import { styles } from "../styles";
import { GuideModal } from "./GuideModal";
import { PollinationBadge } from "./PollinationBadge";
import type { PlantView } from "./plantView";

interface Props {
  view: PlantView;
  /** 移動先の候補（省略時は移動できない） */
  beds?: Bed[];
  dispatch: (a: Action) => void;
}

export function PlantCard({ view, beds, dispatch }: Props) {
  const { plant, bed, status, diagnosis } = view;
  const { crop, variety, due, urgent, interval, daysSinceWater, growthPct, byRain, temp } = status;
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [editing, setEditing] = useState(false);
  const [guide, setGuide] = useState(false);
  const [draft, setDraft] = useState({ name: plant.projectName, date: plant.plantedDate, bedId: plant.bedId });
  const startEdit = () => {
    setDraft({ name: plant.projectName, date: plant.plantedDate, bedId: plant.bedId });
    setEditing(true);
  };
  const saveEdit = () => {
    dispatch({ type: "editPlant", uid: plant.uid, projectName: draft.name, plantedDate: draft.date, bedId: draft.bedId });
    setEditing(false);
  };
  const soil = bed ? soilType(bed.type) : undefined;
  const perennial = crop.perennial === true;

  return (
    <article style={{ ...styles.card, borderColor: urgent ? "var(--flame)" : due ? "var(--amber)" : "var(--line)" }}>
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
        <button style={styles.editBtn} aria-label={`${crop.name}の育て方`} title="育て方・道具・病害虫" onClick={() => setGuide(true)}>
          <BookOpen size={14} aria-hidden="true" />
        </button>
        <button style={styles.editBtn} aria-label={`${plant.projectName}を編集`} title="名前・植え付け日・場所を編集" onClick={startEdit}>
          <Pencil size={14} aria-hidden="true" />
        </button>
        <button
          style={styles.iconBtn}
          title={perennial ? "収穫を記録" : "収穫する"}
          aria-label={perennial ? `${plant.projectName}の収穫を記録` : `${plant.projectName}を収穫する`}
          onClick={() => dispatch({ type: "harvest", uid: plant.uid, recordId: newId(), today: localDate() })}
        >
          <span aria-hidden="true">🧺</span>
        </button>
      </div>

      {editing && (
        <div style={styles.editBox} role="group" aria-label="株の編集">
          <label style={styles.editField}>
            名前
            <input style={styles.editInput} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="株の名前" />
          </label>
          <label style={styles.editField}>
            植え付け日
            <input type="date" style={styles.editInput} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} aria-label="植え付け日" />
          </label>
          {beds && beds.length > 1 && (
            <label style={styles.editField}>
              場所
              <select style={styles.editInput} value={draft.bedId} onChange={(e) => setDraft({ ...draft, bedId: e.target.value })} aria-label="場所">
                {beds.map((b) => (
                  <option key={b.id} value={b.id} disabled={!canGrowIn(crop, b.type)}>
                    {soilType(b.type).emoji} {b.name}
                    {!canGrowIn(crop, b.type) ? "（育てられない）" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={styles.histBtn} onClick={() => setEditing(false)}>
              <X size={14} aria-hidden="true" /> やめる
            </button>
            <button style={styles.addBtn} onClick={saveEdit}>
              <Check size={14} aria-hidden="true" /> 保存
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            ...styles.tempChip,
            background: temp.kind === "ok" ? "var(--mint-bg)" : temp.kind === "hot" ? "var(--flame-bg)" : "var(--sky-bg)",
            color: temp.kind === "ok" ? "var(--mint)" : temp.kind === "hot" ? "var(--flame)" : "var(--sky)",
          }}
          title={`適温 ${temp.range.min}〜${temp.range.max}℃`}
        >
          <Thermometer size={11} aria-hidden="true" /> {temp.label}
          <span style={{ opacity: 0.7, fontWeight: 400 }}>（適温 {temp.range.min}〜{temp.range.max}℃）</span>
        </span>
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
          background: urgent ? "var(--flame-bg)" : due ? "var(--amber-bg)" : "var(--mint-bg)",
          color: urgent ? "var(--flame)" : due ? "var(--amber)" : "var(--mint)",
        }}
      >
        <Droplets size={15} aria-hidden="true" />
        {due
          ? urgent
            ? `${daysSinceWater}日 水やりなし — 急いで！`
            : "そろそろ水やりを"
          : `あと約${interval - daysSinceWater}日でOK${byRain ? "（雨で水やり済み扱い）" : ""}`}
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

      {guide && <GuideModal crop={crop} onClose={() => setGuide(false)} />}
      <div style={styles.tip}>
        <Star size={13} color="var(--amber)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <b style={{ color: "var(--muted)" }}>{variety.name}：</b>
          {variety.tip}
        </span>
      </div>
    </article>
  );
}
