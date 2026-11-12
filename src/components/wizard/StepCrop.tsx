import { useState } from "react";
import type { Bed, Category, Crop, GardenState } from "../../types";
import { CATEGORIES, CROPS, canGrowIn, soilType } from "../../data/catalog";
import { rotationWarning } from "../../lib/rotation";
import { REGION_LABEL, inSeason, monthsLabel, plantMonthsFor, regionOf } from "../../lib/season";
import { styles } from "../../styles";

type Filter = Category | "all";

interface Props {
  bed: Bed | undefined;
  state: Pick<GardenState, "harvestLog" | "plants" | "careLog" | "location">;
  today: string;
  onPick: (crop: Crop) => void;
  onBack: () => void;
}

export function StepCrop({ bed, state, today, onPick, onBack }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const region = regionOf(state.location);
  const month = Number(today.slice(5, 7));
  const warn = (c: Crop) =>
    bed ? rotationWarning({ bedId: bed.id, bedName: bed.name, bedType: bed.type, cropId: c.id, harvestLog: state.harvestLog, plants: state.plants, careLog: state.careLog, today }) : null;
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

      <div style={{ ...styles.calNote, marginBottom: 8 }}>
        {month}月に植えられるものに「適期」、同じ場所で同じ科を続けると「連作注意」が付きます（{REGION_LABEL[region]}の目安）。
      </div>
      <div style={styles.cropPicker}>
        {crops.map((c) => {
          const season = inSeason(c.id, month, region);
          const w = warn(c);
          return (
            <button key={c.id} onClick={() => onPick(c)} style={{ ...styles.cropOption, borderColor: w ? "var(--amber)" : season ? "var(--mint)" : "var(--line)" }} title={w?.message}>
              <span style={{ fontSize: 28 }} aria-hidden="true">
                {c.emoji}
              </span>
              <span style={styles.cropOptName}>{c.name}</span>
              <span style={styles.cropOptSeason}>
                {c.category}・{monthsLabel(plantMonthsFor(c.id, region))}
              </span>
              <span style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                {season && <span style={{ ...styles.pill, background: "var(--mint-bg)", color: "var(--mint)" }}>適期</span>}
                {w && <span style={{ ...styles.pill, background: "var(--amber-bg)", color: "var(--amber)" }}>連作注意</span>}
              </span>
            </button>
          );
        })}
      </div>

      <button style={styles.backBtn} onClick={onBack}>
        ← 土を選び直す
      </button>
    </div>
  );
}
