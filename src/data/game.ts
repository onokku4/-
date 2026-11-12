import type { BadgeId } from "../types";

export interface Level {
  lv: number;
  title: string;
  min: number;
}

export const LEVELS: readonly [Level, ...Level[]] = [
  { lv: 1, title: "種まきびと", min: 0 },
  { lv: 2, title: "芽吹きの見習い", min: 50 },
  { lv: 3, title: "土いじり名人", min: 150 },
  { lv: 4, title: "緑の指", min: 350 },
  { lv: 5, title: "収穫の達人", min: 700 },
  { lv: 6, title: "大地のマエストロ", min: 1200 },
];

export const levelFor = (xp: number): { level: Level; next: Level | null; progressPct: number } => {
  const level = [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.min > xp) ?? null;
  const progressPct = next ? Math.round(((xp - level.min) / (next.min - level.min)) * 100) : 100;
  return { level, next, progressPct };
};

export interface Badge {
  id: BadgeId;
  name: string;
  emoji: string;
  desc: string;
}

export const BADGES: readonly Badge[] = [
  { id: "first", name: "はじめの一粒", emoji: "🌱", desc: "最初の作物を植えた" },
  { id: "water10", name: "水やり10回", emoji: "💧", desc: "水やりを10回達成" },
  { id: "streak7", name: "7日連続", emoji: "🔥", desc: "7日連続で世話をした" },
  { id: "variety5", name: "彩りの庭", emoji: "🌈", desc: "5種類の作物を育てた" },
  { id: "harvest", name: "初収穫", emoji: "🧺", desc: "はじめて収穫した" },
  { id: "green", name: "緑の指", emoji: "✨", desc: "レベル4に到達" },
  { id: "fruit", name: "果樹園のはじまり", emoji: "🍋", desc: "はじめて果樹・ベリーを植えた" },
  { id: "matchmaker", name: "縁結び", emoji: "🐝", desc: "受粉相手が必要な品種にパートナーを揃えた" },
];

export const XP = { plant: 15, water: 8, harvest: 30, refresh: 10, feed: 10, photo: 5 } as const;
export const GREEN_THUMB_XP = 350;
