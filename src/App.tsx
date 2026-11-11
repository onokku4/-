import { useMemo, useState } from "react";
import { History, Plus, Sprout } from "lucide-react";
import { BADGES } from "./data/game";
import { diagnose } from "./lib/pollination";
import { plantStatus } from "./lib/watering";
import { conditionInfo } from "./lib/weather";
import { useAutoWeather } from "./hooks/useAutoWeather";
import { useGarden } from "./hooks/useGarden";
import { useToday } from "./hooks/useToday";
import { useWaterNotify } from "./hooks/useWaterNotify";
import { styles } from "./styles";
import { AddWizard } from "./components/AddWizard";
import { BadgeGrid } from "./components/BadgeGrid";
import { BadgePopup } from "./components/BadgePopup";
import { BedSection } from "./components/BedSection";
import { Header } from "./components/Header";
import { HistoryModal } from "./components/HistoryModal";
import { NotifyCard } from "./components/NotifyCard";
import { PlantCard } from "./components/PlantCard";
import type { PlantView } from "./components/plantView";
import { PollinationAlert } from "./components/PollinationAlert";
import { StatusBar } from "./components/StatusBar";
import { Toast } from "./components/Toast";
import { WaterAlert } from "./components/WaterAlert";

export function App() {
  const { state, dispatch, toast, say, badgeQueue, dismissBadge } = useGarden();
  const today = useToday();
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { fetching, fetchNow } = useAutoWeather(state, dispatch, say);

  // 各株の水やり状態・受粉診断はここで1回だけ計算して配る
  const views = useMemo<PlantView[]>(
    () =>
      state.plants.flatMap((plant) => {
        const bed = state.beds.find((b) => b.id === plant.bedId);
        const status = plantStatus(plant, bed, state.weather.current, today);
        if (!status) return [];
        const diagnosis = diagnose(
          plant,
          state.plants.filter((o) => o.uid !== plant.uid),
        );
        return [{ plant, bed, status, diagnosis }];
      }),
    [state.plants, state.beds, state.weather.current, today],
  );
  const due = useMemo(() => views.filter((v) => v.status.due), [views]);
  const dueNames = useMemo(() => due.map((v) => v.plant.projectName), [due]);
  useWaterNotify(state, dueNames, dispatch, say);

  const popupBadge = BADGES.find((b) => b.id === badgeQueue[0]);

  return (
    <div style={styles.page}>
      <Header
        weather={state.weather}
        autoWeather={state.autoWeather}
        fetching={fetching}
        onFetch={() => void fetchNow()}
        dispatch={dispatch}
      />

      <main style={styles.main}>
        <StatusBar xp={state.xp} streak={state.streak} waterCount={state.waterCount} plantCount={state.plants.length} />
        <WaterAlert due={due} weatherLabel={conditionInfo(state.weather.current.condition).label} dispatch={dispatch} />
        <PollinationAlert views={views} />
        <NotifyCard notifyOn={state.notifyOn} notifyTime={state.notifyTime} dispatch={dispatch} say={say} />

        <BedSection beds={state.beds} plants={state.plants} dispatch={dispatch} onAdd={() => setShowAdd(true)} />

        <section>
          <div style={{ ...styles.sectionHead, marginTop: 26 }}>
            <h2 style={styles.sectionTitle}>
              <Sprout size={20} color="#6b9d4f" aria-hidden="true" /> 育てている作物
            </h2>
            <div style={styles.btnRow}>
              <button style={styles.histBtn} onClick={() => setShowHistory(true)}>
                <History size={16} aria-hidden="true" /> 履歴{state.harvestLog.length > 0 ? `(${state.harvestLog.length})` : ""}
              </button>
              <button style={styles.addBtn} onClick={() => setShowAdd(true)}>
                <Plus size={18} aria-hidden="true" /> 植える
              </button>
            </div>
          </div>

          {views.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: 48, marginBottom: 8 }} aria-hidden="true">
                🪴
              </div>
              <p style={styles.emptyText}>まだ何も植えていません。</p>
              <button style={styles.addBtnBig} onClick={() => setShowAdd(true)}>
                <Plus size={18} aria-hidden="true" /> 最初の一株を植える
              </button>
            </div>
          ) : (
            <div style={styles.grid}>
              {views.map((v) => (
                <PlantCard key={v.plant.uid} view={v} dispatch={dispatch} />
              ))}
            </div>
          )}
        </section>

        <BadgeGrid earned={state.earnedBadges} />

        <footer style={styles.footer}>🌾 データはこのブラウザに自動保存されます。</footer>
      </main>

      {showAdd && (
        <AddWizard beds={state.beds} plants={state.plants} today={today} dispatch={dispatch} onClose={() => setShowAdd(false)} />
      )}
      {showHistory && <HistoryModal log={state.harvestLog} onClose={() => setShowHistory(false)} />}
      <Toast message={toast} />
      {popupBadge && <BadgePopup badge={popupBadge} onClose={dismissBadge} />}
    </div>
  );
}
