import { styles } from "../styles";

/** 読み上げ領域は常に存在させ、中身だけ出し入れする */
export function Toast({ message }: { message: string | null }) {
  return (
    <div role="status" aria-live="polite" style={styles.toastWrap}>
      {message && <div style={styles.toast}>{message}</div>}
    </div>
  );
}
