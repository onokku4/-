import { useId, useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { newId } from "../ui/id";
import { savePhotoBlob, shrinkImage } from "../ui/photoStore";
import { styles } from "../styles";

interface Props {
  bedId: string;
  dispatch: (a: Action) => void;
  say: (m: string) => void;
  compact?: boolean;
}

/** カメラ／写真から1枚選び、縮小して保存し、成長記録として登録する */
export function PhotoCapture({ bedId, dispatch, say, compact }: Props) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await shrinkImage(file);
      const id = newId();
      await savePhotoBlob(id, blob);
      const today = localDate();
      dispatch({ type: "addPhoto", id, bedId, date: today, note: "", today });
    } catch {
      say("写真を保存できませんでした（この端末の保存領域が使えない可能性があります）");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <label htmlFor={inputId} style={{ ...(compact ? styles.photoBtnCompact : styles.photoBtn), opacity: busy ? 0.6 : 1 }}>
        <Camera size={15} aria-hidden="true" /> {busy ? "保存中…" : compact ? "撮る" : "成長を写真で記録"}
      </label>
    </>
  );
}
