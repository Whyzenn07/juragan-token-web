"use client";

import { ReactNode, useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  panelClassName: string;
  align?: "center" | "end";
  children: ReactNode;
};

// Dialog dengan focus trap, Escape, pemulihan fokus ke pemicu, dan kunci scroll halaman.
export function Dialog({ open, onClose, label, panelClassName, align = "center", children }: DialogProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (focusables()[0] ?? panel)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={`overlay ${align}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={panelRef} className={panelClassName} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </section>
    </div>
  );
}
