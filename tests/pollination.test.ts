import { describe, expect, it } from "vitest";
import { diagnose } from "../src/lib/pollination";
import type { PlantRef } from "../src/types";

const ref = (cropId: string, varietyId: string): PlantRef => ({ cropId, varietyId });
const d = (target: PlantRef, others: PlantRef[] = []) => diagnose(target, others)!;

describe("受粉診断", () => {
  it("葉物は受粉不要", () => {
    expect(d(ref("lettuce", "frill")).verdict).toBe("na");
  });

  it("トマト・レモンは1株で結実", () => {
    expect(d(ref("tomato", "aiko")).verdict).toBe("ok");
    expect(d(ref("lemon", "meyer")).verdict).toBe("ok");
  });

  it("イチジク・温州ミカン・キュウリは受粉なしで実る", () => {
    for (const r of [ref("fig", "dauphine"), ref("mikan", "miyagawa"), ref("cucumber", "fushinari")]) {
      expect(d(r).headline).toBe("受粉なしで実がなる");
    }
  });

  describe("ブルーベリー", () => {
    const tif = ref("blueberry", "tifblue");
    it("ラビットアイ1本だけでは実らない。相手候補は受粉樹向きを先頭に出す", () => {
      const r = d(tif);
      expect(r.verdict).toBe("ng");
      expect(r.suggestions[0]).toContain("ホームベル");
      expect(r.suggestions.every((s) => s.includes("ラビットアイ"))).toBe(true);
    });
    it("同じ品種を2本植えても実らない", () => {
      const r = d(tif, [tif]);
      expect(r.verdict).toBe("ng");
      expect(r.detail).toContain("同じ品種どうし");
    });
    it("ラビットアイの別品種があれば◎", () => {
      const r = d(tif, [ref("blueberry", "homebell")]);
      expect(r.verdict).toBe("ok");
      expect(r.partners).toEqual(["ホームベル（ラビットアイ）"]);
    });
    it("ハイブッシュはラビットアイの相手にならない", () => {
      expect(d(tif, [ref("blueberry", "bluecrop")]).verdict).toBe("ng");
    });
    it("ハイブッシュは1本でも実るが、別品種で改善と伝える", () => {
      expect(d(ref("blueberry", "sunshine")).verdict).toBe("better");
      expect(d(ref("blueberry", "sunshine"), [ref("blueberry", "bluecrop")]).verdict).toBe("ok");
    });
    it("他の作物は相手に数えない", () => {
      expect(d(tif, [ref("olive", "mission"), ref("tomato", "aiko")]).verdict).toBe("ng");
    });
  });

  describe("キウイ（雌雄異株）", () => {
    it("雌木だけでは実らない。開花期の合う雄木を勧める", () => {
      const r = d(ref("kiwi", "hayward"));
      expect(r.verdict).toBe("ng");
      expect(r.suggestions).toEqual(["トムリ（雄）"]);
    });
    it("開花期の合う雄木があれば◎", () => {
      expect(d(ref("kiwi", "hayward"), [ref("kiwi", "tomuri")]).verdict).toBe("ok");
    });
    it("開花期が合わない雄木では実らず、その理由を伝える", () => {
      const r = d(ref("kiwi", "hayward"), [ref("kiwi", "sousei")]);
      expect(r.verdict).toBe("ng");
      expect(r.detail).toContain("開花期が合いません");
    });
    it("雌木が2本あっても実らない", () => {
      expect(d(ref("kiwi", "hayward"), [ref("kiwi", "koryoku")]).verdict).toBe("ng");
    });
    it("雄木単体は実がならないと伝える", () => {
      expect(d(ref("kiwi", "tomuri")).verdict).toBe("action");
      expect(d(ref("kiwi", "tomuri"), [ref("kiwi", "hayward")]).verdict).toBe("ok");
    });
  });

  it("オリーブは別品種で◎", () => {
    expect(d(ref("olive", "mission")).verdict).toBe("ng");
    expect(d(ref("olive", "mission"), [ref("olive", "nevadillo")]).verdict).toBe("ok");
    expect(d(ref("olive", "mission")).suggestions[0]).toBe("ネバディロ・ブランコ");
  });

  it("ズッキーニは人工授粉を促す", () => {
    expect(d(ref("zucchini", "green")).verdict).toBe("action");
    expect(d(ref("zucchini", "green"), [ref("zucchini", "yellow")]).detail).toContain("複数株");
  });

  describe("トウモロコシ（風媒）", () => {
    const gold = ref("corn", "goldrush");
    it("株数が足りなければ不足数を伝える", () => {
      expect(d(gold, [gold, gold]).headline).toBe("あと3株ほしい");
    });
    it("6株そろえば◎", () => {
      expect(d(gold, Array(5).fill(gold)).verdict).toBe("ok");
    });
    it("別品種が混ざると離すよう警告する", () => {
      const r = d(gold, [...Array(5).fill(gold), ref("corn", "pure-white")]);
      expect(r.verdict).toBe("action");
      expect(r.detail).toContain("ピュアホワイト");
    });
  });

  it("未知の作物は undefined。未知の品種は先頭品種として扱う", () => {
    expect(diagnose(ref("unknown", "x"), [])).toBeUndefined();
    expect(d(ref("tomato", "no-such")).verdict).toBe("ok");
  });
});
