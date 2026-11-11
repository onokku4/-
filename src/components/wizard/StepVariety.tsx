import { defaultProjectName } from "../../data/catalog";
import { useMemo, useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import type { Crop, PlantRef, Plant } from "../../types";
import { diagnose, VERDICT_STYLE } from "../../lib/pollination";
import { formatDays } from "../../ui/format";
import { styles } from "../../styles";

export interface PlantDraft {
  varietyId: string;
  projectName: string;
  plantedDate: string;
}

interface Props {
  crop: Crop;
  plants: Plant[];
  today: string;
  initialVarietyId: string;
  onSubmit: (draft: PlantDraft) => void;
  onBack: () => void;
}

export function StepVariety({ crop, plants, today, initialVarietyId, onSubmit, onBack }: Props) {
  const [varietyId, setVarietyId] = useState(initialVarietyId);
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState(today);
  const variety = crop.varieties.find((v) => v.id === varietyId);

  // 「今の庭にこの品種を植えたら」の受粉診断を品種ごとに1回だけ計算する
  const diagnoses = useMemo(
    () =>
      new Map(
        crop.varieties.map((v) => {
          const ref: PlantRef = { cropId: crop.id, varietyId: v.id };
          return [v.id, diagnose(ref, plants)] as const;
        }),
      ),
    [crop, plants],
  );
  const valid = variety !== undefined && date !== "" && date <= today;

  return (
    <div>
      <div style={styles.cropHeadRow}>
        <span style={{ fontSize: 32 }} aria-hidden="true">
          {crop.emoji}
        </span>
        <div>
          <div style={styles.cropHeadName}>{crop.name}</div>
          <div style={styles.cropOptSeason}>
            {crop.category}・{crop.season}
          </div>
        </div>
      </div>

      <div style={styles.varLabel} id="variety-label">
        品種を選ぶ
      </div>
      <div style={styles.varList} role="radiogroup" aria-labelledby="variety-label">
        {crop.varieties.map((v) => {
          const active = v.id === varietyId;
          const d = diagnoses.get(v.id);
          const vs = d && d.verdict !== "na" ? VERDICT_STYLE[d.verdict] : undefined;
          return (
            <button
              key={v.id}
              role="radio"
              aria-checked={active}
              onClick={() => setVarietyId(v.id)}
              style={{
                ...styles.varCard,
                borderColor: active ? "#6b9d4f" : "#e3ddcf",
                background: active ? "#eef4e6" : "#fff",
              }}
            >
              <span style={styles.varTop}>
                <span style={styles.varName}>{v.name}</span>
                <span style={styles.varDays}>{formatDays(v, crop.perennial === true)}</span>
              </span>
              {d && vs && (
                <span style={{ ...styles.diagLine, color: vs.color }}>
                  <span role="img" aria-label={vs.label}>
                    {vs.mark}
                  </span>
                  <span>{d.headline}</span>
                </span>
              )}
              {active && (
                <span style={styles.varTip}>
                  <span style={{ display: "block" }}>💡 {v.tip}</span>
                  {d && vs && (
                    <span style={{ ...styles.diagDetail, color: vs.color }}>
                      {d.detail}
                      {d.suggestions.length > 0 && (
                        <>
                          <br />
                          相性の良い品種：{d.suggestions.join("・")}
                        </>
                      )}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <label style={styles.dateLabel}>
        プロジェクト名（省略可）
        <input
          type="text"
          value={projectName}
          placeholder={variety ? defaultProjectName(crop, variety) : crop.name}
          onChange={(e) => setProjectName(e.target.value)}
          style={styles.dateInput}
        />
      </label>

      <label style={{ ...styles.dateLabel, marginTop: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={15} aria-hidden="true" /> 種まき・植え付け日
        </span>
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} />
      </label>

      <button
        style={{ ...styles.confirmBtn, opacity: valid ? 1 : 0.5 }}
        disabled={!valid}
        onClick={() => onSubmit({ varietyId, projectName, plantedDate: date })}
      >
        このプロジェクトを始める <ChevronRight size={18} aria-hidden="true" />
      </button>
      <button style={styles.backBtn} onClick={onBack}>
        ← 作物を選び直す
      </button>
    </div>
  );
}
