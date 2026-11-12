import type { GardenState } from "../types";
import { normalize } from "./storage";

export const BACKUP_FORMAT = "sodateru-niwa-backup";
export const BACKUP_VERSION = 1;
export const BACKUP_JSON = "backup.json";
export const PHOTO_DIR = "photos/";

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  state: GardenState;
}

export const backupFileName = (today: string): string => `sodateru-niwa-backup-${today.replace(/-/g, "")}.zip`;

export const photoPath = (id: string): string => `${PHOTO_DIR}${id}.jpg`;

export const envelope = (state: GardenState, exportedAt: string): BackupEnvelope => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  exportedAt,
  state,
});

export type ParseBackupResult = { ok: true; state: GardenState; exportedAt: string } | { ok: false; reason: "format" | "newer" };

/** バックアップの JSON を検証して現在の形式に正規化する。将来の形式（version が大きい）は読まない */
export const parseBackup = (json: unknown): ParseBackupResult => {
  if (typeof json !== "object" || json === null) return { ok: false, reason: "format" };
  const e = json as Partial<BackupEnvelope>;
  if (e.format !== BACKUP_FORMAT || typeof e.version !== "number") return { ok: false, reason: "format" };
  if (e.version > BACKUP_VERSION) return { ok: false, reason: "newer" };
  return { ok: true, state: normalize(e.state), exportedAt: typeof e.exportedAt === "string" ? e.exportedAt : "" };
};

/** バックアップの内容のひとこと（復元前の確認に出す） */
export const describe = (s: GardenState): string =>
  `株 ${s.plants.length}・場所 ${s.beds.length}・収穫 ${s.harvestLog.length}件・写真 ${s.photos.length}枚・天気 ${Object.keys(s.weatherLog).length}日`;

/** 最後のバックアップからの経過で注意を出すか。写真があるのに30日以上バックアップしていなければ true */
export const backupOverdue = (s: Pick<GardenState, "photos" | "lastBackupAt">, today: string): boolean => {
  if (s.photos.length === 0) return false;
  if (!s.lastBackupAt) return true;
  return Date.parse(today) - Date.parse(s.lastBackupAt.slice(0, 10)) >= 30 * 86_400_000;
};
