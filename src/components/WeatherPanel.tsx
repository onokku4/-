import { useState } from "react";
import { Cloud, CloudRain, MapPin, MapPinOff, Minus, Plus, Snowflake, Sun, Wind, type LucideIcon } from "lucide-react";
import type { Condition, DailyWeather, GardenState } from "../types";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { CONDITIONS, conditionInfo, isAdjusted, tempLabel } from "../lib/weather";
import { formatClock } from "../ui/format";
import { styles } from "../styles";

const ICONS: Record<Condition, LucideIcon> = { sunny: Sun, cloudy: Cloud, rainy: CloudRain, snowy: Snowflake, windy: Wind };

/** iPhone の天気ウィジェット風の背景。天気ごとに色を変える */
const SKY: Record<Condition, string> = {
  sunny: "linear-gradient(160deg, #4aa3df 0%, #1c6fb8 100%)",
  cloudy: "linear-gradient(160deg, #8ea3b5 0%, #5c6f82 100%)",
  rainy: "linear-gradient(160deg, #5f7f9e 0%, #2e4a66 100%)",
  snowy: "linear-gradient(160deg, #a9c3d8 0%, #6d8aa3 100%)",
  windy: "linear-gradient(160deg, #7fb0a6 0%, #3f7a72 100%)",
};

interface Props {
  weather: GardenState["weather"];
  location: GardenState["location"];
  /** 今日の記録（最高・最低気温の表示に使う） */
  todayLog?: DailyWeather;
  autoWeather: boolean;
  fetching: boolean;
  onFetch: () => void;
  onRegister: () => void;
  dispatch: (a: Action) => void;
}

export function WeatherPanel({ weather, location, todayLog, autoWeather, fetching, onFetch, onRegister, dispatch }: Props) {
  const { current, auto } = weather;
  const Icon = ICONS[current.condition];
  const [draft, setDraft] = useState<string | null>(null);
  const setTemp = (tempC: number) => {
    setDraft(null);
    dispatch({ type: "weatherAdjust", patch: { tempC }, today: localDate() });
  };

  return (
    <div className="wx-box" style={styles.weatherBox}>
      {/* ウィジェット本体 */}
      <div style={{ ...styles.wxWidget, background: SKY[current.condition] }}>
        <div style={styles.wxWidgetTop}>
          <div>
            <div style={styles.wxPlace}>
              <MapPin size={12} aria-hidden="true" /> {location ? "庭" : "今日の天気"}
            </div>
            <div style={styles.wxTemp}>
              {current.tempC}
              <span style={styles.wxDeg}>°</span>
            </div>
          </div>
          <Icon size={54} color="#fff" aria-hidden="true" strokeWidth={1.6} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.25))" }} />
        </div>
        <div style={styles.wxWidgetBottom}>
          <span style={styles.wxCond}>
            {conditionInfo(current.condition).label}・{tempLabel(current.tempC)}
          </span>
          <span style={styles.wxHiLo}>
            {todayLog ? `最高 ${todayLog.maxC}° 最低 ${todayLog.minC}°` : auto ? `自動取得 ${formatClock(auto.fetchedAt)}` : "手動入力"}
          </span>
        </div>
      </div>

      {/* 調整 */}
      <div className="wx-line" role="group" aria-label="天気を選ぶ">
        {CONDITIONS.map((w) => {
          const I = ICONS[w.id];
          const active = w.id === current.condition;
          return (
            <button
              key={w.id}
              aria-label={w.label}
              aria-pressed={active}
              title={w.label}
              onClick={() => dispatch({ type: "weatherAdjust", patch: { condition: w.id }, today: localDate() })}
              style={{ ...styles.weatherBtn, background: active ? w.color : "var(--panel-2)", borderColor: active ? w.color : "var(--line)" }}
            >
              <I size={18} color={active ? "#fff" : "var(--muted)"} aria-hidden="true" />
            </button>
          );
        })}
        <span style={{ flex: 1 }} />
        <span role="group" aria-label="気温を調整" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button style={styles.tempBtn} aria-label="気温を1℃下げる" onClick={() => setTemp(current.tempC - 1)}>
            <Minus size={16} aria-hidden="true" />
          </button>
          <input
            type="number"
            aria-label="気温"
            style={styles.tempInput}
            value={draft ?? String(current.tempC)}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n)) dispatch({ type: "weatherAdjust", patch: { tempC: n }, today: localDate() });
            }}
            onBlur={() => setDraft(null)}
          />
          <span style={styles.tempUnit} aria-hidden="true">
            ℃
          </span>
          <button style={styles.tempBtn} aria-label="気温を1℃上げる" onClick={() => setTemp(current.tempC + 1)}>
            <Plus size={16} aria-hidden="true" />
          </button>
        </span>
      </div>
      {auto && isAdjusted(weather) && (
        <div className="wx-line">
          <span style={styles.adjustedChip}>調整済み</span>
          <span style={styles.autoInfo}>
            自動取得は {conditionInfo(auto.condition).label} {auto.tempC}℃
          </span>
          <button style={styles.resetBtn} onClick={() => dispatch({ type: "weatherReset", today: localDate() })}>
            自動値に戻す
          </button>
        </div>
      )}

      {/* 位置 */}
      {location ? (
        <div className="wx-line">
          <span style={styles.autoInfo}>
            <MapPin size={12} aria-hidden="true" style={{ verticalAlign: -1 }} /> 庭の位置：登録済み（{location.lat.toFixed(2)}, {location.lon.toFixed(2)}・約1km精度）
          </span>
          <button onClick={onFetch} disabled={fetching} style={{ ...styles.autoFetchBtn, opacity: fetching ? 0.6 : 1 }}>
            {fetching ? "取得中…" : "今すぐ取得"}
          </button>
          <button style={styles.resetBtn} onClick={() => dispatch({ type: "clearLocation" })} aria-label="庭の位置を解除">
            <MapPinOff size={12} aria-hidden="true" style={{ verticalAlign: -1 }} /> 解除
          </button>
        </div>
      ) : (
        <div className="wx-line">
          <button onClick={onRegister} disabled={fetching} style={{ ...styles.autoFetchBtn, opacity: fetching ? 0.6 : 1 }}>
            {fetching ? "取得中…" : "📍 庭の位置を登録して毎日自動取得"}
          </button>
          <button role="switch" aria-checked={autoWeather} onClick={() => dispatch({ type: "setAutoWeather", on: !autoWeather })} style={styles.autoToggle}>
            <span style={{ ...styles.toggleTrack, background: autoWeather ? "var(--mint)" : "var(--line)" }}>
              <span style={{ ...styles.toggleKnob, transform: autoWeather ? "translateX(16px)" : "translateX(0)" }} />
            </span>
            <span style={styles.autoToggleLabel}>登録せずに毎回位置情報で取得</span>
          </button>
          {autoWeather && (
            <button onClick={onFetch} disabled={fetching} style={{ ...styles.autoFetchBtn, opacity: fetching ? 0.6 : 1 }}>
              {fetching ? "取得中…" : "今すぐ取得"}
            </button>
          )}
        </div>
      )}
      <span style={styles.autoNote}>
        {location
          ? "登録した位置（約1kmに丸めた座標）だけを端末内に保存し、天気の取得にのみ使います。"
          : "登録すると位置情報の許可を毎回求めず、植え付け以降の天気も取り込めます。座標は約1kmに丸めて端末内にだけ保存します。"}
      </span>
    </div>
  );
}
