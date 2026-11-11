import { describe, expect, it } from "vitest";
import { CATEGORIES, CROPS, pollinationOf } from "../src/data/catalog";
import { diagnose } from "../src/lib/pollination";

describe("作物カタログの整合性", () => {
  it("作物IDと、作物内の品種IDが重複しない", () => {
    expect(new Set(CROPS.map((c) => c.id)).size).toBe(CROPS.length);
    for (const c of CROPS) expect(new Set(c.varieties.map((v) => v.id)).size, c.name).toBe(c.varieties.length);
  });

  it("カテゴリは定義済みのもの、収穫月は1〜12", () => {
    for (const c of CROPS) {
      expect(CATEGORIES, c.name).toContain(c.category);
      for (const m of c.harvestMonths ?? []) expect(m >= 1 && m <= 12, c.name).toBe(true);
    }
  });

  it("多年生には収穫月がある", () => {
    for (const c of CROPS.filter((c) => c.perennial)) expect(c.harvestMonths?.length, c.name).toBeGreaterThan(0);
  });

  it("相手が必要な品種には、カタログ内に必ず受粉相手の候補がある", () => {
    for (const c of CROPS) {
      for (const v of c.varieties) {
        const p = pollinationOf(c, v);
        if (p.kind !== "cross" && p.kind !== "dioecious" && p.kind !== "selfHelped") continue;
        const r = diagnose({ cropId: c.id, varietyId: v.id }, [])!;
        expect(r.suggestions.length, `${c.name} ${v.name}`).toBeGreaterThan(0);
        // 提案どおりに植えれば必ず成立する
        const partner = c.varieties.find((x) => x.name === r.suggestions[0])!;
        const after = diagnose({ cropId: c.id, varietyId: v.id }, [{ cropId: c.id, varietyId: partner.id }])!;
        expect(after.verdict, `${c.name} ${v.name} + ${partner.name}`).toBe("ok");
      }
    }
  });
});
