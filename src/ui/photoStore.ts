/**
 * 写真の本体は IndexedDB に置く（localStorage は約5MBしかなく写真は入らない）。
 * 保存前に端末内で長辺1280pxのJPEGに縮小する（1枚 150〜300KB 程度）。
 */
const DB_NAME = "sodateru-niwa-photos";
const STORE = "photos";
export const MAX_EDGE = 1280;
const QUALITY = 0.82;

const supported = (): boolean => typeof indexedDB !== "undefined";

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
};

export const savePhotoBlob = (id: string, blob: Blob): Promise<void> =>
  supported() ? tx("readwrite", (s) => s.put(blob, id)).then(() => undefined) : Promise.reject(new Error("unsupported"));

export const loadPhotoBlob = (id: string): Promise<Blob | undefined> =>
  supported() ? tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>) : Promise.resolve(undefined);

export const deletePhotoBlob = (id: string): Promise<void> =>
  supported() ? tx("readwrite", (s) => s.delete(id)).then(() => undefined) : Promise.resolve();

/** 画像を長辺 MAX_EDGE px 以下の JPEG に縮小する。縮小できない環境では元のファイルをそのまま返す */
export async function shrinkImage(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", QUALITY));
    return out ?? file;
  } catch {
    return file;
  }
}

/** 概算の使用量（MB）。対応していなければ null */
export async function storageUsageMb(): Promise<number | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const { usage } = await navigator.storage.estimate();
  return usage === undefined ? null : Math.round((usage / 1_048_576) * 10) / 10;
}
