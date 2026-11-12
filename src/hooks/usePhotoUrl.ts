import { useEffect, useState } from "react";
import { loadPhotoBlob } from "../ui/photoStore";

/** IndexedDB の写真を <img> 用の URL にする。読めなければ null（削除済み・別端末など） */
export function usePhotoUrl(id: string): string | null | "loading" {
  const [url, setUrl] = useState<string | null | "loading">("loading");
  useEffect(() => {
    let alive = true;
    let obj: string | null = null;
    setUrl("loading");
    loadPhotoBlob(id)
      .then((blob) => {
        if (!alive) return;
        obj = blob ? URL.createObjectURL(blob) : null;
        setUrl(obj);
      })
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [id]);
  return url;
}
