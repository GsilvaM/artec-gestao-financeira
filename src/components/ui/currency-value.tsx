import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface CurrencyValueProps {
  value: number;
  tone?: "positive" | "negative" | "neutral";
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const toneClass: Record<NonNullable<CurrencyValueProps["tone"]>, string> = {
  positive: "text-[var(--color-positive)]",
  negative: "text-[var(--color-negative)]",
  neutral: "text-foreground",
};

const sizeClass: Record<NonNullable<CurrencyValueProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-[clamp(0.92rem,4.15vw,1.35rem)] sm:text-2xl",
  xl: "text-[clamp(1.15rem,5vw,1.75rem)] sm:text-3xl",
};

export function CurrencyValue({
  value,
  tone = "neutral",
  size = "md",
  animate = false,
  className,
}: CurrencyValueProps) {
  const [display, setDisplay] = useState(value);
  const previousValue = useRef(value);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    const crossesZero = (from < 0 && to >= 0) || (from >= 0 && to < 0);

    if (!animate || prefersReducedMotion || crossesZero) {
      setDisplay(value);
      previousValue.current = value;
      return;
    }

    const duration = 320;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    previousValue.current = value;
    return () => cancelAnimationFrame(frame);
  }, [animate, prefersReducedMotion, value]);

  return (
    <span
      className={cn(
        "inline-block max-w-full whitespace-nowrap font-bold leading-none tabular-nums tracking-normal",
        sizeClass[size],
        toneClass[tone],
        className,
      )}
    >
      {display.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}
    </span>
  );
}
