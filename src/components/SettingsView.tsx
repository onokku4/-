import { useState } from "react";
import { BookOpen, History } from "lucide-react";
import type { Crop } from "../types";
import { CATEGORIES, CROPS } from "../data/catalog";
import { GuideModal } from "./GuideModal";
import type { GardenState } from "../types";
import type { Action } from "../lib/garden";
import { styles } from "../styles";
import { BackupCard } from "./BackupCard";
import { BadgeGrid } from "./BadgeGrid";
import { HistoryModal } from "./HistoryModal";
import { NotifyCard } from "./NotifyCard";
import { WeatherPanel } from "./WeatherPanel";

interface Props {
  state: GardenState;
  today: string;
  fetching: boolean;
  onFetch: () => void;
  onRegister: () => void;
  dispatch: (a: Action) => void;
  say: (m: string) => void;
}

export function SettingsView({ state, today, fetching, onFetch, onRegister, dispatch, say }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [guide, setGuide] = useState<Crop | null>(null);
  return (
    <section aria-label="設定" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={styles.eyebrow}>Weather</div>
        <div style={{ ...styles.notifyCard, display: "block" }}>
          <WeatherPanel weather={state.weather} location={state.location} todayLog={state.weatherLog[today]} autoWeather={state.autoWeather} fetching={fetching} onFetch={onFetch} onRegister={onRegister} dispatch={dispatch} />
        </div>
      </div>
      <div>
        <div style={styles.eyebrow}>Notify & Backup</div>
        <NotifyCard notifyOn={state.notifyOn} notifyTime={state.notifyTime} dispatch={dispatch} say={say} />
        <BackupCard state={state} today={today} dispatch={dispatch} say={say} />
      </div>
      <div>
        <div style={styles.eyebrow}>Records</div>
        <button style={{ ...styles.bedRow, justifyContent: "space-between" }} onClick={() => setShowHistory(true)}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <History size={18} color="var(--amber)" aria-hidden="true" />
            <span style={styles.bedRowName}>収穫の履歴</span>
          </span>
          <span style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 12 }}>{state.harvestLog.length}件</span>
        </button>
      </div>
      <div>
        <div style={styles.eyebrow}>
          <BookOpen size={12} aria-hidden="true" /> 作物図鑑・育て方
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", margin: "6px 0 4px" }}>{cat}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CROPS.filter((c) => c.category === cat).map((c) => (
                <button key={c.id} style={styles.histBtn} onClick={() => setGuide(c)}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        {guide && <GuideModal crop={guide} onClose={() => setGuide(null)} />}
      </div>
      <div>
        <BadgeGrid earned={state.earnedBadges} />
      </div>
      <footer style={styles.footer}>🌾 データはこのブラウザに自動保存されます。</footer>
      {showHistory && <HistoryModal log={state.harvestLog} onClose={() => setShowHistory(false)} />}
    </section>
  );
}
