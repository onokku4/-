import { Check, ChevronRight, Plus } from "lucide-react";
import type { Bed, SoilTypeId } from "../../types";
import { SOIL_TYPES, soilType } from "../../data/catalog";
import { SOIL_MIXES, findSoilMix } from "../../data/soils";
import { soilHealth } from "../../lib/soil";
import { styles } from "../../styles";

interface Props {
  beds: Bed[];
  bedId: string | null;
  newType: SoilTypeId;
  newMix: string;
  onPick: (id: string) => void;
  onPickType: (t: SoilTypeId) => void;
  onPickMix: (id: string) => void;
  onAddBed: (t: SoilTypeId) => void;
  onNext: () => void;
}

export function StepBed({ beds, bedId, newType, newMix, onPick, onPickType, onPickMix, onAddBed, onNext }: Props) {
  const mixes = SOIL_MIXES.filter((m) => !m.fieldOnly || newType === "field");
  const mix = findSoilMix(newMix);
  return (
    <div>
      <div style={styles.stepHint}>育てる場所（土）を選びます</div>

      <div style={styles.bedList} role="radiogroup" aria-label="育てる場所">
        {beds.map((b) => {
          const st = soilType(b.type);
          const active = b.id === bedId;
          const h = soilHealth(b);
          return (
            <button
              key={b.id}
              role="radio"
              aria-checked={active}
              onClick={() => onPick(b.id)}
              style={{
                ...styles.bedRowPick,
                borderColor: active ? "var(--mint)" : "var(--line)",
                background: active ? "var(--mint-bg)" : "var(--panel)",
              }}
            >
              <span style={{ fontSize: 26 }} aria-hidden="true">
                {st.emoji}
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>
                <span style={{ ...styles.bedPickName, display: "block" }}>{b.name}</span>
                <span style={{ ...styles.bedPickHealth, display: "block" }}>
                  {st.label}
                  {st.hasNutrient ? ` ・ ${h.label}・連用${b.uses}回` : " ・ 培養液栽培"}
                  {findSoilMix(b.soilMix) && ` ・ ${findSoilMix(b.soilMix)?.name.replace(/（.*）/, "")}`}
                </span>
              </span>
              {active && <Check size={18} color="var(--mint)" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div style={styles.newBedBox}>
        <div style={styles.newBedTitle}>＋ 新しい場所を追加</div>
        <div style={styles.soilTypeRow} role="radiogroup" aria-label="場所の種類">
          {SOIL_TYPES.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={newType === s.id}
              onClick={() => onPickType(s.id)}
              style={{
                ...styles.soilTypeBtn,
                borderColor: newType === s.id ? "var(--mint)" : "var(--line)",
                background: newType === s.id ? "var(--mint-bg)" : "var(--panel)",
              }}
            >
              <span style={{ fontSize: 22 }} aria-hidden="true">
                {s.emoji}
              </span>
              <span style={styles.soilTypeLabel}>{s.label}</span>
            </button>
          ))}
        </div>
        <p style={styles.soilTypeDesc}>{soilType(newType).desc}</p>
        {newType !== "hydro" && (
          <label style={styles.mixField}>
            <span style={styles.mixLabel}>使う土（市販の培養土など）</span>
            <select style={styles.mixSelect} value={newMix} onChange={(e) => onPickMix(e.target.value)}>
              {mixes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {mix && <span style={styles.soilTypeDesc}>{mix.desc}</span>}
          </label>
        )}
        <button style={styles.addBedConfirm} onClick={() => onAddBed(newType)}>
          <Plus size={15} aria-hidden="true" /> この種類の場所を追加
        </button>
      </div>

      <button style={{ ...styles.confirmBtn, opacity: bedId ? 1 : 0.5 }} onClick={onNext} disabled={!bedId}>
        次へ：作物を選ぶ <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
