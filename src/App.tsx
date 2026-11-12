import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BADGES } from "./data/game";
import { diagnose } from "./lib/pollination";
import { lastYearAround } from "./lib/calendar";
import { tagLabel } from "./data/agronomy";
import { feedSchedule } from "./lib/soil";
import { frostTomorrow, recommendSupplies } from "./lib/supplies";
import { plantStatus } from "./lib/watering";
import { conditionInfo } from "./lib/weather";
import { useAutoWeather } from "./hooks/useAutoWeather";
import { useGarden } from "./hooks/useGarden";
import { useToday } from "./hooks/useToday";
import { useWaterNotify } from "./hooks/useWaterNotify";
import { styles } from "./styles";
import { AddWizard } from "./components/AddWizard";
import { BadgePopup } from "./components/BadgePopup";
import { BedsView } from "./components/BedsView";
import { CalendarView } from "./components/CalendarView";
import { FeedAlert } from "./components/FeedAlert";
import { Header } from "./components/Header";
import { PhotoViewer } from "./components/PhotoViewer";
import { PlantCard } from "./components/PlantCard";
import type { PlantView } from "./components/plantView";
import { PollinationAlert } from "./components/PollinationAlert";
import { SettingsView } from "./components/SettingsView";
import { StatusBar } from "./components/StatusBar";
import { SeasonCard } from "./components/SeasonCard";
import { SuppliesCard } from "./components/SuppliesCard";
import { TempAlert } from "./components/TempAlert";
import { TabBar, type Tab } from "./components/TabBar";
import { Toast } from "./components/Toast";
import { WaterAlert } from "./components/WaterAlert";
import { WeatherPanel } from "./components/WeatherPanel";

export function App() {
  const { state, dispatch, toast, say, badgeQueue, dismissBadge } = useGarden();
  const today = useToday();
  const [tab, setTab] = useState<Tab>("home");
  const [openBedId, setOpenBedId] = useState<string | null>(null);
  /** 植えるウィザード。文字列ならその場所を最初に選ぶ */
  const [wizard, setWizard] = useState<false | true | string>(false);
  const [viewerPhoto, setViewerPhoto] = useState<string | null>(null);
  const [feedTarget, setFeedTarget] = useState<string | null>(null);
  const [showWeather, setShowWeather] = useState(false);
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
  const sortedPhotos = useMemo(() => [...state.photos].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)), [state.photos]);
  const todo = due.length + feedDue.length;
  const supplies = useMemo(() => recommendSupplies(state, today), [state, today]);
  const frost = frostTomorrow(state.weatherLog, today);
  const lastYear = useMemo(() => lastYearAround(state, today), [state, today]);
  // ホームは「手を入れる株」だけ。全部は「場所」タブの作物タブで見る
  const attention = useMemo(
    () => views.filter((v) => v.status.due || v.status.frostRisk || v.status.temp.kind !== "ok" || v.diagnosis?.verdict === "ng" || v.diagnosis?.verdict === "action"),
    [views],
  );

  const goFeed = (bedId: string) => {
    setFeedTarget(bedId);
    setOpenBedId(bedId);
    setTab("beds");
  };

  return (
    <div style={styles.page}>
      <Header
        weather={state.weather}
        onWeather={() => {
          setTab("home");
          setShowWeather((v) => !v);
        }}
      />

      <main style={styles.main}>
        {tab === "home" && (
          <>
            {showWeather && (
              <div style={{ ...styles.notifyCard, display: "block", marginBottom: 14 }}>
                <WeatherPanel weather={state.weather} location={state.location} todayLog={state.weatherLog[today]} autoWeather={state.autoWeather} fetching={fetching} onFetch={() => void fetchNow()} onRegister={() => void register()} dispatch={dispatch} />
              </div>
            )}
            <div style={styles.eyebrow}>Today</div>
            <StatusBar xp={state.xp} streak={state.streak} waterCount={state.waterCount} plantCount={state.plants.length} />
            <WaterAlert due={due} weatherLabel={conditionInfo(state.weather.current.condition).label} dispatch={dispatch} />
            <FeedAlert due={feedDue} onPick={goFeed} />
            {frost !== null && state.plants.length > 0 && (
              <section style={{ ...styles.alertBox, borderColor: "rgba(91,138,166,.5)", borderLeftColor: "var(--sky)" }} aria-label="霜注意">
                <div style={{ ...styles.alertHead, marginBottom: 4 }}>❄️ 明日の朝は {frost}℃の予報。霜に注意</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>寒さに弱い株は軒下・室内へ。不織布をかけるだけでも2〜3℃違います。</div>
              </section>
            )}
            <TempAlert views={views} tempC={state.weather.current.tempC} />
            <PollinationAlert views={views} />
            {todo === 0 && state.plants.length > 0 && <div style={{ ...styles.alertBox, borderColor: "rgba(107,157,79,.4)", borderLeftColor: "var(--mint)" }}>✅ 今日やることはありません。</div>}
            {lastYear.length > 0 && (
              <section style={{ ...styles.alertBox, borderColor: "rgba(201,139,58,.45)", borderLeftColor: "var(--amber)" }} aria-label="去年の今頃">
                <div style={{ ...styles.alertHead, marginBottom: 4 }}>🐛 去年の今頃に出た病害虫</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {lastYear.map((l) => `${Number(l.date.slice(5, 7))}/${Number(l.date.slice(8, 10))} ${l.tags.map(tagLabel).join("・")}`).join("、")}。葉裏を見て先回りを。
                </div>
              </section>
            )}
            <SuppliesCard items={supplies} />
            <SeasonCard location={state.location} today={today} onPick={() => setWizard(true)} />

            <div style={{ ...styles.sectionHead, marginTop: 20 }}>
              <h2 style={styles.sectionTitle}>{views.length === 0 ? "育てている作物" : "手を入れる株"}</h2>
              <div style={styles.btnRow}>
                {views.length > 0 && (
                  <button style={styles.histBtn} onClick={() => setTab("beds")}>
                    すべての作物（{views.length}）
                  </button>
                )}
                <button style={styles.addBtn} onClick={() => setWizard(true)}>
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
                <button style={styles.addBtnBig} onClick={() => setWizard(true)}>
                  <Plus size={18} aria-hidden="true" /> 最初の一株を植える
                </button>
              </div>
            ) : attention.length === 0 ? (
              <p style={{ ...styles.calNote, margin: 0 }}>今は手を入れる株はありません。様子は「場所」タブから。</p>
            ) : (
              <div style={styles.grid}>
                {attention.map((v) => (
                  <PlantCard key={v.plant.uid} view={v} beds={state.beds} weatherLog={state.weatherLog} dispatch={dispatch} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "beds" && (
          <BedsView
            state={state}
            views={views}
            today={today}
            openBedId={openBedId}
            onOpenBed={setOpenBedId}
            feedTarget={feedTarget}
            onFeedTargetDone={() => setFeedTarget(null)}
            onAddBed={() => setWizard(true)}
            onPlant={(bedId) => setWizard(bedId)}
            onOpenPhoto={setViewerPhoto}
            say={say}
            dispatch={dispatch}
          />
        )}

        {tab === "calendar" && <CalendarView state={state} today={today} onOpenPhoto={setViewerPhoto} dispatch={dispatch} />}

        {tab === "settings" && (
          <SettingsView state={state} today={today} fetching={fetching} onFetch={() => void fetchNow()} onRegister={() => void register()} dispatch={dispatch} say={say} />
        )}
      </main>

      <TabBar tab={tab} onChange={setTab} badges={{ home: todo }} />

      {wizard !== false && (
        <AddWizard beds={state.beds} plants={state.plants} harvestLog={state.harvestLog} careLog={state.careLog} location={state.location} today={today} initialBedId={typeof wizard === "string" ? wizard : null} dispatch={dispatch} onClose={() => setWizard(false)} />
      )}
      {viewerPhoto && (
        <PhotoViewer photos={sortedPhotos} startId={viewerPhoto} beds={state.beds} weatherLog={state.weatherLog} dispatch={dispatch} onClose={() => setViewerPhoto(null)} />
      )}
      <Toast message={toast} />
      {popupBadge && <BadgePopup badge={popupBadge} onClose={dismissBadge} />}
    </div>
  );
}
