import { useId, useRef, useState } from "react";
import { Download, HardDriveUpload, ShieldAlert, ShieldCheck } from "lucide-react";
import type { GardenState } from "../types";
import type { Action } from "../lib/garden";
import { backupOverdue, describe } from "../lib/backup";
import { localDate } from "../lib/date";
import { readBackupZip, saveBackup } from "../ui/backupFile";
import { styles } from "../styles";

interface Props {
  state: GardenState;
  today: string;
  dispatch: (a: Action) => void;
  say: (m: string) => void;
}

const fmtWhen = (iso: string | null) => (iso ? `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}` : null);

/** バックアップ（zip の保存）と復元。写真も含める */
export function BackupCard({ state, today, dispatch, say }: Props) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"save" | "restore" | null>(null);
  const overdue = backupOverdue(state, today);
  const last = fmtWhen(state.lastBackupAt);

  const save = async () => {
    setBusy("save");
    try {
      const how = await saveBackup(state, localDate());
      dispatch({ type: "backedUp", at: new Date().toISOString() });
      say(how === "shared" ? "💾 バックアップを共有しました（ファイルに保存してください）" : "💾 バックアップをダウンロードしました");
    } catch (e) {
      if ((e as { name?: string }).name !== "AbortError") say("バックアップを作れませんでした");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setBusy("restore");
    try {
      const r = await readBackupZip(file);
      if (!r.ok) {
        say(r.reason === "newer" ? "このバックアップは新しいバージョンのアプリで作られています。アプリを更新してください" : "そだてる庭のバックアップファイルではないようです");
        return;
      }
      const when = r.exportedAt ? `${r.exportedAt.slice(0, 10)} の` : "";
      if (!window.confirm(`${when}バックアップで今のデータを置き換えます。\n${describe(r.state)}\n\n今この端末にあるデータは消えます。よろしいですか？`)) return;
      const photos = await r.restorePhotos();
      dispatch({ type: "restore", state: { ...r.state, lastBackupAt: state.lastBackupAt } });
      say(`✅ 復元しました（写真 ${photos}枚）`);
    } catch {
      say("復元に失敗しました");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <section style={{ ...styles.notifyCard, marginTop: 14, borderColor: overdue ? "#ecd9ae" : "#e8e1d0" }} aria-label="バックアップ">
      <div style={styles.notifyLeft}>
        {overdue ? <ShieldAlert size={20} color="#c98b3a" aria-hidden="true" /> : <ShieldCheck size={20} color="#6b9d4f" aria-hidden="true" />}
        <div>
          <div style={styles.notifyTitle}>バックアップ</div>
          <div style={styles.notifySub}>
            {last ? `前回 ${last}` : "まだ保存していません"}
            {state.photos.length > 0 && ` ・ 写真 ${state.photos.length}枚はこの端末にだけあります`}
            {overdue && " ・ そろそろ保存を"}
          </div>
        </div>
      </div>
      <div style={styles.notifyRight}>
        <button style={{ ...styles.notifyToggleBtn, background: "#6b9d4f", opacity: busy ? 0.6 : 1 }} disabled={busy !== null} onClick={() => void save()}>
          <Download size={15} aria-hidden="true" style={{ verticalAlign: -3, marginRight: 4 }} />
          {busy === "save" ? "作成中…" : "バックアップを保存"}
        </button>
        <input ref={input} id={inputId} type="file" accept=".zip,application/zip" style={{ display: "none" }} onChange={(e) => void restore(e.target.files?.[0])} />
        <label htmlFor={inputId} style={{ ...styles.histBtn, opacity: busy ? 0.6 : 1 }}>
          <HardDriveUpload size={15} aria-hidden="true" /> {busy === "restore" ? "読み込み中…" : "復元"}
        </label>
      </div>
    </section>
  );
}
