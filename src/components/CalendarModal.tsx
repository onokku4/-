import { useState } from "react";
import { ChevronLeft, ChevronRight, CloudRain, Droplets, Leaf, RotateCcw, Sprout } from "lucide-react";
import type { GardenState } from "../types";
import { dayInfo, loggedDays, monthGrid, plantEmoji, shiftMonth } from "../lib/calendar";
import { CONDITION_EMOJI, conditionInfo } from "../lib/weather";
import { styles } from "../styles";
import { Modal } from "./Modal";

interface Props {
  state: Pick<GardenState, "plants" | "beds" | "harvestLog" | "careLog" | "weatherLog" | "weather">;
  today: string;
  onClose: () => void;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const md = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;

export function CalendarModal({ state, today, onClose }: Props) {
  const [ym, setYm] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  const [picked, setPicked] = useState<string>(today);
  const cells = monthGrid(ym.year, ym.month);
  const info = dayInfo(state, picked, today);
  const logged = loggedDays(state.weatherLog, today);

  return (
    <Modal title="📅 カレンダー" onClose={onClose}>
      <div style={styles.calHead}>
        <button style={styles.calNav} aria-label="前の月" onClick={() => setYm(shiftMonth(ym.year, ym.month, -1))}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span style={styles.calMonth}>
          {ym.year}年{ym.month}月
        </span>
        <button style={styles.calNav} aria-label="次の月" onClick={() => setYm(shiftMonth(ym.year, ym.month, 1))}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div style={styles.calNote}>
        {logged > 0 ? `天気を${logged}日ぶん記録中。` : "位置情報で天気を取得すると、過去92日と16日先の予報が記録されます。"}
        雨の日（{CONDITION_EMOJI.rainy}）は水やり扱いになります。
      </div>

      <div style={styles.calGrid} role="grid" aria-label={`${ym.year}年${ym.month}月`}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} style={{ ...styles.calWeekday, color: i === 0 ? "#c0432a" : i === 6 ? "#5b8aa6" : "#9aa089" }} role="columnheader">
            {w}
          </div>
        ))}
        {cells.map((c) => {
          const d = dayInfo(state, c.date, today);
          const isToday = c.date === today;
          const active = c.date === picked;
          const marks = [
            d.care.some((e) => e.kind === "water") ? "💧" : "",
            d.waterDue.length > 0 && c.date >= today ? "🚰" : "",
            d.care.some((e) => e.kind === "feed") ? "🌱" : "",
            d.harvests.length > 0 ? "🧺" : "",
            d.planted.length > 0 ? "🌰" : "",
          ].filter(Boolean);
          return (
            <button
              key={c.date}
              role="gridcell"
              aria-selected={active}
              aria-label={`${md(c.date)}${d.weather ? ` ${conditionInfo(d.weather.condition).label} ${d.weather.maxC}℃` : ""}`}
              onClick={() => setPicked(c.date)}
              style={{
                ...styles.calCell,
                opacity: c.inMonth ? 1 : 0.35,
                borderColor: active ? "#6b9d4f" : isToday ? "#c98b3a" : "#ece6d6",
                background: active ? "#eef4e6" : d.forecast ? "#fbfaf5" : "#fff",
              }}
            >
              <span style={{ ...styles.calDay, color: isToday ? "#c98b3a" : "#3d4a35" }}>{c.day}</span>
              <span style={styles.calWx} aria-hidden="true">
                {d.weather ? CONDITION_EMOJI[d.weather.condition] : ""}
              </span>
              <span style={styles.calTemp}>{d.weather ? `${d.weather.maxC}°` : ""}</span>
              <span style={styles.calMarks} aria-hidden="true">
                {marks.join("")}
              </span>
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
          <div style={{ ...styles.calDetailRow, color: "#9aa089" }}>この日の天気の記録はありません</div>
        )}
        {info.waterDue.length > 0 && (
          <div style={styles.calDetailRow}>
            <Droplets size={14} color="#5b8aa6" aria-hidden="true" />
            水やり{info.forecast ? "予定" : ""}：{info.waterDue.map((p) => `${plantEmoji(p)} ${p.projectName}`).join("、")}
          </div>
        )}
        {info.care.map((e) => (
          <div key={`${e.kind}-${e.label}`} style={styles.calDetailRow}>
            {e.kind === "water" && <Droplets size={14} color="#5b8aa6" aria-hidden="true" />}
            {e.kind === "feed" && <Leaf size={14} color="#6b9d4f" aria-hidden="true" />}
            {e.kind === "refresh" && <RotateCcw size={14} color="#9c7a4a" aria-hidden="true" />}
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
            <Sprout size={14} color="#6b9d4f" aria-hidden="true" /> 植え付け：{plantEmoji(p)} {p.projectName}
          </div>
        ))}
      </div>
    </Modal>
  );
}
