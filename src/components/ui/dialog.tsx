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
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[24px] border border-border bg-surface p-0 text-text-primary shadow-elevated backdrop:bg-[rgba(3,10,24,0.56)] backdrop:backdrop-blur-[6px] sm:w-[calc(100vw-2rem)]"
      onClick={(e) => { if (e.target === ref.current) onOpenChange(false); }}
    >
      {children}
    </dialog>
  );
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props}>{children}</div>;
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-[20px] font-[850] leading-tight text-text-primary", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-text-secondary leading-relaxed", className)} {...props} />;
}

export function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 rounded-md p-2 text-text-muted transition hover:bg-surface-soft hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label="Fechar modal"
    >
      <X className="size-4" />
    </button>
  );
}
