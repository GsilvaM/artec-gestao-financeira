import { cn } from "@/lib/utils";
import { Children, cloneElement, createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DropdownContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
  triggerId: string;
  contentId: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
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
    <DropdownContext.Provider value={{ open, toggle, close, triggerId: `dtrig-${id}`, contentId: `dcont-${id}`, triggerRef, contentRef, contentStyle, setContentStyle }}>
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
      const menuWidth = 176;
      const viewportPadding = 8;
      const left = Math.min(
        Math.max(viewportPadding, rect.right - menuWidth),
        Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding)
      );
      setContentStyle({
        position: "fixed",
        top: `${rect.bottom + 4}px`,
        left: `${left}px`,
        width: `${menuWidth}px`,
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
      className={cn(
        "inline-flex items-center justify-center gap-2 leading-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, contentId, triggerRef, contentRef, contentStyle, setContentStyle } = useDropdown();

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 4;
    const menuWidth = contentRect.width || 176;
    const menuHeight = contentRect.height;
    const left = Math.min(
      Math.max(viewportPadding, triggerRect.right - menuWidth),
      Math.max(viewportPadding, window.innerWidth - menuWidth - viewportPadding),
    );
    const topBelow = triggerRect.bottom + gap;
    const topAbove = triggerRect.top - menuHeight - gap;
    const hasRoomBelow = topBelow + menuHeight <= window.innerHeight - viewportPadding;
    const top = hasRoomBelow ? topBelow : Math.max(viewportPadding, topAbove);

    setContentStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      maxHeight: `calc(100vh - ${viewportPadding * 2}px)`,
      overflowY: "auto",
      zIndex: 9999,
    });
  }, [contentRef, open, setContentStyle, triggerRef]);

  if (!open) return null;

  const content = (
    <div
      ref={(ref) => {
        contentRef.current = ref;
        if (ref) ref.focus();
      }}
      id={contentId}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
      style={contentStyle}
      className={cn(
        "max-w-[calc(100vw-1rem)] origin-top-right animate-in fade-in-0 zoom-in-95 rounded-2xl border border-border/90 bg-popover/95 p-1.5 text-popover-foreground shadow-elevated backdrop-blur focus:outline-none",
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
        "inline-flex h-10 w-full cursor-pointer items-center justify-start gap-2 rounded-xl px-3 text-left text-sm font-bold leading-none outline-none transition [&_svg]:size-4 [&_svg]:shrink-0",
        destructive
          ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
          : "text-foreground hover:bg-accent focus-visible:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-1 my-1 border-t border-border", className)} {...props} />;
}
