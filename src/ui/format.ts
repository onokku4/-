import type { Variety } from "../types";

/** 月の配列を「6〜8月」「10〜2月」（年またぎ）「6・7・9・10月」に整形する */
export function formatMonths(months: readonly number[] | undefined): string {
  const set = new Set(months ?? []);
  const sorted = [...set].sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  if (sorted.length === 12) return "通年";
  if (sorted.length === 1) return `${sorted[0]}月`;
  const prev = (m: number) => (m === 1 ? 12 : m - 1);
  // 前月が含まれない月＝連続区間の始まり。1つだけなら年をまたいでも1区間
  const starts = sorted.filter((m) => !set.has(prev(m)));
  const start = starts[0];
  if (starts.length !== 1 || start === undefined) return `${sorted.join("・")}月`;
  const end = ((start + sorted.length - 2) % 12) + 1;
  return `${start}〜${end}月`;
}

/** 品種カードの「約◯日」。多年生で1年以上かかるものは「約◯年で初収穫」 */
export function formatDays(variety: Pick<Variety, "days">, perennial: boolean): string {
  if (perennial && variety.days >= 365) return `約${Math.max(1, Math.round(variety.days / 365))}年で初収穫`;
  return `約${variety.days}日`;
}

/** 「自動取得 HH:MM」用。ISO文字列が壊れていれば空文字 */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
