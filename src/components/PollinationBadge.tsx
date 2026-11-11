import { useId, useState } from "react";
import { VERDICT_STYLE, type Diagnosis } from "../lib/pollination";
import { styles } from "../styles";

/** 受粉診断の見出し。クリックで詳細・受粉相手・おすすめ品種を開閉する */
export function PollinationBadge({ diagnosis }: { diagnosis: Diagnosis | undefined }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  if (!diagnosis || diagnosis.verdict === "na") return null;
  const v = VERDICT_STYLE[diagnosis.verdict];
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        style={{ ...styles.pollBtn, background: v.bg, color: v.color, borderColor: v.color + "44" }}
      >
        <span style={styles.pollMark} role="img" aria-label={v.label}>
          {v.mark}
        </span>
        <span>{diagnosis.headline}</span>
      </button>
      <div id={bodyId} hidden={!open}>
        {open && (
          <div style={{ ...styles.pollBody, color: v.color }}>
            <p style={{ margin: 0 }}>{diagnosis.detail}</p>
            {diagnosis.partners.length > 0 && <p style={{ margin: "4px 0 0" }}>受粉相手：{diagnosis.partners.join("・")}</p>}
            {diagnosis.suggestions.length > 0 && (
              <p style={{ margin: "4px 0 0" }}>相性の良い品種：{diagnosis.suggestions.join("・")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
