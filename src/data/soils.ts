import type { Nutrients } from "../types";

/**
 * 市販の培養土・用土の種類。
 * nutrients は「元肥の充実度」の目安（0〜100）。lasts は元肥が効く日数の目安。
 * 製品ごとの実際の配合は袋の表示を優先してほしい。アプリは成分を測れないので、ここは一般的な目安。
 */
export interface SoilMix {
  id: string;
  name: string;
  desc: string;
  nutrients: Nutrients;
  /** 元肥が効く日数の目安。0 は無肥料 */
  lasts: number;
  /** 酸性用土（ブルーベリー向き） */
  acidic?: true;
  /** 畑（地植え）専用 */
  fieldOnly?: true;
}

export const SOIL_MIXES: readonly SoilMix[] = [
  { id: "veg", name: "野菜用培養土（元肥入り）", desc: "いちばん一般的。約1か月は追肥不要、その後は2〜3週間おきに追肥。", nutrients: { n: 90, p: 90, k: 90 }, lasts: 30 },
  { id: "flower-veg", name: "花と野菜の土（元肥入り）", desc: "汎用タイプ。野菜用よりやや肥料控えめのことが多い。", nutrients: { n: 85, p: 85, k: 85 }, lasts: 30 },
  { id: "slow", name: "緩効性肥料入り培養土（長く効く）", desc: "約2か月効くタイプ。追肥は様子を見てから。", nutrients: { n: 95, p: 95, k: 95 }, lasts: 60 },
  { id: "blueberry", name: "ブルーベリー用の土（ピートモス主体・酸性）", desc: "pH4.5前後の酸性土。ブルーベリーはこれが必須。肥料はやや控えめ。", nutrients: { n: 60, p: 60, k: 60 }, lasts: 30, acidic: true },
  { id: "herb", name: "ハーブ用の土（肥料控えめ）", desc: "水はけ重視で肥料は少なめ。ハーブは肥料過多だと香りが落ちる。", nutrients: { n: 55, p: 55, k: 55 }, lasts: 30 },
  { id: "fruit", name: "果樹・花木用の土", desc: "水はけと保水のバランス型。レモン・イチジクなどに。", nutrients: { n: 75, p: 80, k: 80 }, lasts: 40 },
  { id: "homemade", name: "自作ブレンド（赤玉土＋腐葉土＋堆肥）", desc: "赤玉7：腐葉土3が基本。元肥を混ぜていなければ肥料は少なめ。", nutrients: { n: 55, p: 50, k: 50 }, lasts: 20 },
  { id: "reused", name: "再生土（前作の土＋再生材）", desc: "古い根を除いて再生材を混ぜたもの。栄養は中程度、連作障害に注意。", nutrients: { n: 55, p: 55, k: 55 }, lasts: 20 },
  { id: "plain", name: "赤玉土・鹿沼土だけ（無肥料）", desc: "肥料分なし。植えたらすぐ追肥か、緩効性肥料を混ぜる。", nutrients: { n: 25, p: 25, k: 25 }, lasts: 0 },
  { id: "field", name: "畑の土（堆肥をすき込み済み）", desc: "土の量が多いので肥料持ちがよい。元肥は1〜1.5か月効く。", nutrients: { n: 80, p: 75, k: 75 }, lasts: 45, fieldOnly: true },
  { id: "unknown", name: "わからない／その他", desc: "一般的な元肥入りとして扱う。袋に「肥料入り」とあればだいたいこれ。", nutrients: { n: 75, p: 75, k: 75 }, lasts: 30 },
];

const MIX_BY_ID = new Map(SOIL_MIXES.map((m) => [m.id, m]));
export const findSoilMix = (id: string | null | undefined): SoilMix | undefined =>
  id == null ? undefined : MIX_BY_ID.get(id);
