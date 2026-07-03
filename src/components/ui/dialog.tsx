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
      className="dialog-shell fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[28px] border border-border/90 bg-surface p-0 text-text-primary shadow-elevated backdrop:bg-[rgba(3,10,24,0.42)] backdrop:backdrop-blur-[8px] sm:w-[calc(100vw-2rem)]"
      onClick={(e) => { if (e.target === ref.current) onOpenChange(false); }}
    >
      {children}
    </dialog>
  );
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-[var(--color-bg-modal)] p-0 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--primary)_12%,transparent)]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent",
        "[&>form]:contents [&>form>div:first-child]:px-5 [&>form>div:first-child]:py-5 sm:[&>form>div:first-child]:px-6",
        "[&>.grid]:px-5 [&>.grid]:py-5 sm:[&>.grid]:px-6",
        "[&_.form-dialog-panel]:px-5 [&_.form-dialog-panel]:py-5 sm:[&_.form-dialog-panel]:px-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-0 space-y-2 border-b border-border/80 px-5 pb-4 pt-5 pr-14 sm:px-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dialog-footer mt-0 flex flex-col-reverse gap-3 border-t border-border/80 px-5 pb-5 pt-4 sm:flex-row sm:justify-end sm:px-6 [&>button]:w-full sm:[&>button]:w-auto", className)} {...props} />;
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
      className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-xl p-0 leading-none text-text-muted transition hover:bg-surface-soft hover:text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 [&_svg]:size-4 [&_svg]:shrink-0"
      aria-label="Fechar modal"
    >
      <X className="size-4" />
    </button>
  );
}
