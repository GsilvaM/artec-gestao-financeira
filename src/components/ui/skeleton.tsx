import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md border border-border/50 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--surface-muted)_82%,transparent),color-mix(in_srgb,var(--primary)_10%,var(--surface-muted)),color-mix(in_srgb,var(--surface-muted)_82%,transparent))] bg-[length:220%_100%]",
        className,
      )}
      aria-hidden="true"
    />
  );
}
