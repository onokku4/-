import type { HarvestRecord } from "../types";

export interface HarvestSummary {
  cropId: string;
  cropName: string;
  emoji: string;
  times: number;
  count: number;
  grams: number;
  /** 収穫した年（古い順） */
  years: string[];
}

/** 作物ごとの収穫回数・個数・重さ。回数の多い順 */
export const harvestSummary = (log: HarvestRecord[]): HarvestSummary[] => {
  const m = new Map<string, HarvestSummary>();
  for (const h of log) {
    const s = m.get(h.cropId) ?? { cropId: h.cropId, cropName: h.cropName, emoji: h.emoji, times: 0, count: 0, grams: 0, years: [] };
    s.times++;
    s.count += h.count ?? 0;
    s.grams += h.grams ?? 0;
    const y = h.harvestDate.slice(0, 4);
    if (!s.years.includes(y)) s.years.push(y);
    m.set(h.cropId, s);
  }
  return [...m.values()].map((s) => ({ ...s, years: [...s.years].sort() })).sort((a, b) => b.times - a.times || a.cropName.localeCompare(b.cropName));
};
