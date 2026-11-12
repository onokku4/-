import { useMemo, useState } from "react";
import { CalendarDays, History, Images, Plus, Sprout } from "lucide-react";
import { BADGES } from "./data/game";
import { diagnose } from "./lib/pollination";
import { feedSchedule } from "./lib/soil";
import { plantStatus } from "./lib/watering";
import { conditionInfo } from "./lib/weather";
import { useAutoWeather } from "./hooks/useAutoWeather";
import { useGarden } from "./hooks/useGarden";
import { useToday } from "./hooks/useToday";
import { useWaterNotify } from "./hooks/useWaterNotify";
import { styles } from "./styles";
import { AddWizard } from "./components/AddWizard";
import { BadgeGrid } from "./components/BadgeGrid";
import { AlbumModal } from "./components/AlbumModal";
import { BadgePopup } from "./components/BadgePopup";
import { CalendarModal } from "./components/CalendarModal";
import { BedSection } from "./components/BedSection";
import { FeedAlert } from "./components/FeedAlert";
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
  const [showCalendar, setShowCalendar] = useState(false);
  /** アルバムを開く。文字列なら、その写真を最初に大きく表示 */
  const [album, setAlbum] = useState<false | true | string>(false);
  const [feedTarget, setFeedTarget] = useState<string | null>(null);
  const { fetching, fetchNow, register } = useAutoWeather(state, dispatch, say);

  // 各株の水やり状態・受粉診断はここで1回だけ計算して配る
  const views = useMemo<PlantView[]>(
    () =>
      state.plants.flatMap((plant) => {
        const bed = state.beds.find((b) => b.id === plant.bedId);
        const status = plantStatus(plant, bed, state.weather.current, today, state.weatherLog);
        if (!status) return [];
        const diagnosis = diagnose(
          plant,
          state.plants.filter((o) => o.uid !== plant.uid),
        );
        return [{ plant, bed, status, diagnosis }];
      }),
    [state.plants, state.beds, state.weather.current, state.weatherLog, today],
  );
  const due = useMemo(() => views.filter((v) => v.status.due), [views]);
  const dueNames = useMemo(() => due.map((v) => v.plant.projectName), [due]);
  const feedDue = useMemo(
    () => state.beds.filter((b) => feedSchedule(b, state.plants.filter((p) => p.bedId === b.id).length, today).due),
    [state.beds, state.plants, today],
  );
  useWaterNotify(state, dueNames, feedDue.map((b) => b.name), dispatch, say);

  const popupBadge = BADGES.find((b) => b.id === badgeQueue[0]);

  return (
    <div style={styles.page}>
      <Header
        weather={state.weather}
        location={state.location}
        autoWeather={state.autoWeather}
        fetching={fetching}
        onFetch={() => void fetchNow()}
        onRegister={() => void register()}
        dispatch={dispatch}
      />

      <main style={styles.main}>
        <StatusBar xp={state.xp} streak={state.streak} waterCount={state.waterCount} plantCount={state.plants.length} />
        <WaterAlert due={due} weatherLabel={conditionInfo(state.weather.current.condition).label} dispatch={dispatch} />
        <FeedAlert due={feedDue} onPick={setFeedTarget} />
        <PollinationAlert views={views} />
        <NotifyCard notifyOn={state.notifyOn} notifyTime={state.notifyTime} dispatch={dispatch} say={say} />

        <BedSection
          beds={state.beds}
          plants={state.plants}
          photos={state.photos}
          today={today}
          say={say}
          onOpenPhoto={setAlbum}
          feedTarget={feedTarget}
          onFeedTargetDone={() => setFeedTarget(null)}
          dispatch={dispatch}
          onAdd={() => setShowAdd(true)}
        />

        <section>
          <div style={{ ...styles.sectionHead, marginTop: 26 }}>
            <h2 style={styles.sectionTitle}>
              <Sprout size={20} color="#6b9d4f" aria-hidden="true" /> 育てている作物
            </h2>
            <div style={styles.btnRow}>
              <button style={styles.histBtn} onClick={() => setShowCalendar(true)}>
                <CalendarDays size={16} aria-hidden="true" /> カレンダー
              </button>
              <button style={styles.histBtn} onClick={() => setAlbum(true)}>
                <Images size={16} aria-hidden="true" /> アルバム{state.photos.length > 0 ? `(${state.photos.length})` : ""}
              </button>
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
      {showCalendar && (
        <CalendarModal
          state={state}
          today={today}
          onOpenPhoto={(id) => {
            setShowCalendar(false);
            setAlbum(id);
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}
      {album !== false && (
        <AlbumModal photos={state.photos} beds={state.beds} initialPhotoId={typeof album === "string" ? album : null} dispatch={dispatch} onClose={() => setAlbum(false)} />
      )}
      <Toast message={toast} />
      {popupBadge && <BadgePopup badge={popupBadge} onClose={dismissBadge} />}
    </div>
  );
}
