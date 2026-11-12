import type { CSSProperties } from "react";
import { ImageOff } from "lucide-react";
import { usePhotoUrl } from "../hooks/usePhotoUrl";
import { styles } from "../styles";

interface Props {
  id: string;
  alt: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/** IndexedDB の写真を表示する。読めない（別端末・消去済み）ときは代わりのマーク */
export function PhotoThumb({ id, alt, style, onClick }: Props) {
  const url = usePhotoUrl(id);
  const box = { ...styles.photoThumb, ...style };
  if (url === "loading") return <div style={box} aria-hidden="true" />;
  if (url === null)
    return (
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dim)" }} title="この端末に画像がありません">
        <ImageOff size={18} aria-hidden="true" />
      </div>
    );
  const img = <img src={url} alt={alt} style={{ ...box, objectFit: "cover", display: "block" }} />;
  return onClick ? (
    <button onClick={onClick} style={styles.photoThumbBtn} aria-label={alt}>
      {img}
    </button>
  ) : (
    img
  );
}
