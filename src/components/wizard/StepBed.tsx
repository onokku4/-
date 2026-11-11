import { Check, ChevronRight, Plus } from "lucide-react";
import type { Bed, SoilTypeId } from "../../types";
import { SOIL_TYPES, soilType } from "../../data/catalog";
import { soilHealth } from "../../lib/soil";
import { styles } from "../../styles";

interface Props {
  beds: Bed[];
  bedId: string | null;
  newType: SoilTypeId;
  onPick: (id: string) => void;
  onPickType: (t: SoilTypeId) => void;
  onAddBed: (t: SoilTypeId) => void;
  onNext: () => void;
}

export function StepBed({ beds, bedId, newType, onPick, onPickType, onAddBed, onNext }: Props) {
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
                borderColor: active ? "#6b9d4f" : "#e3ddcf",
                background: active ? "#eef4e6" : "#fff",
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
                </span>
              </span>
              {active && <Check size={18} color="#6b9d4f" aria-hidden="true" />}
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
                borderColor: newType === s.id ? "#6b9d4f" : "#e3ddcf",
                background: newType === s.id ? "#eef4e6" : "#fff",
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
