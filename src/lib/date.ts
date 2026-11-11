const pad = (n: number) => String(n).padStart(2, "0");

/** 端末のローカル日付（YYYY-MM-DD）。toISOString はUTCなので日本の朝に前日を返してしまう */
export const localDate = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const localTime = (d: Date = new Date()): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** YYYY-MM-DD どうしの日数差（b - a）。両方UTC零時として解釈するので夏時間の影響を受けない */
export const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
