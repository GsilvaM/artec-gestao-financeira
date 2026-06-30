import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onOpenChange(false);
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onOpenChange]);

  return (
    <dialog
      ref={ref}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[28px] border border-border/90 bg-surface p-0 text-text-primary shadow-elevated backdrop:bg-[rgba(3,10,24,0.42)] backdrop:backdrop-blur-[8px] sm:w-[calc(100vw-2rem)]"
      onClick={(e) => { if (e.target === ref.current) onOpenChange(false); }}
    >
      {children}
    </dialog>
  );
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 sm:p-7", className)} {...props}>{children}</div>;
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 space-y-1.5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-7 flex flex-col-reverse gap-3 border-t border-border/80 pt-5 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-[21px] font-black leading-tight tracking-[-0.025em] text-text-primary", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-text-secondary leading-relaxed", className)} {...props} />;
}

export function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 rounded-2xl p-2 text-text-muted transition hover:bg-surface-soft hover:text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
      aria-label="Fechar modal"
    >
      <X className="size-4" />
    </button>
  );
}
