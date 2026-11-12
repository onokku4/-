import { useState } from "react";
import { Cloud, CloudRain, Minus, Plus, Snowflake, Sun, Wind, type LucideIcon } from "lucide-react";
import { MapPin, MapPinOff } from "lucide-react";
import type { Condition, GardenState } from "../types";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { CONDITIONS, conditionInfo, isAdjusted, tempLabel } from "../lib/weather";
import { formatClock } from "../ui/format";
import { styles } from "../styles";

const ICONS: Record<Condition, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: Snowflake,
  windy: Wind,
};

interface Props {
  weather: GardenState["weather"];
  location: GardenState["location"];
  autoWeather: boolean;
  fetching: boolean;
  onFetch: () => void;
  /** 位置情報を1回使って庭の位置を登録し、天気を取る */
  onRegister: () => void;
  dispatch: (a: Action) => void;
}

export function WeatherPanel({ weather, location, autoWeather, fetching, onFetch, onRegister, dispatch }: Props) {
  const { current, auto } = weather;
  // 入力途中（空欄や「-」）の文字列。確定した数値だけを状態に反映する
  const [draft, setDraft] = useState<string | null>(null);
  const setTemp = (tempC: number) => {
    setDraft(null);
    dispatch({ type: "weatherAdjust", patch: { tempC }, today: localDate() });
  };

  return (
    <div className="wx-box" style={styles.weatherBox}>
      <div className="wx-line">
        <span style={styles.weatherLabel}>
          今日の天気　{conditionInfo(current.condition).label} {current.tempC}℃
        </span>
      </div>

      <div className="wx-line" role="group" aria-label="天気を選ぶ">
        {CONDITIONS.map((w) => {
          const Icon = ICONS[w.id];
          const active = w.id === current.condition;
          return (
            <button
              key={w.id}
              aria-label={w.label}
              aria-pressed={active}
              title={w.label}
              onClick={() => dispatch({ type: "weatherAdjust", patch: { condition: w.id }, today: localDate() })}
              style={{
                ...styles.weatherBtn,
                background: active ? w.color : "transparent",
                borderColor: active ? w.color : "rgba(255,255,255,.25)",
                transform: active ? "translateY(-2px)" : "none",
              }}
            >
              <Icon size={18} color={active ? "#fff" : "rgba(255,255,255,.7)"} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="wx-line" role="group" aria-label="気温を調整">
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
        <span style={styles.tempLabel}>{tempLabel(current.tempC)}</span>
      </div>

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
          <button
            role="switch"
            aria-checked={autoWeather}
            onClick={() => dispatch({ type: "setAutoWeather", on: !autoWeather })}
            style={styles.autoToggle}
          >
            <span style={{ ...styles.toggleTrack, background: autoWeather ? "#7fb04f" : "rgba(255,255,255,.2)" }}>
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

      {auto && (
        <div className="wx-line">
          <span style={styles.autoInfo}>
            自動取得 {formatClock(auto.fetchedAt)}　{conditionInfo(auto.condition).label} {auto.tempC}℃
          </span>
          {isAdjusted(weather) && (
            <>
              <span style={styles.adjustedChip}>調整済み</span>
              <button style={styles.resetBtn} onClick={() => dispatch({ type: "weatherReset", today: localDate() })}>
                自動値に戻す
              </button>
            </>
          )}
        </div>
      )}

      <span style={styles.autoNote}>
        {location
          ? "登録した位置（約1kmに丸めた座標）だけを端末内に保存し、天気の取得にのみ使います。植え付け以降の天気も自動で取り込みます。"
          : "登録すると位置情報の許可を毎回求めず、植え付け以降の天気も取り込めます。座標は約1kmに丸めて端末内にだけ保存します。"}
      </span>
    </div>
  );
}
