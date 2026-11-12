export type SoilTypeId = "planter" | "field" | "hydro";
export type Category = "果菜" | "葉物" | "根菜" | "ハーブ" | "ベリー" | "果樹";
export type Bloom = "early" | "mid" | "late";

/**
 * 受粉特性。品種に指定があれば作物の既定値より優先する。
 * group が同じ品種どうしだけが受粉相手になる（例: ブルーベリーの系統）。
 */
export type Pollination =
  | { kind: "none" } // 葉・根を収穫するので受粉不要
  | { kind: "parthenocarpic" } // 受粉なしで実がなる（単為結果）
  | { kind: "self" } // 1株で結実（自家結実性）
  | { kind: "selfHelped"; group: string; bloom: Bloom } // 1株でもなるが別品種で実つき向上
  | { kind: "cross"; group: string; bloom: Bloom; goodPollinizer?: true } // 別品種が必須
  | { kind: "dioecious"; sex: "female" | "male"; bloom: Bloom } // 雌雄異株
  | { kind: "monoecious" } // 雌雄異花。人工授粉推奨
  | { kind: "wind"; minPlants: number }; // 風媒。同品種をまとめ植え

export interface Nutrients {
  n: number;
  p: number;
  k: number;
}

export interface Variety {
  id: string;
  name: string;
  /** 植え付けから最初の収穫までの目安日数 */
  days: number;
  tip: string;
  pollination?: Pollination;
}

export interface Crop {
  id: string;
  name: string;
  emoji: string;
  category: Category;
  season: string;
  /** プランター・晴れ・適温での水やり間隔（日） */
  waterEvery: number;
  sun: string;
  feed: Nutrients;
  pollination: Pollination;
  /** 受粉・着果を安定させるひとこと */
  pollinationTip?: string;
  /** 収穫後も株が残る（果樹・ベリーなど） */
  perennial?: true;
  /** 収穫期の月（1〜12）。多年生で使う */
  harvestMonths?: number[];
  /** この気温(℃)を下回ると防寒が必要 */
  coldTenderBelowC?: number;
  /** 植えられる場所。省略時はすべて可 */
  soils?: SoilTypeId[];
  /** 酸性土が必須（ブルーベリーなど） */
  acidSoil?: true;
  varieties: [Variety, ...Variety[]];
}

export interface PlantRef {
  cropId: string;
  varietyId: string;
}

export interface Plant extends PlantRef {
  uid: string;
  projectName: string;
  plantedDate: string; // YYYY-MM-DD（ローカル日付）
  lastWater: string | null;
  bedId: string;
  harvestCount: number;
}

export interface Bed extends Nutrients {
  id: string;
  name: string;
  type: SoilTypeId;
  uses: number;
  /** 使っている市販の土（data/soils.ts の id）。未選択なら null */
  soilMix: string | null;
  /** n/p/k を記録した日。この日からの経過で栄養の減りを推定する。未記録なら減らない */
  nutrientsAt: string | null;
  /** 最後に肥料を入れた日（土を入れた日＝元肥、または追肥） */
  fedAt: string | null;
  /** 最後の追肥の種類（data/fertilizers.ts の id）。元肥だけなら null */
  fertilizer: string | null;
}

export interface HarvestRecord {
  id: string;
  cropId: string;
  cropName: string;
  varietyName: string;
  projectName: string;
  emoji: string;
  bedName: string;
  soilLabel: string;
  plantedDate: string;
  harvestDate: string;
  days: number;
}

export type Condition = "sunny" | "cloudy" | "rainy" | "snowy" | "windy";

export interface WeatherReading {
  condition: Condition;
  tempC: number;
}

/** 1日ぶんの天気の記録。auto は Open-Meteo、manual は人が入力した値 */
export interface DailyWeather {
  condition: Condition;
  maxC: number;
  minC: number;
  /** 降水量（mm）。手動入力では不明なので 0 か目安 */
  rainMm: number;
  source: "auto" | "manual";
}

/** 日付 → 天気。キーは YYYY-MM-DD（ローカル） */
export type WeatherLog = Record<string, DailyWeather>;

export type CareKind = "water" | "feed" | "refresh";

/** 世話の記録（カレンダー表示用）。収穫は harvestLog、植え付けは Plant.plantedDate にある */
export interface CareEvent {
  date: string;
  kind: CareKind;
  /** 株名や場所名 */
  label: string;
}

export interface WeatherState {
  /** 水やり計算に使う値。自動取得後に人が調整できる */
  current: WeatherReading;
  /** 最後に自動取得した値（未取得なら null）。位置情報そのものは保持しない */
  auto: (WeatherReading & { fetchedAt: string }) | null;
}

/** 撮影時点の「植え付けから何日目」。株ごとに残す（後で株を片付けても写真の説明が消えないように） */
export interface GrowthStage {
  label: string;
  emoji: string;
  day: number;
}

/** 成長記録の写真。画像本体は IndexedDB（ui/photoStore.ts）に id で保存し、ここにはメタ情報だけ持つ */
export interface Photo {
  id: string;
  bedId: string;
  date: string;
  note: string;
  stages: GrowthStage[];
}

/** 登録した庭の位置。約1km（小数2桁）に丸めてから保存する */
export interface GardenLocation {
  lat: number;
  lon: number;
  registeredAt: string;
}

export type BadgeId =
  | "first"
  | "water10"
  | "streak7"
  | "variety5"
  | "harvest"
  | "green"
  | "fruit"
  | "matchmaker";

export interface GardenState {
  plants: Plant[];
  beds: Bed[];
  harvestLog: HarvestRecord[];
  xp: number;
  streak: number;
  lastCareDate: string | null;
  waterCount: number;
  earnedBadges: BadgeId[];
  weather: WeatherState;
  weatherLog: WeatherLog;
  careLog: CareEvent[];
  /** 登録済みなら、位置情報の許可なしにこの座標で天気を取る */
  location: GardenLocation | null;
  photos: Photo[];
  autoWeather: boolean;
  notifyOn: boolean;
  notifyTime: string; // HH:MM
  lastNotifyDate: string | null;
}
