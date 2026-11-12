import { useState } from "react";
import type { Bed, Category, Crop } from "../../types";
import { CATEGORIES, CROPS, canGrowIn, soilType } from "../../data/catalog";
import { styles } from "../../styles";

type Filter = Category | "all";

interface Props {
  bed: Bed | undefined;
  onPick: (crop: Crop) => void;
  onBack: () => void;
}

export function StepCrop({ bed, onPick, onBack }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const crops = CROPS.filter(
    (c) => (filter === "all" || c.category === filter) && (!bed || canGrowIn(c, bed.type)),
  );
  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "すべて" },
    ...CATEGORIES.map((c) => ({ id: c, label: c })),
  ];

  return (
    <div>
      <div style={styles.stepHint}>
        {bed && (
          <span>
            {soilType(bed.type).emoji} {bed.name} に植える作物を選びます
          </span>
        )}
      </div>

      <div style={styles.catRow} role="group" aria-label="作物の種類で絞り込み">
        {chips.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              aria-pressed={active}
              onClick={() => setFilter(c.id)}
              style={{
                ...styles.catChip,
                background: active ? "var(--text)" : "var(--panel)",
                color: active ? "var(--panel)" : "var(--muted)",
                borderColor: active ? "var(--text)" : "var(--line)",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div style={styles.cropPicker}>
        {crops.map((c) => (
          <button key={c.id} onClick={() => onPick(c)} style={styles.cropOption}>
            <span style={{ fontSize: 28 }} aria-hidden="true">
              {c.emoji}
            </span>
            <span style={styles.cropOptName}>{c.name}</span>
            <span style={styles.cropOptSeason}>
              {c.category}・{c.varieties.length}品種
            </span>
          </button>
        ))}
      </div>

      <button style={styles.backBtn} onClick={onBack}>
        ← 土を選び直す
      </button>
    </div>
  );
}
