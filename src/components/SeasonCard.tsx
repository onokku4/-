import { useState } from "react";
import { CalendarCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { GardenLocation } from "../types";
import { REGION_LABEL, cropsForMonth, regionOf } from "../lib/season";
import { styles } from "../styles";

/** 今月植えられる作物。地域は登録した庭の位置から */
export function SeasonCard({ location, today, onPick }: { location: GardenLocation | null; today: string; onPick: () => void }) {
  const [open, setOpen] = useState(false);
  const region = regionOf(location);
  const month = Number(today.slice(5, 7));
  const crops = cropsForMonth(month, region);
  if (crops.length === 0) return null;
  const shown = open ? crops : crops.slice(0, 6);
  return (
    <section style={{ ...styles.notifyCard, display: "block", marginBottom: 14 }} aria-label="今月の適期">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={styles.notifyLeft}>
          <CalendarCheck size={20} color="var(--mint)" aria-hidden="true" />
          <div>
            <div style={styles.notifyTitle}>{month}月に植えられるもの</div>
            <div style={styles.notifySub}>
              {REGION_LABEL[region]}の目安・{crops.length}種類{!location && "（庭の位置を登録すると地域に合わせます）"}
            </div>
          </div>
        </div>
        {crops.length > 6 && (
          <button style={styles.histBtn} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />} {open ? "閉じる" : "すべて"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {shown.map((c) => (
          <button key={c.id} style={styles.histBtn} onClick={onPick}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
    </section>
  );
}
