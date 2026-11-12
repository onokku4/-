import { describe, expect, it } from "vitest";
import { BACKUP_VERSION, backupFileName, backupOverdue, describe as describeState, envelope, parseBackup, photoPath } from "../src/lib/backup";
import { apply, initialState, type Action } from "../src/lib/garden";
import type { GardenState } from "../src/types";

const T = "2026-11-12";
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

describe("バックアップ", () => {
  const s = run(
    initialState(),
    { type: "plant", uid: "u1", cropId: "tomato", varietyId: "aiko", projectName: "", plantedDate: T, bedId: "bed_1", today: T },
    { type: "addPhoto", id: "ph1", bedId: "bed_1", date: T, note: "芽", today: T },
  );
  it("封筒に入れて取り出すと同じ状態に戻る", () => {
    const e = envelope(s, "2026-11-12T09:00:00.000Z");
    const r = parseBackup(JSON.parse(JSON.stringify(e)));
    expect(r.ok && r.state).toEqual(s);
    expect(r.ok && r.exportedAt).toBe("2026-11-12T09:00:00.000Z");
  });
  it("別のファイルや新しい形式は拒否する", () => {
    expect(parseBackup({ hello: 1 })).toEqual({ ok: false, reason: "format" });
    expect(parseBackup(null)).toEqual({ ok: false, reason: "format" });
    expect(parseBackup({ ...envelope(s, "x"), version: BACKUP_VERSION + 1 })).toEqual({ ok: false, reason: "newer" });
    // 中身が壊れていても normalize で救済される
    const r = parseBackup({ ...envelope(s, "x"), state: { plants: "nope" } });
    expect(r.ok && r.state.beds).toHaveLength(1);
  });
  it("復元アクションで丸ごと置き換わり、バックアップ日時が記録される", () => {
    const other = run(initialState("b9"), { type: "backedUp", at: "2026-11-01T00:00:00.000Z" });
    expect(other.lastBackupAt).toBe("2026-11-01T00:00:00.000Z");
    expect(apply(s, { type: "restore", state: other }).state).toBe(other);
  });
  it("ファイル名と写真のパス、内容の説明", () => {
    expect(backupFileName(T)).toBe("sodateru-niwa-backup-20261112.zip");
    expect(photoPath("ph1")).toBe("photos/ph1.jpg");
    expect(describeState(s)).toBe("株 1・場所 1・収穫 0件・写真 1枚・日記 0件・天気 0日");
  });
  it("写真があるのに30日以上保存していなければ注意", () => {
    expect(backupOverdue(initialState(), T)).toBe(false);
    expect(backupOverdue(s, T)).toBe(true);
    expect(backupOverdue({ ...s, lastBackupAt: "2026-11-01T00:00:00.000Z" }, T)).toBe(false);
    expect(backupOverdue({ ...s, lastBackupAt: "2026-10-01T00:00:00.000Z" }, T)).toBe(true);
  });
});
