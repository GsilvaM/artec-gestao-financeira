import { cn } from "@/lib/utils";
import { Children, cloneElement, createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DropdownContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
  triggerId: string;
  contentId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentStyle: React.CSSProperties;
  setContentStyle: (style: React.CSSProperties) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("DropdownMenu components must be used within <DropdownMenu>");
  return ctx;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [contentStyle, setContentStyle] = useState<React.CSSProperties>({});
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, toggle, close, triggerId: `dtrig-${id}`, contentId: `dcont-${id}`, triggerRef, contentStyle, setContentStyle }}>
      <div className="inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

export function DropdownMenuTrigger({ children, asChild, className, ...props }: DropdownMenuTriggerProps & Record<string, unknown>) {
  const { open, toggle, triggerId, contentId, triggerRef, setContentStyle } = useDropdown();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setContentStyle({
        position: "fixed",
        top: `${rect.bottom + 4}px`,
        left: `${Math.max(8, rect.right - 160)}px`,
        zIndex: 9999,
      });
    }
    toggle();
  };

  if (asChild) {
    const child = Children.only(children) as ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }>;
    const mergedClassName = cn(child.props.className, className);

    return cloneElement(child, {
      ref: triggerRef,
      id: child.props.id ?? triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": contentId,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) handleClick(e);
      },
      className: mergedClassName,
      ...props,
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      id={triggerId}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={contentId}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, contentId, contentStyle } = useDropdown();
  if (!open) return null;

  const content = (
    <div
      ref={(ref) => { if (ref) (ref as HTMLDivElement).focus(); }}
      id={contentId}
      role="menu"
      aria-orientation="vertical"
      style={contentStyle}
      className={cn(
        "min-w-[9rem] origin-top-right animate-in fade-in-0 zoom-in-95 rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-[0_10px_38px_-10px_rgba(15,23,42,0.35),0_0_0_1px_rgba(0,0,0,0.05)] focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );

  return createPortal(content, document.body);
}

export function DropdownMenuItem({ children, className, onClick, destructive, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { destructive?: boolean }) {
  const { close } = useDropdown();
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => { onClick?.(e); close(); }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium outline-none transition",
        destructive
          ? "text-[#EF4444] hover:bg-red-50 focus-visible:bg-red-50"
          : "text-[#0F172A] hover:bg-[#F1F5F9] focus-visible:bg-[#F1F5F9]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-1 my-1 border-t border-[#E2E8F0]", className)} {...props} />;
}
