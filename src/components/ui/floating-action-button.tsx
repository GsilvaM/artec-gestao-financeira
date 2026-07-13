import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: ReactNode;
  label: string;
  compactLabel?: string;
  loading?: boolean;
}

export function FloatingActionButton({
  icon,
  label,
  compactLabel,
  className,
  loading,
  disabled,
  ...props
}: FloatingActionButtonProps) {
  const [scrolled, setScrolled] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    let timeout = 0;
    function handleScroll() {
      setScrolled(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setScrolled(false), 180);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prefersReducedMotion]);

  return (
    <Button
      {...props}
      type={props.type ?? "button"}
      loading={loading}
      disabled={disabled}
      leftIcon={icon}
      aria-label={label}
      className={cn("mobile-fab", scrolled && "mobile-fab-scrolled", className)}
    >
      <span>{compactLabel ?? label}</span>
    </Button>
  );
}
