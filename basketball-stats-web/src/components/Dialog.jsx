import { useEffect, useRef, useId } from "react";

export default function Dialog({ children, onClose, title, drawer = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog ref={ref} className={drawer ? "stats-dialog stats-drawer" : "stats-dialog"}
      aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === ref.current) onClose(); }}>
      <div className="dialog-content">
        <h2 id={titleId} className="sr-only">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
