import { Sprout } from "lucide-react";
import type { WeatherState } from "../types";
import { CONDITION_EMOJI, conditionInfo } from "../lib/weather";
import { styles } from "../styles";

interface Props {
  weather: WeatherState;
  onWeather: () => void;
}

/** 上部の帯。ロゴと今日の天気だけ。天気を押すとホームの天気パネルへ */
export function Header({ weather, onWeather }: Props) {
  const c = weather.current;
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.brand}>
          <div style={styles.brandMark} aria-hidden="true">
            <Sprout size={22} color="#fff" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>そだてる庭</h1>
            <p style={styles.brandSub}>Home Farm Almanac</p>
          </div>
        </div>
        <button style={{ ...styles.headerWx, background: "transparent", border: "1px solid var(--line)", borderRadius: 9, padding: "6px 10px", cursor: "pointer" }} onClick={onWeather} aria-label="今日の天気">
          <span aria-hidden="true">{CONDITION_EMOJI[c.condition]}</span>
          {conditionInfo(c.condition).label} {c.tempC}℃
        </button>
      </div>
    </header>
  );
}
