import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import type { GardenState } from "../types";
import { BACKUP_JSON, PHOTO_DIR, backupFileName, envelope, parseBackup, photoPath, type ParseBackupResult } from "../lib/backup";
import { loadPhotoBlob, savePhotoBlob } from "./photoStore";

/** 状態と写真本体を1つの zip にまとめる */
export async function buildBackupZip(state: GardenState, exportedAt: string): Promise<Blob> {
  const files: Zippable = { [BACKUP_JSON]: strToU8(JSON.stringify(envelope(state, exportedAt), null, 1)) };
  for (const p of state.photos) {
    const blob = await loadPhotoBlob(p.id);
    if (blob) files[photoPath(p.id)] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }]; // JPEG は再圧縮しない
  }
  return new Blob([zipSync(files, { level: 6 }) as BlobPart], { type: "application/zip" });
}

/** iPhone などでは共有シートで「ファイルに保存」、それ以外はダウンロード */
export async function saveBackup(state: GardenState, today: string): Promise<"shared" | "downloaded"> {
  const blob = await buildBackupZip(state, new Date().toISOString());
  const name = backupFileName(today);
  const file = new File([blob], name, { type: "application/zip" });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "そだてる庭のバックアップ" });
      return "shared";
    } catch (e) {
      // 共有をキャンセルしたらそのまま終わる。それ以外はダウンロードにフォールバック
      if ((e as { name?: string }).name === "AbortError") throw e;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}

export type ReadBackupResult = (ParseBackupResult & { ok: true; photoCount: number; restorePhotos: () => Promise<number> }) | { ok: false; reason: "format" | "newer" | "zip" };

/** zip を読んで中身を検証する。写真の書き込みは restorePhotos() を呼んだときだけ行う */
export async function readBackupZip(file: Blob): Promise<ReadBackupResult> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return { ok: false, reason: "zip" };
  }
  const json = entries[BACKUP_JSON];
  if (!json) return { ok: false, reason: "format" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(strFromU8(json));
  } catch {
    return { ok: false, reason: "format" };
  }
  const r = parseBackup(parsed);
  if (!r.ok) return r;
  const photos = Object.entries(entries).filter(([name]) => name.startsWith(PHOTO_DIR) && name.endsWith(".jpg"));
  return {
    ...r,
    photoCount: photos.length,
    restorePhotos: async () => {
      let n = 0;
      for (const [name, bytes] of photos) {
        const id = name.slice(PHOTO_DIR.length, -".jpg".length);
        if (!r.state.photos.some((p) => p.id === id)) continue;
        await savePhotoBlob(id, new Blob([bytes as BlobPart], { type: "image/jpeg" }));
        n++;
      }
      return n;
    },
  };
}
