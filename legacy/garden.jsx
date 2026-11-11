import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sprout, Droplets, Sun, CloudRain, Cloud, Snowflake, Wind, Plus, X, Award,
  Flame, Leaf, TrendingUp, Trash2, Check, Calendar, Star, ChevronRight, Trophy,
  Bell, BellOff, Mountain, RotateCcw, History, Clock, Beaker
} from "lucide-react";

/* ============================================================
   作物データベース — 定番野菜 + ハーブ
   feed: 土から消費する栄養量 {n:窒素, p:リン酸, k:カリ}
   category: 分類（果菜・葉物・根菜・ハーブ・果物）
   varieties: 品種。品種ごとに固有のdays(収穫日数)とtip(アドバイス)を持つ
   ============================================================ */
const CROP_DB = [
  { id: "tomato", name: "トマト", emoji: "🍅", category: "果菜", season: "春〜夏", waterEvery: 2, sun: "日なた",
    tip: "実がつき始めたら水を控えめに。乾燥気味の方が甘く育つ。わき芽はこまめに摘む。", days: 90, feed: { n: 4, p: 7, k: 8 },
    varieties: [
      { id: "momotaro", name: "桃太郎", days: 90, tip: "定番の大玉。雨で実が割れやすいので梅雨は雨よけを。完熟手前で収穫すると日持ちする。" },
      { id: "aiko", name: "アイコ", days: 75, tip: "甘みの強い縦長ミニ。皮が厚く裂果に強い。鈴なりになるので支柱と摘果でバランスを。" },
      { id: "chika", name: "千果（ミニ）", days: 70, tip: "初心者向けの育てやすいミニ。プランターでもよく成る。脇芽1本を伸ばす2本仕立てが◎。" },
      { id: "fruity", name: "フルーツトマト系", days: 95, tip: "高糖度を狙うなら水を絞るのがコツ。最終盤の灌水は控えめに。ストレスをかけると甘くなる。" },
      { id: "zebra", name: "グリーンゼブラ", days: 85, tip: "緑のしま模様が美しいエアルーム種。完熟しても黄緑なので、押して柔らかさで判断する。" },
    ] },
  { id: "basil", name: "バジル", emoji: "🌿", category: "ハーブ", season: "春〜夏", waterEvery: 1, sun: "日なた",
    tip: "乾燥に弱いので土の表面が乾いたらすぐ水を。摘心すると脇芽が増えて収穫量UP。", days: 60, feed: { n: 4, p: 2, k: 2 },
    varieties: [
      { id: "sweet", name: "スイートバジル", days: 60, tip: "最も一般的。トマト料理に最適。花が咲くと葉が硬くなるので花穂は早めに摘む。" },
      { id: "purple", name: "ダークオパール（紫）", days: 65, tip: "赤紫の葉が美しい観賞も兼ねる品種。ビネガーに漬けるときれいなピンクに。やや生育ゆっくり。" },
    ] },
  { id: "lettuce", name: "レタス", emoji: "🥬", category: "葉物", season: "春・秋", waterEvery: 2, sun: "半日陰OK",
    tip: "高温に弱い。夏は半日陰で。とう立ち前に外葉から順に収穫すると長く楽しめる。", days: 50, feed: { n: 7, p: 2, k: 3 },
    varieties: [
      { id: "frill", name: "フリルレタス", days: 45, tip: "結球しないリーフ型。外葉からかき採れば長期間収穫可能。家庭菜園で一番作りやすい。" },
      { id: "romaine", name: "ロメイン", days: 60, tip: "シャキッとした半結球型。シーザーサラダ向き。株間を広めにとると大きく育つ。" },
      { id: "tama", name: "玉レタス", days: 70, tip: "結球タイプは難度やや高め。涼しい時期に。結球前の高温でとう立ちしやすい点に注意。" },
    ] },
  { id: "eggplant", name: "ナス", emoji: "🍆", category: "果菜", season: "夏", waterEvery: 1, sun: "日なた",
    tip: "水を好む。乾燥すると実が硬くなる。一番果は小さいうちに収穫して株を育てる。", days: 100, feed: { n: 6, p: 7, k: 8 },
    varieties: [
      { id: "senryo", name: "千両二号", days: 100, tip: "中長ナスの定番。長期間とれる。盛夏は枝を切り戻す『更新剪定』で秋ナスを楽しめる。" },
      { id: "beinasu", name: "米ナス", days: 110, tip: "大型でヘタが緑。田楽やステーキ向き。実が重いので支柱をしっかり。肥料食いなので追肥多めに。" },
      { id: "kamonasu", name: "賀茂ナス", days: 105, tip: "京都の伝統野菜・丸ナス。1株あたりの収穫数は少なめだが、肉質がしまり煮物・田楽で絶品。" },
      { id: "long", name: "長ナス", days: 95, tip: "30cm近くになる細長型。皮が柔らかく焼きナスに最適。風で折れやすいので支柱を早めに。" },
    ] },
  { id: "cucumber", name: "キュウリ", emoji: "🥒", category: "果菜", season: "夏", waterEvery: 1, sun: "日なた",
    tip: "根が浅く乾燥に弱い。朝の水やりを基本に。ツルが伸びたら早めに支柱へ誘引。", days: 70, feed: { n: 5, p: 6, k: 7 },
    varieties: [
      { id: "fushinari", name: "節成りキュウリ", days: 60, tip: "各節に実がつき収穫量が多い。採り遅れると株が疲れるので毎日チェックして若採りを。" },
      { id: "kaga", name: "加賀太キュウリ", days: 80, tip: "太く大型の地方品種。煮物やあんかけに。実が大きいので2〜3本に絞ると充実する。" },
      { id: "mini", name: "ミニキュウリ", days: 50, tip: "10cm前後で収穫する小型種。プランターでも作りやすく、ピクルスや浅漬けに最適。" },
    ] },
  { id: "pepper", name: "ピーマン", emoji: "🫑", category: "果菜", season: "夏", waterEvery: 2, sun: "日なた",
    tip: "暑さに強い。実を採り遅れると株が疲れるので若採りを。追肥でぐんぐん育つ。", days: 80, feed: { n: 5, p: 6, k: 7 },
    varieties: [
      { id: "kyomidori", name: "京みどり", days: 80, tip: "育てやすい中型種。次々と実をつける。一番果は早採りして株の充実を優先。" },
      { id: "paprika", name: "パプリカ", days: 110, tip: "完熟まで時間がかかるぶん肥料と日光をたっぷり。色づくまで2か月待つ価値あり。" },
    ] },
  { id: "radish", name: "ラディッシュ", emoji: "🌶️", category: "根菜", season: "ほぼ通年", waterEvery: 2, sun: "日なた",
    tip: "種まきから30日で収穫できる初心者向け。間引いて株間を確保すると丸く太る。", days: 30, feed: { n: 2, p: 2, k: 4 },
    varieties: [
      { id: "comet", name: "コメット（赤丸）", days: 30, tip: "最もポピュラーな赤丸。30日で収穫。採り遅れると割れるので適期を逃さず。" },
      { id: "white", name: "白長ラディッシュ", days: 35, tip: "細長い白型。サラダや浅漬けに。やや深さのある容器だと根が真っ直ぐ伸びる。" },
    ] },
  { id: "mint", name: "ミント", emoji: "🍃", category: "ハーブ", season: "春〜秋", waterEvery: 2, sun: "半日陰OK",
    tip: "とにかく強い。繁殖力が強いので鉢植え推奨。摘んでも摘んでもすぐ伸びる。", days: 45, feed: { n: 3, p: 1, k: 2 },
    varieties: [
      { id: "spear", name: "スペアミント", days: 45, tip: "料理向きのまろやかな香り。モヒートやお茶に。地下茎で広がるので必ず鉢で管理を。" },
      { id: "pepper", name: "ペパーミント", days: 45, tip: "清涼感が強くスイーツ向き。スペアミントより香りが鋭い。半日陰でもよく育つ。" },
    ] },
  { id: "strawberry", name: "イチゴ", emoji: "🍓", category: "果物", season: "春", waterEvery: 2, sun: "日なた",
    tip: "実に水がかかると傷むので株元に。ランナーは収穫期は切り、来季の苗取りに使う。", days: 120, feed: { n: 3, p: 6, k: 6 },
    varieties: [
      { id: "shoutoku", name: "宝交早生", days: 120, tip: "病気に強く家庭菜園の定番。甘酸っぱい。秋植え→春収穫。冬の寒さに当てると花芽がつく。" },
      { id: "shikinari", name: "四季なりイチゴ", days: 90, tip: "春と秋に複数回収穫できる。少量ずつ長く楽しめる。実つきを保つため早めの摘果を。" },
      { id: "tochiotome", name: "とちおとめ", days: 130, tip: "大粒で甘みが強い人気品種。やや病害に注意。冬は防寒、開花後は受粉のため軽く花を撫でると◎。" },
    ] },
  { id: "spinach", name: "ホウレンソウ", emoji: "🥬", category: "葉物", season: "秋・冬", waterEvery: 3, sun: "半日陰OK",
    tip: "涼しい気候を好む。寒さに当たると甘くなる。酸性土が苦手なので苦土石灰を。", days: 40, feed: { n: 8, p: 2, k: 3 },
    varieties: [
      { id: "western", name: "西洋種", days: 40, tip: "葉が丸く育てやすい。サラダにも。秋まきが失敗しにくい。酸性土を嫌うので石灰で中和を。" },
      { id: "chijimi", name: "ちぢみほうれん草", days: 60, tip: "寒さに当てて葉を縮ませる冬の味覚。糖度が上がり濃厚。霜が甘さを引き出す。" },
    ] },
  { id: "carrot", name: "ニンジン", emoji: "🥕", category: "根菜", season: "春・秋", waterEvery: 3, sun: "日なた",
    tip: "発芽までは土を乾かさないのがコツ。発芽後は間引いて1本立ちに。土寄せで青首防止。", days: 110, feed: { n: 3, p: 4, k: 7 },
    varieties: [
      { id: "gosun", name: "五寸にんじん", days: 110, tip: "標準サイズの定番。発芽が命なので種まき後は乾かさない。間引きで形よく太る。" },
      { id: "mini", name: "ミニキャロット", days: 70, tip: "プランター向きの短根種。浅い容器でもOK。密植気味でも育つので家庭菜園に最適。" },
    ] },
  { id: "shiso", name: "シソ", emoji: "🌱", category: "ハーブ", season: "夏", waterEvery: 2, sun: "半日陰OK",
    tip: "日本の夏に最強。こぼれ種でも増える。摘心で葉を増やし、花穂も薬味に使える。", days: 50, feed: { n: 5, p: 2, k: 3 },
    varieties: [
      { id: "green", name: "青じそ（大葉）", days: 50, tip: "薬味の定番。摘心で次々と脇芽が出る。乾燥に注意すれば真夏もぐんぐん育つ。" },
      { id: "red", name: "赤じそ", days: 55, tip: "梅干しや赤しそジュース用。葉が赤紫。日当たりが良いほど発色が濃くなる。" },
    ] },
];

/* 土タイプ */
const SOIL_TYPES = [
  { id: "planter", label: "プランター", emoji: "🪴", hasNutrient: true,
    desc: "ベランダや玄関先で手軽に。土の量が限られるので追肥がカギ。" },
  { id: "field", label: "畑（地植え）", emoji: "🌾", hasNutrient: true,
    desc: "根を広く張れて大きく育つ。連作障害に注意し、輪作・堆肥で地力を保つ。" },
  { id: "hydro", label: "水耕栽培", emoji: "💧", hasNutrient: false,
    desc: "土を使わず液体肥料で育てる。清潔で病害虫が少ない。葉物やハーブが得意。" },
];
const soilType = (id) => SOIL_TYPES.find((s) => s.id === id) || SOIL_TYPES[0];

/* 作物カテゴリ（分類フィルタ用） */
const CATEGORIES = ["すべて", "果菜", "葉物", "根菜", "ハーブ", "果物"];

const WEATHER = [
  { id: "sunny", label: "晴れ", icon: Sun, mult: 1.0, color: "#e0a32e" },
  { id: "cloudy", label: "くもり", icon: Cloud, mult: 1.3, color: "#9aa5ad" },
  { id: "rainy", label: "雨", icon: CloudRain, mult: 2.5, color: "#5b8aa6" },
  { id: "hot", label: "猛暑", icon: Flame, mult: 0.6, color: "#d2603a" },
  { id: "windy", label: "強風", icon: Wind, mult: 0.85, color: "#88a08a" },
  { id: "cold", label: "寒い", icon: Snowflake, mult: 1.8, color: "#7fa8c9" },
];

const LEVELS = [
  { lv: 1, title: "種まきびと", min: 0 },
  { lv: 2, title: "芽吹きの見習い", min: 50 },
  { lv: 3, title: "土いじり名人", min: 150 },
  { lv: 4, title: "緑の指", min: 350 },
  { lv: 5, title: "収穫の達人", min: 700 },
  { lv: 6, title: "大地のマエストロ", min: 1200 },
];

const BADGES = [
  { id: "first", name: "はじめの一粒", emoji: "🌱", desc: "最初の作物を植えた" },
  { id: "water10", name: "水やり10回", emoji: "💧", desc: "水やりを10回達成" },
  { id: "streak7", name: "7日連続", emoji: "🔥", desc: "7日連続で世話をした" },
  { id: "variety5", name: "彩りの庭", emoji: "🌈", desc: "5種類の作物を育てた" },
  { id: "harvest", name: "初収穫", emoji: "🧺", desc: "はじめて収穫した" },
  { id: "green", name: "緑の指", emoji: "✨", desc: "レベル4に到達" },
];

const STORE_KEY = "homefarm:v1";
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) =>
  Math.floor((new Date(b) - new Date(a)) / 86400000);

/* 土区画のデフォルト（栄養は満タン100からスタート） */
let bedSeq = 0;
const defaultBed = () => ({
  id: "bed_" + Date.now() + "_" + (bedSeq++),
  name: "プランターA",
  type: "planter", // planter / field / hydro
  uses: 0,        // この土で何作連続で育てたか
  n: 100, p: 100, k: 100, // 窒素・リン酸・カリの残量(0〜100)
});
const newBed = (name, type = "planter") => ({ ...defaultBed(), name, type });

const NUTRIENTS = [
  { key: "n", label: "窒素", short: "N", color: "#5a9b4f", role: "葉を育てる" },
  { key: "p", label: "リン酸", short: "P", color: "#c98b3a", role: "花・実をつける" },
  { key: "k", label: "カリ", short: "K", color: "#5b8aa6", role: "根を丈夫に" },
];

// 土の地力スコア（平均残量）から状態ラベルを返す
const soilHealth = (bed) => {
  const avg = (bed.n + bed.p + bed.k) / 3;
  if (avg >= 70) return { label: "肥沃", color: "#5a9b4f", advice: "良い状態です。このまま栽培OK。" };
  if (avg >= 45) return { label: "やや痩せ気味", color: "#c9a23a", advice: "追肥（液肥や化成肥料）を足すと安心。" };
  if (avg >= 25) return { label: "痩せている", color: "#cc7a33", advice: "堆肥をすき込み、不足の栄養を補給して。" };
  return { label: "要・土替え", color: "#c0432a", advice: "連用しすぎ。土をリフレッシュしましょう。" };
};

/* ============================================================
   メインコンポーネント
   ============================================================ */
export default function HomeFarmApp() {
  const [plants, setPlants] = useState([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastCareDate, setLastCareDate] = useState(null);
  const [waterCount, setWaterCount] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [weather, setWeather] = useState("sunny");
  const [autoWeather, setAutoWeather] = useState(false); // 位置情報による天気自動取得のオン/オフ（設定として永続化）
  const [beds, setBeds] = useState([]);            // 土の区画（鉢/畝）: {id,name,uses,n,p,k}
  const [harvestLog, setHarvestLog] = useState([]); // 収穫履歴
  const [notifyOn, setNotifyOn] = useState(false);  // 水やり通知のオン/オフ
  const [notifyTime, setNotifyTime] = useState("07:00"); // 通知時刻
  const [lastNotifyDate, setLastNotifyDate] = useState(null); // 当日重複通知防止
  const [loaded, setLoaded] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState(null);
  const [badgePopup, setBadgePopup] = useState(null);
  const [fetchingWx, setFetchingWx] = useState(false); // 取得中インジケータ（位置情報は保持しない）

  /* ---- 永続化: 読み込み ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORE_KEY);
        if (res && res.value) {
          const d = JSON.parse(res.value);
          const migratedPlants = (d.plants || []).map((p) => {
            const crop = CROP_DB.find((c) => c.id === p.cropId);
            const vid = p.varietyId || (crop ? crop.varieties[0].id : null);
            const v = crop && crop.varieties.find((x) => x.id === vid);
            return {
              ...p,
              varietyId: vid,
              projectName: p.projectName || (crop ? `${crop.name}（${v ? v.name : ""}）` : "作物"),
            };
          });
          setPlants(migratedPlants);
          setXp(d.xp || 0);
          setStreak(d.streak || 0);
          setLastCareDate(d.lastCareDate || null);
          setWaterCount(d.waterCount || 0);
          setEarnedBadges(d.earnedBadges || []);
          setWeather(d.weather || "sunny");
          setAutoWeather(!!d.autoWeather);
          setBeds(
            d.beds && d.beds.length
              ? d.beds.map((b) => ({ type: "planter", ...b }))
              : [defaultBed()]
          );
          setHarvestLog(d.harvestLog || []);
          setNotifyOn(!!d.notifyOn);
          setNotifyTime(d.notifyTime || "07:00");
          setLastNotifyDate(d.lastNotifyDate || null);
        } else {
          setBeds([defaultBed()]);
        }
      } catch (e) {
        setBeds((b) => (b.length ? b : [defaultBed()]));
      }
      setLoaded(true);
    })();
  }, []);

  /* ---- 永続化: 保存 ---- */
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(
          STORE_KEY,
          JSON.stringify({
            plants, xp, streak, lastCareDate, waterCount, earnedBadges, weather, autoWeather,
            beds, harvestLog, notifyOn, notifyTime, lastNotifyDate,
          })
        );
      } catch (e) {
        console.error("保存に失敗しました", e);
      }
    })();
  }, [plants, xp, streak, lastCareDate, waterCount, earnedBadges, weather, autoWeather,
      beds, harvestLog, notifyOn, notifyTime, lastNotifyDate, loaded]);

  const level = useMemo(() => {
    let cur = LEVELS[0];
    for (const l of LEVELS) if (xp >= l.min) cur = l;
    return cur;
  }, [xp]);
  const nextLevel = useMemo(
    () => LEVELS.find((l) => l.min > xp) || null,
    [xp]
  );
  const weatherObj = WEATHER.find((w) => w.id === weather);

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  /* ---- 位置情報を一時取得 → 天気を自動判定 → 位置情報は即破棄 ----
     緯度経度はstateにもstorageにも一切保存しない。関数スコープ内だけで使い捨て。 */
  const fetchWeatherByLocation = useCallback(() => {
    if (!autoWeather) return;
    if (!("geolocation" in navigator)) {
      flashToast("⚠️ この端末は位置情報に未対応です");
      return;
    }
    setFetchingWx(true);

    const finish = (msg) => {
      setFetchingWx(false);
      if (msg) flashToast(msg);
    };

    // 天気コード → アプリ内の天候IDへ変換（Open-Meteo WMO weather code準拠）
    const codeToWeather = (code, temp) => {
      if (temp >= 33) return "hot";
      if (temp <= 4) return "cold";
      if ([0, 1].includes(code)) return "sunny";
      if ([2, 3, 45, 48].includes(code)) return "cloudy";
      if (code >= 51) return "rainy"; // 霧雨〜雨〜雪〜雷雨はまとめて雨扱い（水やり多め補正）
      return "sunny";
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // ↓ この lat/lon はここでしか使わず、取得後どこにも残さない
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const url =
            "https://api.open-meteo.com/v1/forecast?latitude=" +
            lat.toFixed(2) +
            "&longitude=" +
            lon.toFixed(2) +
            "&current=temperature_2m,weather_code";
          const r = await fetch(url);
          const j = await r.json();
          const code = j?.current?.weather_code ?? 0;
          const temp = j?.current?.temperature_2m ?? 20;
          const wid = codeToWeather(code, temp);
          const wlabel = WEATHER.find((w) => w.id === wid)?.label || "晴れ";
          setWeather(wid);
          finish(`📍 天気を自動入力：${wlabel}（位置情報はオフにしました）`);
        } catch (e) {
          finish("⚠️ 天気の取得に失敗。手動で選んでください");
        }
        // lat/lon はこの時点でスコープを抜け破棄される
      },
      () => {
        finish("⚠️ 位置情報を取得できませんでした。手動で選んでください");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
    );
  }, [autoWeather, flashToast]);

  /* ---- 水やり通知：許可をリクエスト ---- */
  const requestNotify = useCallback(async () => {
    if (!("Notification" in window)) {
      flashToast("⚠️ この端末は通知に未対応です");
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotifyOn(true);
        flashToast(`🔔 ${notifyTime} に水やり通知します`);
        return true;
      }
      flashToast("通知が許可されませんでした");
      return false;
    } catch {
      // 一部環境では同期版
      flashToast("⚠️ 通知を有効にできませんでした");
      return false;
    }
  }, [notifyTime, flashToast]);

  /* ---- 水やり通知：指定時刻になったら、水やりが必要な株があれば通知 ---- */
  useEffect(() => {
    if (!loaded || !notifyOn) return;
    const tick = () => {
      const now = new Date();
      const hhmm =
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0");
      const t = todayStr();
      if (hhmm === notifyTime && lastNotifyDate !== t) {
        const due = plants.filter((p) => computeStatus(p).due);
        setLastNotifyDate(t); // 当日は一度だけ
        if (due.length > 0) {
          const names = due
            .map((p) => CROP_DB.find((c) => c.id === p.cropId)?.name)
            .filter(Boolean)
            .join("、");
          const body = `${due.length}株が水やり待ちです：${names}`;
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("🌱 水やりの時間です", { body });
            } catch {
              flashToast("💧 " + body);
            }
          } else {
            flashToast("💧 " + body);
          }
        }
      }
    };
    const iv = setInterval(tick, 30000); // 30秒ごとに時刻チェック
    tick();
    return () => clearInterval(iv);
  }, [loaded, notifyOn, notifyTime, lastNotifyDate, plants, weather, flashToast]);

  const grantBadge = useCallback((id) => {
    setEarnedBadges((prev) => {
      if (prev.includes(id)) return prev;
      const b = BADGES.find((x) => x.id === id);
      if (b) setBadgePopup(b);
      return [...prev, id];
    });
  }, []);

  /* ---- ケア共通処理（XP・連続日数） ---- */
  const registerCare = useCallback((gainedXp) => {
    const t = todayStr();
    setXp((x) => {
      const nx = x + gainedXp;
      if (nx >= 350) grantBadge("green");
      return nx;
    });
    setStreak((s) => {
      if (lastCareDate === t) return s;
      const gap = lastCareDate ? daysBetween(lastCareDate, t) : 999;
      const ns = gap === 1 ? s + 1 : 1;
      if (ns >= 7) grantBadge("streak7");
      return ns;
    });
    setLastCareDate(t);
  }, [lastCareDate, grantBadge]);

  /* ---- 作物を追加：プロジェクト（品種・名前・土区画） ---- */
  const addPlant = (cropId, varietyId, projectName, plantedDate, bedId) => {
    const crop = CROP_DB.find((c) => c.id === cropId);
    const variety = crop.varieties.find((v) => v.id === varietyId) || crop.varieties[0];
    const np = {
      uid: Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      cropId,
      varietyId: variety.id,
      projectName: projectName && projectName.trim() ? projectName.trim() : `${crop.name}（${variety.name}）`,
      plantedDate,
      lastWater: null,
      bedId,
    };
    setPlants((prev) => {
      const next = [...prev, np];
      if (next.length === 1) grantBadge("first");
      const kinds = new Set(next.map((p) => p.cropId));
      if (kinds.size >= 5) grantBadge("variety5");
      return next;
    });
    registerCare(15);
    flashToast(`${crop.emoji} 「${np.projectName}」を植えました！ +15XP`);
    setShowAdd(false);
  };

  /* ---- 水やり ---- */
  const waterPlant = (uid) => {
    setPlants((prev) =>
      prev.map((p) => (p.uid === uid ? { ...p, lastWater: todayStr() } : p))
    );
    setWaterCount((c) => {
      const nc = c + 1;
      if (nc >= 10) grantBadge("water10");
      return nc;
    });
    registerCare(8);
    flashToast("💧 水やり完了！ +8XP");
  };

  /* ---- 収穫：履歴に記録 → 土の栄養を消費＆連用回数+1（水耕は栄養消費なし） ---- */
  const harvestPlant = (uid) => {
    const p = plants.find((x) => x.uid === uid);
    if (!p) return;
    const crop = CROP_DB.find((c) => c.id === p.cropId);
    const variety = crop.varieties.find((v) => v.id === p.varietyId);
    const bed = beds.find((b) => b.id === p.bedId);
    const st = bed ? soilType(bed.type) : null;

    // 収穫履歴に追加
    setHarvestLog((prev) => [
      {
        id: "h_" + Date.now(),
        cropId: p.cropId,
        cropName: crop.name,
        varietyName: variety ? variety.name : "",
        projectName: p.projectName,
        emoji: crop.emoji,
        bedName: bed ? bed.name : "（不明な区画）",
        soilLabel: st ? st.label : "",
        plantedDate: p.plantedDate,
        harvestDate: todayStr(),
        days: daysBetween(p.plantedDate, todayStr()),
      },
      ...prev,
    ]);

    // 土の栄養を消費し連用回数+1（栄養を持つ土タイプのみ）
    if (bed && st && st.hasNutrient) {
      setBeds((prev) =>
        prev.map((b) =>
          b.id === bed.id
            ? {
                ...b,
                uses: b.uses + 1,
                n: Math.max(0, b.n - crop.feed.n * 1.4),
                p: Math.max(0, b.p - crop.feed.p * 1.4),
                k: Math.max(0, b.k - crop.feed.k * 1.4),
              }
            : b
        )
      );
    } else if (bed) {
      // 水耕も使用回数だけは記録
      setBeds((prev) => prev.map((b) => (b.id === bed.id ? { ...b, uses: b.uses + 1 } : b)));
    }

    setPlants((prev) => prev.filter((x) => x.uid !== uid));
    grantBadge("harvest");
    registerCare(30);
    flashToast(`🧺 「${p.projectName}」を収穫！履歴に記録 +30XP`);
  };

  /* ---- 土をリフレッシュ（土替え・堆肥）：栄養回復＆連用リセット ---- */
  const refreshBed = (bedId) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.id === bedId ? { ...b, uses: 0, n: 100, p: 100, k: 100 } : b
      )
    );
    registerCare(10);
    const b = beds.find((x) => x.id === bedId);
    const isHydro = b && soilType(b.type).id === "hydro";
    flashToast(isHydro ? "♻️ 培養液を交換しました！ +10XP" : "♻️ 土をリフレッシュしました！ +10XP");
  };

  /* ---- 土区画を追加（土タイプ指定） ---- */
  const addBed = (type = "planter", name) => {
    const st = soilType(type);
    const sameType = beds.filter((b) => b.type === type).length;
    const label = String.fromCharCode(65 + sameType); // 同タイプ内でA,B,C...
    const finalName = name && name.trim() ? name.trim() : `${st.label}${label}`;
    setBeds((prev) => [...prev, newBed(finalName, type)]);
    flashToast(`${st.emoji} 「${finalName}」を追加しました`);
  };

  /* ---- 各株の水やり状態を計算（品種ごとのdaysを使用） ---- */
  const computeStatus = (p) => {
    const crop = CROP_DB.find((c) => c.id === p.cropId);
    const variety = crop.varieties.find((v) => v.id === p.varietyId) || crop.varieties[0];
    const cropDays = variety.days || crop.days;
    const baseEvery = crop.waterEvery;
    const adjusted = Math.max(1, Math.round(baseEvery * weatherObj.mult));
    const ref = p.lastWater || p.plantedDate;
    const since = daysBetween(ref, todayStr());
    const due = since >= adjusted;
    const urgent = since >= adjusted + 1;
    const grow = Math.min(100, Math.round((daysBetween(p.plantedDate, todayStr()) / cropDays) * 100));
    return { crop, variety, adjusted, since, due, urgent, grow };
  };

  const dueList = plants.filter((p) => computeStatus(p).due);

  if (!loaded) {
    return (
      <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6b7d5a", fontFamily: "var(--body)" }}>
          <Sprout size={40} style={{ animation: "sway 1.5s ease-in-out infinite" }} />
        </div>
        <StyleTag />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <StyleTag />

      {/* ===== ヘッダー ===== */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <div style={styles.brandMark}><Sprout size={26} color="#fff" /></div>
            <div>
              <h1 style={styles.brandTitle}>そだてる庭</h1>
              <p style={styles.brandSub}>HOME FARM ALMANAC</p>
            </div>
          </div>

          {/* 天候セレクタ */}
          <div style={styles.weatherBox}>
            <span style={styles.weatherLabel}>今日の天気</span>
            <div style={styles.weatherRow}>
              {WEATHER.map((w) => {
                const Icon = w.icon;
                const active = w.id === weather;
                return (
                  <button
                    key={w.id}
                    onClick={() => setWeather(w.id)}
                    title={w.label}
                    style={{
                      ...styles.weatherBtn,
                      background: active ? w.color : "transparent",
                      borderColor: active ? w.color : "rgba(255,255,255,.25)",
                      transform: active ? "translateY(-2px)" : "none",
                    }}
                  >
                    <Icon size={18} color={active ? "#fff" : "rgba(255,255,255,.7)"} />
                  </button>
                );
              })}
            </div>

            {/* 位置情報による天気自動取得：設定トグル＋取得ボタン */}
            <div style={styles.autoWxRow}>
              <button
                onClick={() => setAutoWeather((v) => !v)}
                style={styles.autoToggle}
                title="位置情報による天気の自動取得をオン/オフ"
              >
                <span
                  style={{
                    ...styles.toggleTrack,
                    background: autoWeather ? "#7fb04f" : "rgba(255,255,255,.2)",
                  }}
                >
                  <span
                    style={{
                      ...styles.toggleKnob,
                      transform: autoWeather ? "translateX(16px)" : "translateX(0)",
                    }}
                  />
                </span>
                <span style={styles.autoToggleLabel}>位置情報で自動取得</span>
              </button>

              {autoWeather && (
                <button
                  onClick={fetchWeatherByLocation}
                  disabled={fetchingWx}
                  style={{ ...styles.autoFetchBtn, opacity: fetchingWx ? 0.6 : 1 }}
                >
                  {fetchingWx ? "取得中…" : "📍 今すぐ取得"}
                </button>
              )}
            </div>
            {autoWeather && (
              <span style={styles.autoNote}>
                取得時のみ位置情報を使い、直後にオフにします
              </span>
            )}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* ===== ステータスバー ===== */}
        <section style={styles.statRow}>
          <div style={styles.levelCard}>
            <div style={styles.levelTop}>
              <div>
                <div style={styles.levelLv}>Lv.{level.lv}</div>
                <div style={styles.levelTitle}>{level.title}</div>
              </div>
              <Trophy size={30} color="#c98b3a" />
            </div>
            <div style={styles.xpTrack}>
              <div
                style={{
                  ...styles.xpFill,
                  width: nextLevel
                    ? `${Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100)}%`
                    : "100%",
                }}
              />
            </div>
            <div style={styles.xpText}>
              {xp} XP {nextLevel ? `／ 次まで ${nextLevel.min - xp}` : "（最高ランク！）"}
            </div>
          </div>

          <div style={styles.miniStat}>
            <Flame size={22} color="#d2603a" />
            <div style={styles.miniNum}>{streak}</div>
            <div style={styles.miniLabel}>連続日数</div>
          </div>
          <div style={styles.miniStat}>
            <Droplets size={22} color="#5b8aa6" />
            <div style={styles.miniNum}>{waterCount}</div>
            <div style={styles.miniLabel}>水やり回数</div>
          </div>
          <div style={styles.miniStat}>
            <Leaf size={22} color="#6b9d4f" />
            <div style={styles.miniNum}>{plants.length}</div>
            <div style={styles.miniLabel}>育成中</div>
          </div>
        </section>

        {/* ===== 水やりアラート ===== */}
        {dueList.length > 0 && (
          <section style={styles.alertBox}>
            <div style={styles.alertHead}>
              <Droplets size={20} color="#fff" />
              <span>水やりのタイミングです（{weatherObj.label}補正済み）</span>
            </div>
            <div style={styles.alertChips}>
              {dueList.map((p) => {
                const { crop, urgent } = computeStatus(p);
                return (
                  <button
                    key={p.uid}
                    onClick={() => waterPlant(p.uid)}
                    style={{
                      ...styles.alertChip,
                      background: urgent ? "#c0432a" : "#fff",
                      color: urgent ? "#fff" : "#3d5236",
                    }}
                  >
                    <span>{crop.emoji} {crop.name}</span>
                    {urgent && <span style={styles.urgentTag}>急ぎ</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== 水やり通知設定 ===== */}
        <section style={styles.notifyCard}>
          <div style={styles.notifyLeft}>
            {notifyOn ? <Bell size={20} color="#c98b3a" /> : <BellOff size={20} color="#9aa089" />}
            <div>
              <div style={styles.notifyTitle}>水やり通知</div>
              <div style={styles.notifySub}>
                {notifyOn ? `毎日 ${notifyTime} に必要な株をお知らせ` : "オフ"}
              </div>
            </div>
          </div>
          <div style={styles.notifyRight}>
            <label style={styles.timeWrap}>
              <Clock size={14} color="#9aa089" />
              <input
                type="time"
                value={notifyTime}
                onChange={(e) => setNotifyTime(e.target.value)}
                style={styles.timeInput}
              />
            </label>
            <button
              onClick={() => (notifyOn ? setNotifyOn(false) : requestNotify())}
              style={{
                ...styles.notifyToggleBtn,
                background: notifyOn ? "#c98b3a" : "#6b9d4f",
              }}
            >
              {notifyOn ? "オフにする" : "オンにする"}
            </button>
          </div>
        </section>

        {/* ===== 土の区画と栄養の可視化 ===== */}
        <section style={{ marginTop: 26 }}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}><Mountain size={20} color="#9c7a4a" /> 育てる場所の状態</h2>
            <button style={styles.histBtn} onClick={() => setShowAdd(true)}>
              <Plus size={16} /> 場所を追加
            </button>
          </div>
          <div style={styles.bedGrid}>
            {beds.map((b) => {
              const st = soilType(b.type);
              const h = soilHealth(b);
              const planted = plants.filter((p) => p.bedId === b.id).length;
              const accent = st.hasNutrient ? h.color : "#5b8aa6";
              return (
                <article key={b.id} style={{ ...styles.bedCard, borderColor: accent + "55" }}>
                  <div style={styles.bedHead}>
                    <div>
                      <div style={styles.bedName}>{st.emoji} {b.name}</div>
                      <div style={styles.bedSub}>{st.label} ・ 育成中 {planted} 株</div>
                    </div>
                    {st.hasNutrient ? (
                      <div style={{ ...styles.bedHealthBadge, background: h.color }}>{h.label}</div>
                    ) : (
                      <div style={{ ...styles.bedHealthBadge, background: "#5b8aa6" }}>水耕</div>
                    )}
                  </div>

                  {/* 連用回数 */}
                  <div style={styles.usesRow}>
                    <RotateCcw size={13} color="#9c7a4a" />
                    <span>ここで <b style={{ color: b.uses >= 4 && st.hasNutrient ? "#c0432a" : "#7a6a45" }}>{b.uses}回</b> 連続栽培</span>
                    {b.uses >= 4 && st.hasNutrient && <span style={styles.usesWarn}>使いすぎ</span>}
                  </div>

                  {st.hasNutrient ? (
                    <>
                      {/* NPK 栄養バー */}
                      <div style={styles.npkBox}>
                        {NUTRIENTS.map((nut) => {
                          const val = Math.round(b[nut.key]);
                          return (
                            <div key={nut.key} style={styles.npkRow}>
                              <span style={{ ...styles.npkBadge, background: nut.color }}>{nut.short}</span>
                              <div style={styles.npkInfo}>
                                <div style={styles.npkLabelRow}>
                                  <span style={styles.npkLabel}>{nut.label}<span style={styles.npkRole}>（{nut.role}）</span></span>
                                  <span style={{ ...styles.npkVal, color: val < 30 ? "#c0432a" : "#7a6a45" }}>{val}</span>
                                </div>
                                <div style={styles.npkTrack}>
                                  <div style={{ ...styles.npkFill, width: `${val}%`, background: nut.color }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ ...styles.soilAdvice, color: h.color }}>
                        <Beaker size={13} /> {h.advice}
                      </div>
                      {(h.label !== "肥沃" || b.uses > 0) && (
                        <button style={styles.refreshBtn} onClick={() => refreshBed(b.id)}>
                          <RotateCcw size={15} /> 土をリフレッシュ（堆肥・土替え）
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* 水耕栽培：栄養は液肥で管理 */}
                      <div style={styles.hydroBox}>
                        <Droplets size={15} color="#5b8aa6" />
                        <span>培養液で栄養を管理します。土の栄養消費はありません。週1回ほど液を交換し、EC・pHを保つと安定します。</span>
                      </div>
                      <button style={{ ...styles.refreshBtn, color: "#3f6f87", borderColor: "#cfe0e8", background: "#eef5f8" }} onClick={() => refreshBed(b.id)}>
                        <RotateCcw size={15} /> 培養液を交換
                      </button>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== 育成中の作物 ===== */}
        <section>
          <div style={{ ...styles.sectionHead, marginTop: 26 }}>
            <h2 style={styles.sectionTitle}><Sprout size={20} color="#6b9d4f" /> 育てている作物</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.histBtn} onClick={() => setShowHistory(true)}>
                <History size={16} /> 履歴{harvestLog.length > 0 ? `(${harvestLog.length})` : ""}
              </button>
              <button style={styles.addBtn} onClick={() => setShowAdd(true)}>
                <Plus size={18} /> 植える
              </button>
            </div>
          </div>

          {plants.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🪴</div>
              <p style={styles.emptyText}>まだ何も植えていません。</p>
              <button style={styles.addBtnBig} onClick={() => setShowAdd(true)}>
                <Plus size={18} /> 最初の一株を植える
              </button>
            </div>
          ) : (
            <div style={styles.grid}>
              {plants.map((p) => {
                const { crop, variety, adjusted, since, due, urgent, grow } = computeStatus(p);
                const bed = beds.find((x) => x.id === p.bedId);
                const st = bed ? soilType(bed.type) : null;
                return (
                  <article key={p.uid} style={{ ...styles.card, borderColor: urgent ? "#c0432a" : due ? "#d8a93f" : "#e3ddcf" }}>
                    <div style={styles.cardTop}>
                      <div style={styles.cropEmoji}>{crop.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={styles.cropName}>{p.projectName}</h3>
                        <div style={styles.tagRow}>
                          <span style={styles.catTag}>{crop.category}</span>
                          <span style={styles.varTagSm}>{crop.name}・{variety.name}</span>
                        </div>
                        <div style={styles.cropMeta}>
                          <Sun size={12} /> {crop.sun}
                          {bed && (
                            <span style={styles.bedTag}>{st.emoji} {bed.name}</span>
                          )}
                        </div>
                      </div>
                      <button style={styles.iconBtn} title="収穫する" onClick={() => harvestPlant(p.uid)}>
                        🧺
                      </button>
                    </div>

                    {/* 成長バー */}
                    <div style={styles.growRow}>
                      <span style={styles.growLabel}>成長</span>
                      <div style={styles.growTrack}>
                        <div style={{ ...styles.growFill, width: `${grow}%` }} />
                      </div>
                      <span style={styles.growPct}>{grow}%</span>
                    </div>

                    {/* 水やり状態 */}
                    <div
                      style={{
                        ...styles.waterStatus,
                        background: urgent ? "#fbe9e4" : due ? "#fdf4e0" : "#eef4e6",
                        color: urgent ? "#9c2e1a" : due ? "#8a6315" : "#4a6b3a",
                      }}
                    >
                      <Droplets size={15} />
                      {due
                        ? urgent
                          ? `${since}日 水やりなし — 急いで！`
                          : "そろそろ水やりを"
                        : `あと約${adjusted - since}日でOK`}
                    </div>

                    {due && (
                      <button style={styles.waterBtn} onClick={() => waterPlant(p.uid)}>
                        <Droplets size={16} /> 水やりする
                      </button>
                    )}

                    {/* 品種別ワンポイント */}
                    <div style={styles.tip}>
                      <Star size={13} color="#c98b3a" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span><b style={{ color: "#8a6a3a" }}>{variety.name}：</b>{variety.tip}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ===== バッジ ===== */}
        <section style={{ marginTop: 32 }}>
          <h2 style={styles.sectionTitle}><Award size={20} color="#c98b3a" /> 実績バッジ</h2>
          <div style={styles.badgeGrid}>
            {BADGES.map((b) => {
              const got = earnedBadges.includes(b.id);
              return (
                <div key={b.id} style={{ ...styles.badge, opacity: got ? 1 : 0.42, filter: got ? "none" : "grayscale(1)" }}>
                  <div style={styles.badgeEmoji}>{b.emoji}</div>
                  <div style={styles.badgeName}>{b.name}</div>
                  <div style={styles.badgeDesc}>{b.desc}</div>
                  {got && <div style={styles.badgeGot}><Check size={12} /> 獲得</div>}
                </div>
              );
            })}
          </div>
        </section>

        <footer style={styles.footer}>
          🌾 データはこの端末に自動保存されます。次に開いても続きから育てられます。
        </footer>
      </main>

      {/* ===== 追加モーダル ===== */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onAdd={addPlant}
          beds={beds}
          onAddBed={addBed}
        />
      )}

      {showHistory && (
        <HistoryModal onClose={() => setShowHistory(false)} log={harvestLog} />
      )}

      {/* ===== トースト ===== */}
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* ===== バッジ獲得ポップアップ ===== */}
      {badgePopup && (
        <div style={styles.popupOverlay} onClick={() => setBadgePopup(null)}>
          <div style={styles.popupCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.popupBurst}>{badgePopup.emoji}</div>
            <div style={styles.popupTitle}>バッジ獲得！</div>
            <div style={styles.popupName}>{badgePopup.name}</div>
            <div style={styles.popupDesc}>{badgePopup.desc}</div>
            <button style={styles.popupBtn} onClick={() => setBadgePopup(null)}>やったー！</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   作物追加モーダル
   ============================================================ */
function AddModal({ onClose, onAdd, beds, onAddBed }) {
  const [step, setStep] = useState(1);        // 1:土 2:作物 3:品種&詳細
  const [bedId, setBedId] = useState(beds[0]?.id || null);
  const [cropId, setCropId] = useState(null);
  const [varietyId, setVarietyId] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState(todayStr());
  const [cat, setCat] = useState("すべて");
  const [newBedType, setNewBedType] = useState("planter");

  // 新しく区画が追加されたら自動選択
  useEffect(() => {
    if (beds.length && !beds.find((b) => b.id === bedId)) {
      setBedId(beds[beds.length - 1].id);
    }
  }, [beds, bedId]);

  const crop = cropId ? CROP_DB.find((c) => c.id === cropId) : null;
  const variety = crop && varietyId ? crop.varieties.find((v) => v.id === varietyId) : null;
  const filteredCrops = cat === "すべて" ? CROP_DB : CROP_DB.filter((c) => c.category === cat);
  const selectedBed = beds.find((b) => b.id === bedId);

  const StepDot = ({ n, label }) => (
    <div style={styles.stepDot}>
      <span style={{ ...styles.stepNum, background: step >= n ? "#6b9d4f" : "#d6cfbb" }}>
        {step > n ? <Check size={13} /> : n}
      </span>
      <span style={{ ...styles.stepLabel, color: step >= n ? "#3d4a35" : "#a8ac98" }}>{label}</span>
    </div>
  );

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <h2 style={styles.modalTitle}>🌱 新しいプロジェクト</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {/* ステップ表示 */}
        <div style={styles.stepBar}>
          <StepDot n={1} label="土を選ぶ" />
          <ChevronRight size={14} color="#c9c2af" />
          <StepDot n={2} label="作物を選ぶ" />
          <ChevronRight size={14} color="#c9c2af" />
          <StepDot n={3} label="品種・詳細" />
        </div>

        {/* ===== STEP 1: 土タイプと区画 ===== */}
        {step === 1 && (
          <div>
            <div style={styles.stepHint}>育てる場所（土）を選びます</div>

            <div style={styles.bedList}>
              {beds.map((b) => {
                const st = soilType(b.type);
                const active = b.id === bedId;
                const h = soilHealth(b);
                return (
                  <button
                    key={b.id}
                    onClick={() => setBedId(b.id)}
                    style={{
                      ...styles.bedRowPick,
                      borderColor: active ? "#6b9d4f" : "#e3ddcf",
                      background: active ? "#eef4e6" : "#fff",
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{st.emoji}</span>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={styles.bedPickName}>{b.name}</div>
                      <div style={styles.bedPickHealth2}>
                        {st.label}
                        {st.hasNutrient
                          ? ` ・ ${h.label}・連用${b.uses}回`
                          : ` ・ 培養液栽培`}
                      </div>
                    </div>
                    {active && <Check size={18} color="#6b9d4f" />}
                  </button>
                );
              })}
            </div>

            {/* 新しい区画を作る */}
            <div style={styles.newBedBox}>
              <div style={styles.newBedTitle}>＋ 新しい場所を追加</div>
              <div style={styles.soilTypeRow}>
                {SOIL_TYPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setNewBedType(s.id)}
                    style={{
                      ...styles.soilTypeBtn,
                      borderColor: newBedType === s.id ? "#6b9d4f" : "#e3ddcf",
                      background: newBedType === s.id ? "#eef4e6" : "#fff",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{s.emoji}</span>
                    <span style={styles.soilTypeLabel}>{s.label}</span>
                  </button>
                ))}
              </div>
              <p style={styles.soilTypeDesc}>{soilType(newBedType).desc}</p>
              <button style={styles.addBedConfirm} onClick={() => onAddBed(newBedType)}>
                <Plus size={15} /> この種類の場所を追加
              </button>
            </div>

            <button
              style={{ ...styles.confirmBtn, marginTop: 16 }}
              onClick={() => setStep(2)}
              disabled={!bedId}
            >
              次へ：作物を選ぶ <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ===== STEP 2: 作物種類（カテゴリフィルタ） ===== */}
        {step === 2 && (
          <div>
            <div style={styles.stepHint}>
              {selectedBed && (
                <span>{soilType(selectedBed.type).emoji} {selectedBed.name} に植える作物を選びます</span>
              )}
            </div>

            {/* カテゴリフィルタ */}
            <div style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{
                    ...styles.catChip,
                    background: cat === c ? "#3a5630" : "#fff",
                    color: cat === c ? "#fff" : "#5a6b4d",
                    borderColor: cat === c ? "#3a5630" : "#e3ddcf",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={styles.cropPicker}>
              {filteredCrops.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCropId(c.id);
                    setVarietyId(c.varieties[0].id);
                    setStep(3);
                  }}
                  style={{ ...styles.cropOption, borderColor: "#e3ddcf", background: "#fff" }}
                >
                  <span style={{ fontSize: 28 }}>{c.emoji}</span>
                  <span style={styles.cropOptName}>{c.name}</span>
                  <span style={styles.cropOptSeason}>{c.category}・{c.varieties.length}品種</span>
                </button>
              ))}
            </div>

            <button style={styles.backBtn} onClick={() => setStep(1)}>← 土を選び直す</button>
          </div>
        )}

        {/* ===== STEP 3: 品種選択 + 名前 + 日付 ===== */}
        {step === 3 && crop && (
          <div>
            <div style={styles.cropHeadRow}>
              <span style={{ fontSize: 32 }}>{crop.emoji}</span>
              <div>
                <div style={styles.cropHeadName}>{crop.name}</div>
                <div style={styles.cropOptSeason}>{crop.category}・{crop.season}</div>
              </div>
            </div>

            <div style={styles.varLabel}>品種を選ぶ</div>
            <div style={styles.varList}>
              {crop.varieties.map((v) => {
                const active = v.id === varietyId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVarietyId(v.id)}
                    style={{
                      ...styles.varCard,
                      borderColor: active ? "#6b9d4f" : "#e3ddcf",
                      background: active ? "#eef4e6" : "#fff",
                    }}
                  >
                    <div style={styles.varTop}>
                      <span style={styles.varName}>{v.name}</span>
                      <span style={styles.varDays}>約{v.days}日</span>
                    </div>
                    {active && <div style={styles.varTip}>💡 {v.tip}</div>}
                  </button>
                );
              })}
            </div>

            <label style={styles.dateLabel}>
              プロジェクト名（省略可）
              <input
                type="text"
                value={projectName}
                placeholder={variety ? `${crop.name}（${variety.name}）` : crop.name}
                onChange={(e) => setProjectName(e.target.value)}
                style={styles.dateInput}
              />
            </label>

            <label style={{ ...styles.dateLabel, marginTop: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={15} /> 種まき・植え付け日
              </span>
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                style={styles.dateInput}
              />
            </label>

            <button
              style={styles.confirmBtn}
              onClick={() => onAdd(cropId, varietyId, projectName, date, bedId)}
              disabled={!bedId || !varietyId}
            >
              このプロジェクトを始める <ChevronRight size={18} />
            </button>
            <button style={styles.backBtn} onClick={() => setStep(2)}>← 作物を選び直す</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   収穫履歴モーダル
   ============================================================ */
function HistoryModal({ onClose, log }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <h2 style={styles.modalTitle}>🧺 収穫の記録</h2>
          <button style={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        {log.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "#9aa089" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🌾</div>
            まだ収穫の記録はありません。<br />作物を育てて収穫しましょう。
          </div>
        ) : (
          <div style={styles.histList}>
            {log.map((h) => (
              <div key={h.id} style={styles.histItem}>
                <span style={styles.histEmoji}>{h.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.histName}>{h.projectName || h.cropName}</div>
                  <div style={styles.histMeta}>
                    {h.cropName}{h.varietyName ? `・${h.varietyName}` : ""}
                  </div>
                  <div style={styles.histMeta}>
                    {h.soilLabel ? `${h.soilLabel}・` : ""}{h.bedName}・{h.days}日で収穫
                  </div>
                </div>
                <div style={styles.histDate}>{h.harvestDate.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   スタイル
   ============================================================ */
function StyleTag() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&family=Yuji+Syuku&display=swap');
      :root {
        --display: 'Yuji Syuku', serif;
        --body: 'Zen Maru Gothic', sans-serif;
      }
      * { box-sizing: border-box; }
      @keyframes sway { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }
      @keyframes toastIn { from{opacity:0;transform:translate(-50%,20px)} to{opacity:1;transform:translate(-50%,0)} }
      @keyframes popIn { 0%{opacity:0;transform:scale(.7)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
      @keyframes burst { 0%{transform:scale(0) rotate(-20deg)} 60%{transform:scale(1.3) rotate(10deg)} 100%{transform:scale(1) rotate(0)} }
      input[type=date]::-webkit-calendar-picker-indicator { cursor:pointer; }
    `}</style>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 15% 0%, #f4efe2 0%, transparent 45%), radial-gradient(circle at 90% 10%, #eaf0df 0%, transparent 40%), #f7f3e9",
    fontFamily: "var(--body)",
    color: "#3d4a35",
    paddingBottom: 40,
  },
  /* header */
  header: {
    background: "linear-gradient(135deg, #4a6b3a 0%, #3a5630 100%)",
    borderBottom: "4px solid #2e4426",
    boxShadow: "0 4px 20px rgba(58,86,48,.25)",
  },
  headerInner: {
    maxWidth: 1100, margin: "0 auto", padding: "18px 22px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 16,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: {
    width: 46, height: 46, borderRadius: 14,
    background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandTitle: { margin: 0, fontFamily: "var(--display)", fontSize: 26, color: "#fff", letterSpacing: 1 },
  brandSub: { margin: 0, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,.55)", fontWeight: 700 },
  weatherBox: { textAlign: "right" },
  weatherLabel: { fontSize: 11, color: "rgba(255,255,255,.6)", display: "block", marginBottom: 5, letterSpacing: 1 },
  weatherRow: { display: "flex", gap: 6 },
  autoWxRow: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 9 },
  autoToggle: {
    display: "flex", alignItems: "center", gap: 7, background: "transparent",
    border: "none", cursor: "pointer", padding: 0,
  },
  toggleTrack: {
    width: 34, height: 18, borderRadius: 10, position: "relative",
    transition: "background .2s", display: "inline-block", flexShrink: 0,
  },
  toggleKnob: {
    position: "absolute", top: 2, left: 2, width: 14, height: 14, borderRadius: "50%",
    background: "#fff", transition: "transform .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
  },
  autoToggleLabel: { fontSize: 11.5, color: "rgba(255,255,255,.85)", fontWeight: 700 },
  autoFetchBtn: {
    background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.3)",
    color: "#fff", borderRadius: 9, padding: "5px 11px", fontFamily: "var(--body)",
    fontWeight: 700, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap",
  },
  autoNote: { display: "block", textAlign: "right", fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 5 },
  weatherBtn: {
    width: 38, height: 38, borderRadius: 10, border: "1.5px solid",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all .18s", backdropFilter: "blur(4px)",
  },
  main: { maxWidth: 1100, margin: "0 auto", padding: "26px 22px" },
  /* status */
  statRow: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 14, marginBottom: 26 },
  levelCard: {
    background: "#fff", borderRadius: 18, padding: "18px 20px",
    border: "1.5px solid #e8e1d0", boxShadow: "0 6px 18px rgba(120,110,80,.08)",
  },
  levelTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  levelLv: { fontFamily: "var(--display)", fontSize: 30, color: "#3a5630", lineHeight: 1 },
  levelTitle: { fontSize: 13, color: "#8a9479", marginTop: 4, fontWeight: 700 },
  xpTrack: { height: 10, background: "#eceadd", borderRadius: 6, marginTop: 14, overflow: "hidden" },
  xpFill: { height: "100%", background: "linear-gradient(90deg,#7fb04f,#c98b3a)", borderRadius: 6, transition: "width .5s" },
  xpText: { fontSize: 11.5, color: "#9aa089", marginTop: 6 },
  miniStat: {
    background: "#fff", borderRadius: 18, padding: "16px 10px",
    border: "1.5px solid #e8e1d0", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: "0 6px 18px rgba(120,110,80,.06)",
  },
  miniNum: { fontFamily: "var(--display)", fontSize: 26, color: "#3d4a35", lineHeight: 1 },
  miniLabel: { fontSize: 10.5, color: "#9aa089", fontWeight: 700 },
  /* alert */
  alertBox: {
    background: "linear-gradient(135deg,#5b8aa6,#456f87)", borderRadius: 18,
    padding: "16px 20px", marginBottom: 26, boxShadow: "0 8px 22px rgba(70,110,135,.3)",
  },
  alertHead: { display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 700, fontSize: 14.5, marginBottom: 12 },
  alertChips: { display: "flex", flexWrap: "wrap", gap: 8 },
  alertChip: {
    border: "none", borderRadius: 10, padding: "8px 14px", fontFamily: "var(--body)",
    fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
    boxShadow: "0 3px 8px rgba(0,0,0,.12)",
  },
  urgentTag: { fontSize: 10, background: "rgba(255,255,255,.25)", padding: "1px 6px", borderRadius: 6 },
  /* section */
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontFamily: "var(--display)", fontSize: 20, color: "#3a5630", margin: 0, display: "flex", alignItems: "center", gap: 8 },
  addBtn: {
    background: "#6b9d4f", color: "#fff", border: "none", borderRadius: 11,
    padding: "9px 16px", fontFamily: "var(--body)", fontWeight: 700, fontSize: 13.5,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
    boxShadow: "0 4px 12px rgba(107,157,79,.35)",
  },
  histBtn: {
    background: "#fff", color: "#7a6a45", border: "1.5px solid #e3ddcf", borderRadius: 11,
    padding: "9px 14px", fontFamily: "var(--body)", fontWeight: 700, fontSize: 13,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  },
  /* カード上のタグ */
  tagRow: { display: "flex", gap: 5, flexWrap: "wrap", margin: "3px 0 4px" },
  catTag: { background: "#3a5630", color: "#fff", borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700 },
  varTagSm: { background: "#f0ece0", color: "#8a6a3a", borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700 },
  /* ステップバー */
  stepBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 },
  stepDot: { display: "flex", alignItems: "center", gap: 6 },
  stepNum: {
    width: 22, height: 22, borderRadius: "50%", color: "#fff", fontSize: 12, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  stepLabel: { fontSize: 12, fontWeight: 700 },
  stepHint: { fontSize: 12.5, color: "#7a6a45", marginBottom: 14, fontWeight: 700 },
  /* STEP1 区画リスト */
  bedList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  bedRowPick: {
    display: "flex", alignItems: "center", gap: 12, border: "2px solid", borderRadius: 12,
    padding: "11px 14px", cursor: "pointer", transition: "all .15s", width: "100%",
  },
  bedPickName: { fontFamily: "var(--body)", fontWeight: 700, fontSize: 13.5, color: "#3d4a35" },
  bedPickHealth2: { fontSize: 10.5, color: "#9aa089", marginTop: 2 },
  newBedBox: { background: "#faf7ee", borderRadius: 14, padding: 14, border: "1.5px dashed #d6cfbb" },
  newBedTitle: { fontSize: 12.5, fontWeight: 700, color: "#7a6a45", marginBottom: 10 },
  soilTypeRow: { display: "flex", gap: 8, marginBottom: 8 },
  soilTypeBtn: {
    flex: 1, border: "2px solid", borderRadius: 11, padding: "10px 4px", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .15s",
  },
  soilTypeLabel: { fontSize: 11.5, fontWeight: 700, color: "#3d4a35" },
  soilTypeDesc: { fontSize: 11, color: "#9aa089", lineHeight: 1.5, margin: "0 0 10px" },
  addBedConfirm: {
    width: "100%", background: "#fff", border: "1.5px solid #d6cfbb", borderRadius: 10,
    padding: "9px 0", fontFamily: "var(--body)", fontWeight: 700, fontSize: 12.5, color: "#6b9d4f",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  /* カテゴリフィルタ */
  catRow: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 },
  catChip: {
    border: "1.5px solid", borderRadius: 20, padding: "6px 14px", fontFamily: "var(--body)",
    fontWeight: 700, fontSize: 12.5, cursor: "pointer", transition: "all .15s",
  },
  backBtn: {
    width: "100%", marginTop: 10, background: "transparent", border: "none", color: "#9aa089",
    fontFamily: "var(--body)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: "8px 0",
  },
  /* STEP3 品種 */
  cropHeadRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  cropHeadName: { fontFamily: "var(--display)", fontSize: 21, color: "#3a5630" },
  varLabel: { fontSize: 12.5, fontWeight: 700, color: "#5a6b4d", marginBottom: 8 },
  varList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  varCard: {
    border: "2px solid", borderRadius: 12, padding: "11px 14px", cursor: "pointer",
    textAlign: "left", transition: "all .15s",
  },
  varTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  varName: { fontFamily: "var(--body)", fontWeight: 700, fontSize: 14, color: "#3d4a35" },
  varDays: { fontSize: 11, color: "#9c7a4a", fontWeight: 700 },
  varTip: { fontSize: 11.5, color: "#7a6a45", lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #e0dccd" },
  /* 水耕 */
  hydroBox: {
    display: "flex", gap: 8, alignItems: "flex-start", background: "#eef5f8", borderRadius: 10,
    padding: "11px 13px", fontSize: 11.5, color: "#3f6f87", lineHeight: 1.6, border: "1px solid #d8e6ed",
  },
  bedTag: {
    display: "inline-flex", alignItems: "center", gap: 3, background: "#f0ece0",
    color: "#9c7a4a", borderRadius: 6, padding: "1px 7px", fontWeight: 700, fontSize: 10,
  },
  /* 通知 */
  notifyCard: {
    background: "#fff", borderRadius: 18, padding: "16px 20px", border: "1.5px solid #e8e1d0",
    boxShadow: "0 6px 18px rgba(120,110,80,.06)", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 14, flexWrap: "wrap",
  },
  notifyLeft: { display: "flex", alignItems: "center", gap: 12 },
  notifyTitle: { fontFamily: "var(--display)", fontSize: 17, color: "#3d4a35" },
  notifySub: { fontSize: 11.5, color: "#9aa089", marginTop: 2 },
  notifyRight: { display: "flex", alignItems: "center", gap: 10 },
  timeWrap: {
    display: "flex", alignItems: "center", gap: 6, background: "#faf7ee",
    border: "1.5px solid #e3ddcf", borderRadius: 10, padding: "7px 11px",
  },
  timeInput: { border: "none", background: "transparent", fontFamily: "var(--body)", fontSize: 14, color: "#3d4a35", outline: "none" },
  notifyToggleBtn: {
    color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px",
    fontFamily: "var(--body)", fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  /* 土の区画 */
  bedGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 },
  bedCard: {
    background: "#fff", borderRadius: 18, padding: 18, border: "2px solid #e3ddcf",
    boxShadow: "0 6px 18px rgba(120,110,80,.08)", display: "flex", flexDirection: "column", gap: 13,
  },
  bedHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bedName: { fontFamily: "var(--display)", fontSize: 18, color: "#3d4a35" },
  bedSub: { fontSize: 11, color: "#9aa089", marginTop: 2 },
  bedHealthBadge: { color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, fontWeight: 700 },
  usesRow: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7a6a45",
    background: "#faf6ea", borderRadius: 9, padding: "8px 11px", border: "1px solid #f0e8d2",
  },
  usesWarn: { marginLeft: "auto", background: "#fbe9e4", color: "#c0432a", borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 700 },
  npkBox: { display: "flex", flexDirection: "column", gap: 9 },
  npkRow: { display: "flex", alignItems: "center", gap: 10 },
  npkBadge: {
    width: 26, height: 26, borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  npkInfo: { flex: 1 },
  npkLabelRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 },
  npkLabel: { fontSize: 11.5, color: "#5a6b4d", fontWeight: 700 },
  npkRole: { fontSize: 9.5, color: "#a8ac98", fontWeight: 400 },
  npkVal: { fontSize: 12.5, fontWeight: 700 },
  npkTrack: { height: 7, background: "#eceadd", borderRadius: 4, overflow: "hidden" },
  npkFill: { height: "100%", borderRadius: 4, transition: "width .5s" },
  soilAdvice: {
    fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
    lineHeight: 1.5,
  },
  refreshBtn: {
    background: "#f0ece0", color: "#8a6a3a", border: "1.5px solid #e0d6bf", borderRadius: 10,
    padding: "9px 0", fontFamily: "var(--body)", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  /* AddModal 土選択 */
  bedPickLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#5a6b4d", marginBottom: 8 },
  bedPickRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  bedPick: {
    border: "2px solid", borderRadius: 11, padding: "8px 12px", cursor: "pointer",
    display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start", transition: "all .15s",
  },
  bedPickName: { fontFamily: "var(--body)", fontWeight: 700, fontSize: 13, color: "#3d4a35" },
  bedPickHealth: { fontSize: 10, fontWeight: 700 },
  bedAddMini: {
    border: "2px dashed #d6cfbb", borderRadius: 11, background: "#faf7ee", cursor: "pointer",
    width: 42, display: "flex", alignItems: "center", justifyContent: "center", color: "#9c7a4a",
  },
  /* 履歴 */
  histList: { display: "flex", flexDirection: "column", gap: 9 },
  histItem: {
    display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12,
    padding: "11px 14px", border: "1.5px solid #e8e1d0",
  },
  histEmoji: { fontSize: 26 },
  histName: { fontFamily: "var(--display)", fontSize: 15, color: "#3d4a35" },
  histMeta: { fontSize: 11, color: "#9aa089", marginTop: 1 },
  histDate: { fontSize: 13, fontWeight: 700, color: "#9c7a4a", fontFamily: "var(--body)" },
  empty: { textAlign: "center", padding: "44px 20px", background: "#fff", borderRadius: 18, border: "1.5px dashed #d6cfbb" },
  emptyText: { color: "#9aa089", marginBottom: 16 },
  addBtnBig: {
    background: "#6b9d4f", color: "#fff", border: "none", borderRadius: 12,
    padding: "12px 22px", fontFamily: "var(--body)", fontWeight: 700, fontSize: 14.5,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
    boxShadow: "0 4px 14px rgba(107,157,79,.35)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 16 },
  card: {
    background: "#fff", borderRadius: 18, padding: 18, border: "2px solid #e3ddcf",
    boxShadow: "0 6px 18px rgba(120,110,80,.08)", display: "flex", flexDirection: "column", gap: 12,
  },
  cardTop: { display: "flex", alignItems: "center", gap: 12 },
  cropEmoji: { fontSize: 38, lineHeight: 1 },
  cropName: { margin: 0, fontFamily: "var(--display)", fontSize: 19, color: "#3d4a35" },
  cropMeta: { fontSize: 11, color: "#9aa089", display: "flex", alignItems: "center", gap: 4, marginTop: 3, flexWrap: "wrap" },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e3ddcf",
    background: "#faf7ee", cursor: "pointer", fontSize: 18, lineHeight: 1,
  },
  growRow: { display: "flex", alignItems: "center", gap: 8 },
  growLabel: { fontSize: 11, color: "#9aa089", fontWeight: 700, width: 30 },
  growTrack: { flex: 1, height: 8, background: "#eceadd", borderRadius: 5, overflow: "hidden" },
  growFill: { height: "100%", background: "linear-gradient(90deg,#a7c97a,#6b9d4f)", borderRadius: 5, transition: "width .5s" },
  growPct: { fontSize: 11.5, color: "#6b9d4f", fontWeight: 700, width: 34, textAlign: "right" },
  waterStatus: {
    borderRadius: 10, padding: "8px 12px", fontSize: 12.5, fontWeight: 700,
    display: "flex", alignItems: "center", gap: 6,
  },
  waterBtn: {
    background: "#5b8aa6", color: "#fff", border: "none", borderRadius: 10,
    padding: "9px 0", fontFamily: "var(--body)", fontWeight: 700, fontSize: 13.5,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    boxShadow: "0 3px 10px rgba(91,138,166,.3)",
  },
  tip: {
    background: "#faf6ea", borderRadius: 10, padding: "10px 12px", fontSize: 11.5,
    color: "#7a6a45", lineHeight: 1.6, display: "flex", gap: 7, border: "1px solid #f0e8d2",
  },
  /* badges */
  badgeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginTop: 14 },
  badge: {
    background: "#fff", borderRadius: 16, padding: "16px 12px", textAlign: "center",
    border: "1.5px solid #e8e1d0", transition: "all .3s", position: "relative",
  },
  badgeEmoji: { fontSize: 34 },
  badgeName: { fontFamily: "var(--display)", fontSize: 14, color: "#3d4a35", marginTop: 6 },
  badgeDesc: { fontSize: 10.5, color: "#9aa089", marginTop: 3, lineHeight: 1.4 },
  badgeGot: {
    marginTop: 8, fontSize: 10.5, color: "#6b9d4f", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
  },
  footer: { textAlign: "center", marginTop: 34, fontSize: 12, color: "#a8ac98" },
  /* modal */
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(45,55,38,.55)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50,
  },
  modal: {
    background: "#f7f3e9", borderRadius: 22, padding: 22, maxWidth: 560, width: "100%",
    maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)",
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "var(--display)", fontSize: 22, color: "#3a5630", margin: 0 },
  closeBtn: { background: "#fff", border: "1.5px solid #e3ddcf", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  cropPicker: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 10 },
  cropOption: {
    border: "2px solid", borderRadius: 14, padding: "12px 6px", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .15s",
  },
  cropOptName: { fontFamily: "var(--body)", fontWeight: 700, fontSize: 12.5, color: "#3d4a35" },
  cropOptSeason: { fontSize: 9.5, color: "#9aa089" },
  detailBox: { marginTop: 18, background: "#fff", borderRadius: 16, padding: 18, border: "1.5px solid #e8e1d0" },
  detailTip: { fontSize: 12.5, color: "#7a6a45", lineHeight: 1.6, display: "flex", gap: 7, margin: "0 0 16px" },
  dateLabel: { display: "flex", flexDirection: "column", gap: 7, fontSize: 12.5, fontWeight: 700, color: "#5a6b4d" },
  dateInput: { border: "1.5px solid #d6cfbb", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--body)", fontSize: 14, marginTop: 2 },
  confirmBtn: {
    marginTop: 16, width: "100%", background: "#6b9d4f", color: "#fff", border: "none",
    borderRadius: 12, padding: "13px 0", fontFamily: "var(--body)", fontWeight: 700, fontSize: 15,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    boxShadow: "0 4px 14px rgba(107,157,79,.35)",
  },
  /* toast */
  toast: {
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: "#3a5630", color: "#fff", padding: "13px 24px", borderRadius: 14,
    fontWeight: 700, fontSize: 14, boxShadow: "0 10px 30px rgba(0,0,0,.3)",
    animation: "toastIn .3s ease", zIndex: 60, whiteSpace: "nowrap",
  },
  /* popup */
  popupOverlay: {
    position: "fixed", inset: 0, background: "rgba(45,55,38,.6)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16,
  },
  popupCard: {
    background: "linear-gradient(160deg,#fffdf6,#f3ecd9)", borderRadius: 24, padding: "32px 36px",
    textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.35)", border: "2px solid #e8d9b0",
    animation: "popIn .4s ease", maxWidth: 320,
  },
  popupBurst: { fontSize: 64, animation: "burst .6s ease" },
  popupTitle: { fontSize: 12, letterSpacing: 3, color: "#c98b3a", fontWeight: 700, marginTop: 8 },
  popupName: { fontFamily: "var(--display)", fontSize: 26, color: "#3a5630", margin: "6px 0" },
  popupDesc: { fontSize: 13, color: "#8a7a55", marginBottom: 20 },
  popupBtn: {
    background: "#c98b3a", color: "#fff", border: "none", borderRadius: 12, padding: "11px 30px",
    fontFamily: "var(--body)", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
    boxShadow: "0 5px 16px rgba(201,139,58,.4)",
  },
};
