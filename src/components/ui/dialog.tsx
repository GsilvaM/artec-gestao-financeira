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
      className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-0 text-card-foreground shadow-[0_24px_64px_-28px_rgba(0,0,0,0.42)] backdrop:bg-slate-950/45 backdrop:backdrop-blur-[2px] open:animate-in open:fade-in-0 open:zoom-in-95 sm:w-[calc(100vw-2rem)]"
      onClick={(e) => { if (e.target === ref.current) onOpenChange(false); }}
    >
      {children}
    </dialog>
  );
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props}>{children}</div>;
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5 border-b border-border/80 pb-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 flex flex-col-reverse gap-2 border-t border-border/80 pt-4 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold leading-7 tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label="Fechar modal"
    >
      <X className="size-4" />
    </button>
  );
}
