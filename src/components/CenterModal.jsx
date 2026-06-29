import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function CenterModal({
  open,
  onClose,
  ariaLabel,
  children,
  className = "max-w-sm",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="center-modal fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="center-modal__backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Tutup"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={
          `center-modal__panel scrollbar-hide relative z-10 max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-xl border border-white/60 bg-white/95 p-4 shadow-xl shadow-indigo-500/20 backdrop-blur-md dark:border-slate-600/60 dark:bg-slate-900/95 dark:shadow-black/40 ${className}`
        }
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
