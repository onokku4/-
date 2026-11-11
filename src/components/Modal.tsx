import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useEscape } from "../hooks/useEscape";
import { styles } from "../styles";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** role="dialog" の共通枠。Escape・背景クリックで閉じ、開いたらフォーカスを移す */
export function Modal({ title, onClose, children }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onClose);

  useEffect(() => {
    const before = document.activeElement;
    ref.current?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  return (
    <div
      style={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} style={styles.modal}>
        <div style={styles.modalHead}>
          <h2 id={titleId} style={styles.modalTitle}>
            {title}
          </h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="閉じる">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
