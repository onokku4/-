import type { Bloom, Crop, PlantRef, Pollination, Variety } from "../types";
import { pollinationOf, resolve } from "../data/catalog";

/**
 * ok     = このままで実がなる
 * better = 実はなるが、もっと良くできる
 * action = 人の手助け（人工授粉・株数追加）が必要
 * ng     = このままでは実がならない
 * na     = 受粉が関係ない作物
 */
export type Verdict = "ok" | "better" | "action" | "ng" | "na";

export interface Diagnosis {
  verdict: Verdict;
  headline: string;
  detail: string;
  /** 庭にある受粉相手の品種名 */
  partners: string[];
  /** 追加すると良い品種名（おすすめ順） */
  suggestions: string[];
}

const BLOOM_ORDER: Record<Bloom, number> = { early: 0, mid: 1, late: 2 };
const BLOOM_LABEL: Record<Bloom, string> = { early: "早咲き", mid: "中間", late: "遅咲き" };
const bloomsOverlap = (a: Bloom, b: Bloom) => Math.abs(BLOOM_ORDER[a] - BLOOM_ORDER[b]) <= 1;

type Grouped = Extract<Pollination, { group: string }>;
type Dioecious = Extract<Pollination, { kind: "dioecious" }>;

const isGrouped = (p: Pollination): p is Grouped => p.kind === "cross" || p.kind === "selfHelped";

/** 別品種・同系統・開花期が重なる、の3条件で他家受粉が成立する */
const crossCompatible = (self: Variety, selfP: Grouped, other: Variety, otherP: Pollination) =>
  other.id !== self.id && isGrouped(otherP) && otherP.group === selfP.group && bloomsOverlap(otherP.bloom, selfP.bloom);

const mates = (selfP: Dioecious, otherP: Pollination) =>
  otherP.kind === "dioecious" && otherP.sex !== selfP.sex && bloomsOverlap(otherP.bloom, selfP.bloom);

const unique = (names: string[]) => [...new Set(names)];

/** 同じ作物の「他の株」だけを品種つきで取り出す */
const sameCropOthers = (crop: Crop, others: readonly PlantRef[]) =>
  others
    .filter((o) => o.cropId === crop.id)
    .flatMap((o) => {
      const r = resolve(o);
      return r ? [{ variety: r.variety, poll: pollinationOf(r.crop, r.variety) }] : [];
    });

const withTip = (detail: string, crop: Crop) => (crop.pollinationTip ? `${detail} ${crop.pollinationTip}` : detail);

/**
 * target を植えた（植える）とき、庭の他の株 others との組み合わせで受粉できるかを診断する。
 * others に target 自身は含めないこと。
 */
export function diagnose(target: PlantRef, others: readonly PlantRef[]): Diagnosis | undefined {
  const r = resolve(target);
  if (!r) return undefined;
  const { crop, variety } = r;
  const poll = pollinationOf(crop, variety);
  const garden = sameCropOthers(crop, others);
  const base = { partners: [] as string[], suggestions: [] as string[] };

  switch (poll.kind) {
    case "none":
      return { ...base, verdict: "na", headline: "受粉は不要", detail: "葉や根を収穫する作物です。" };

    case "parthenocarpic":
      return { ...base, verdict: "ok", headline: "受粉なしで実がなる", detail: withTip("受粉樹は不要です。", crop) };

    case "self":
      return { ...base, verdict: "ok", headline: "1株で実がなる", detail: withTip("自分の花粉で結実します。", crop) };

    case "selfHelped":
    case "cross": {
      const partners = unique(
        garden.filter((g) => crossCompatible(variety, poll, g.variety, g.poll)).map((g) => g.variety.name),
      );
      const suggestions = crop.varieties
        .filter((v) => crossCompatible(variety, poll, v, pollinationOf(crop, v)))
        .sort((a, b) => Number(isGoodPollinizer(crop, b)) - Number(isGoodPollinizer(crop, a)))
        .map((v) => v.name);

      if (partners.length > 0) {
        return {
          partners,
          suggestions: [],
          verdict: "ok",
          headline: "受粉相手がいます",
          detail: withTip(`${partners.join("・")} と受粉できます。近くに置いてください。`, crop),
        };
      }
      if (poll.kind === "selfHelped") {
        return {
          partners,
          suggestions,
          verdict: "better",
          headline: "1株でも実るが、別品種で実つきUP",
          detail: withTip("同じ系統の別品種を並べると粒が大きく数も増えます。", crop),
        };
      }
      return {
        partners,
        suggestions,
        verdict: "ng",
        headline: "受粉相手が必要",
        detail: withTip(crossFailureReason(variety, garden), crop),
      };
    }

    case "dioecious": {
      const partners = unique(garden.filter((g) => mates(poll, g.poll)).map((g) => g.variety.name));
      const suggestions = crop.varieties.filter((v) => mates(poll, pollinationOf(crop, v))).map((v) => v.name);
      const female = poll.sex === "female";

      if (partners.length > 0) {
        return {
          partners,
          suggestions: [],
          verdict: "ok",
          headline: female ? "雄木がいます" : "受粉樹として働きます",
          detail: withTip(`${partners.join("・")} と開花期（${BLOOM_LABEL[poll.bloom]}）が合います。`, crop),
        };
      }
      const wrongTiming = garden.some((g) => g.poll.kind === "dioecious" && g.poll.sex !== poll.sex);
      const reason = wrongTiming ? "庭の相手とは開花期が合いません。" : "";
      return female
        ? {
            partners,
            suggestions,
            verdict: "ng",
            headline: "雄木が必要",
            detail: withTip(`雌木だけでは実がなりません。${reason}${BLOOM_LABEL[poll.bloom]}の雄木を植えてください。`, crop),
          }
        : {
            partners,
            suggestions,
            verdict: "action",
            headline: "雄木なので実はなりません",
            detail: withTip(`受粉専用の木です。${reason}${BLOOM_LABEL[poll.bloom]}の雌木と組み合わせてください。`, crop),
          };
    }

    case "monoecious": {
      const several = garden.length > 0;
      return {
        ...base,
        verdict: "action",
        headline: "人工授粉がおすすめ",
        detail: withTip(
          several
            ? "複数株あるので雄花と雌花が揃いやすい状態です。朝9時ごろまでに雄花の花粉を雌花につけてください。"
            : "1株だと雄花と雌花の開花がずれがち。朝9時ごろまでに人工授粉を。もう1株あると安定します。",
          crop,
        ),
      };
    }

    case "wind": {
      const sameVariety = garden.filter((g) => g.variety.id === variety.id).length + 1;
      const mixed = unique(garden.filter((g) => g.variety.id !== variety.id).map((g) => g.variety.name));
      if (mixed.length > 0) {
        return {
          ...base,
          verdict: "action",
          headline: "別品種とは離して植える",
          detail: withTip(`${mixed.join("・")} の花粉がかかると粒の色や甘さが変わります。離すか、種まきを2週間ずらしてください。`, crop),
        };
      }
      if (sameVariety < poll.minPlants) {
        return {
          ...base,
          verdict: "action",
          headline: `あと${poll.minPlants - sameVariety}株ほしい`,
          detail: withTip(`風で花粉が運ばれるので、同じ品種を${poll.minPlants}株以上まとめて植えると粒が揃います（現在${sameVariety}株）。`, crop),
        };
      }
      return {
        ...base,
        verdict: "ok",
        headline: "株数は十分",
        detail: withTip(`同じ品種が${sameVariety}株あり、風で受粉できます。`, crop),
      };
    }
  }
}

const isGoodPollinizer = (crop: Crop, v: Variety) => {
  const p = pollinationOf(crop, v);
  return p.kind === "cross" && p.goodPollinizer === true;
};

function crossFailureReason(variety: Variety, garden: { variety: Variety; poll: Pollination }[]): string {
  if (garden.length === 0) return "この品種は自分の花粉では実がつきにくいため、同じ系統の別品種が必要です。";
  if (garden.every((g) => g.variety.id === variety.id)) {
    return "同じ品種どうしでは受粉できません。同じ系統の「別の品種」を加えてください。";
  }
  return "庭にある品種とは系統か開花期が合いません。同じ系統の別品種を加えてください。";
}

export const VERDICT_STYLE: Record<Verdict, { mark: string; label: string; color: string; bg: string }> = {
  ok: { mark: "◎", label: "受粉OK", color: "#3ddc97", bg: "rgba(61,220,151,.10)" },
  better: { mark: "○", label: "もっと良くできる", color: "#f5b942", bg: "rgba(245,185,66,.12)" },
  action: { mark: "△", label: "手助けが必要", color: "#f5b942", bg: "rgba(245,185,66,.12)" },
  ng: { mark: "×", label: "このままでは実らない", color: "#ff7a52", bg: "rgba(255,91,46,.12)" },
  na: { mark: "－", label: "受粉不要", color: "#8b93a3", bg: "rgba(255,255,255,.04)" },
};
