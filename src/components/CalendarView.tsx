import { useState } from "react";
import { ChevronLeft, ChevronRight, CloudRain, Droplets, Leaf, RotateCcw, Sprout } from "lucide-react";
import type { GardenState } from "../types";
import { dayInfo, loggedDays, monthGrid, plantEmoji, shiftMonth } from "../lib/calendar";
import { stageLine } from "../lib/photos";
import { CONDITION_EMOJI, conditionInfo } from "../lib/weather";
import { styles } from "../styles";
import { DayModal } from "./DayModal";
import { PhotoThumb } from "./PhotoThumb";

interface Props {
  state: Pick<GardenState, "plants" | "beds" | "harvestLog" | "careLog" | "weatherLog" | "weather" | "photos">;
  today: string;
  onOpenPhoto: (id: string) => void;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const md = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;

/** カレンダー。写真がある日はマス全体が写真（Instagram のアーカイブ風）。日を押すと詳細 */
export function CalendarView({ state, today, onOpenPhoto }: Props) {
  const [ym, setYm] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  const [picked, setPicked] = useState<string>(today);
  const [open, setOpen] = useState<string | null>(null);
  const cells = monthGrid(ym.year, ym.month);
  const info = dayInfo(state, picked, today);
  const logged = loggedDays(state.weatherLog, today);
  const monthPhotos = state.photos.filter((p) => p.date.startsWith(`${ym.year}-${String(ym.month).padStart(2, "0")}`)).length;

  return (
    <section aria-label="カレンダー">
      <div style={styles.eyebrow}>Archive</div>
      <div style={styles.calHead}>
        <button style={styles.calNav} aria-label="前の月" onClick={() => setYm(shiftMonth(ym.year, ym.month, -1))}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span style={styles.calMonth}>
          {ym.year}年{ym.month}月
          {monthPhotos > 0 && <span style={{ ...styles.calNote, marginLeft: 8, fontFamily: "var(--mono)" }}>📷 {monthPhotos}</span>}
        </span>
        <button style={styles.calNav} aria-label="次の月" onClick={() => setYm(shiftMonth(ym.year, ym.month, 1))}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div style={styles.calNote}>
        {logged > 0 ? `天気を${logged}日ぶん記録中。` : "庭の位置を登録すると天気が記録されます。"}
        写真のある日はマスに表示。日を押すとその日の詳細。🌡️ は気温が合わなかった日。
      </div>

      <div style={styles.calGrid} role="grid" aria-label={`${ym.year}年${ym.month}月`}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ ...styles.calWeekday, color: i === 0 ? "var(--flame-soft)" : i === 6 ? "var(--sky)" : "var(--dim)" }} role="columnheader">
            {w}
          </div>
        ))}
        {cells.map((c) => {
          const d = dayInfo(state, c.date, today);
          const isToday = c.date === today;
          const active = c.date === picked;
          const photo = d.photos[0];
          const marks = [
            d.care.some((e) => e.kind === "water") ? "💧" : "",
            d.waterDue.length > 0 && c.date >= today ? "🚰" : "",
            d.care.some((e) => e.kind === "feed") ? "🌱" : "",
            d.harvests.length > 0 ? "🧺" : "",
            d.planted.length > 0 ? "🌰" : "",
            d.tempIssues.length > 0 ? "🌡️" : "",
          ].filter(Boolean);
          return (
            <button
              key={c.date}
              role="gridcell"
              aria-selected={active}
              aria-label={`${md(c.date)}${d.weather ? ` ${conditionInfo(d.weather.condition).label} ${d.weather.maxC}℃` : ""}${photo ? " 写真あり" : ""}`}
              onClick={() => {
                setPicked(c.date);
                setOpen(c.date);
              }}
              className={photo ? "cal-photo-cell" : undefined}
              style={{
                ...styles.calCell,
                opacity: c.inMonth ? 1 : 0.35,
                borderColor: active ? "var(--flame)" : isToday ? "var(--amber)" : "var(--line)",
                background: photo ? "#000" : active ? "var(--panel-2)" : d.forecast ? "transparent" : "var(--panel)",
              }}
            >
              {photo && (
                <>
                  <div style={styles.calPhotoBg}>
                    <PhotoThumb id={photo.id} alt="" style={{ width: "100%", height: "100%", borderRadius: 0, border: "none" }} />
                  </div>
                  <div style={{ ...styles.calPhotoShade, zIndex: 0 }} />
                </>
              )}
              <div style={styles.calCellInner}>
                <span style={{ ...styles.calDay, color: isToday ? "var(--amber)" : photo ? "#fff" : "var(--text)" }}>{c.day}</span>
                {!photo && (
                  <>
                    <span style={styles.calWx} aria-hidden="true">
                      {d.weather ? CONDITION_EMOJI[d.weather.condition] : ""}
                    </span>
                    <span style={styles.calTemp}>{d.weather ? `${d.weather.maxC}°` : ""}</span>
                  </>
                )}
                <span style={{ ...styles.calMarks, marginTop: "auto", color: "#fff" }} aria-hidden="true">
                  {photo && d.photos.length > 1 ? `📷${d.photos.length}` : ""}
                  {marks.join("")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={styles.calDetail}>
        <div style={styles.calDetailHead}>
          {md(picked)}
          {picked === today && "（今日）"}
          {info.forecast && <span style={styles.calForecastTag}>予報</span>}
        </div>
        {info.weather ? (
          <div style={styles.calDetailRow}>
            <span aria-hidden="true">{CONDITION_EMOJI[info.weather.condition]}</span>
            {conditionInfo(info.weather.condition).label}　最高 {info.weather.maxC}℃ ／ 最低 {info.weather.minC}℃
            {info.weather.rainMm > 0 && (
              <>
                　<CloudRain size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> {info.weather.rainMm}mm
              </>
            )}
            {info.weather.source === "manual" && <span style={styles.calManualTag}>手入力</span>}
          </div>
        ) : (
          <div style={{ ...styles.calDetailRow, color: "var(--dim)" }}>この日の天気の記録はありません</div>
        )}
        {info.photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {info.photos.map((p) => (
              <div key={p.id} style={{ flex: "0 0 auto", width: 120 }}>
                <PhotoThumb id={p.id} alt={stageLine(p.stages)} style={{ width: 120, height: 120 }} onClick={() => onOpenPhoto(p.id)} />
                <div style={{ ...styles.albumCap, marginTop: 3 }}>
                  <div style={styles.albumDate}>{state.beds.find((b) => b.id === p.bedId)?.name ?? "（削除された場所）"}</div>
                  <div style={styles.albumStage}>{p.stages.length ? p.stages.map((s) => `${s.day}日目`).join("・") : "植え付け前"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {info.tempIssues.length > 0 && (
          <div style={styles.calDetailRow}>
            <span aria-hidden="true">🌡️</span>
            {info.tempIssues.map((t) => `${t.plant.projectName}：${t.verdict.label}`).join("、")}
          </div>
        )}
        {info.waterDue.length > 0 && (
          <div style={styles.calDetailRow}>
            <Droplets size={14} color="var(--sky)" aria-hidden="true" />
            水やり{info.forecast ? "予定" : ""}：{info.waterDue.map((p) => `${plantEmoji(p)} ${p.projectName}`).join("、")}
          </div>
        )}
        {info.care.map((e) => (
          <div key={`${e.kind}-${e.label}`} style={styles.calDetailRow}>
            {e.kind === "water" && <Droplets size={14} color="var(--sky)" aria-hidden="true" />}
            {e.kind === "feed" && <Leaf size={14} color="var(--mint)" aria-hidden="true" />}
            {e.kind === "refresh" && <RotateCcw size={14} color="var(--muted)" aria-hidden="true" />}
            {e.kind === "water" ? "水やり" : e.kind === "feed" ? "追肥" : "土替え"}：{e.label}
          </div>
        ))}
        {info.harvests.map((h) => (
          <div key={h.id} style={styles.calDetailRow}>
            <span aria-hidden="true">🧺</span> 収穫：{h.projectName || h.cropName}
          </div>
        ))}
        {info.planted.map((p) => (
          <div key={p.uid} style={styles.calDetailRow}>
            <Sprout size={14} color="var(--mint)" aria-hidden="true" /> 植え付け：{plantEmoji(p)} {p.projectName}
          </div>
        ))}
      </div>
      {open && <DayModal state={state} date={open} today={today} onOpenPhoto={onOpenPhoto} onClose={() => setOpen(null)} />}
    </section>
  );
}
