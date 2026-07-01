import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SparklineChart } from "./SparklineChart";

type IconColor = "green" | "blue" | "red";

const iconStyles: Record<IconColor, string> = {
  green: "bg-[var(--success-soft)] text-[var(--success)]",
  blue: "bg-[var(--primary-soft)] text-[var(--primary)]",
  red: "bg-[var(--danger-soft)] text-[var(--danger)]",
};

const accentStyles: Record<IconColor, string> = {
  green: "from-[var(--color-revenue)]/45",
  blue: "from-[var(--color-balance)]/45",
  red: "from-[var(--color-expense)]/45",
};

export function MetricCard({
  label,
  value,
  delta,
  deltaUnavailableLabel,
  sparklineData,
  footer,
  icon: Icon,
  iconColor,
  className,
  title,
}: {
  label: string;
  value: string | number;
  delta?: number;
  deltaUnavailableLabel?: string;
  sparklineData?: number[];
  footer?: string;
  icon: LucideIcon;
  iconColor: IconColor;
  className?: string;
  title?: string;
}) {
  const isPositive = (delta ?? 0) >= 0;
  const DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const deltaContent = typeof delta === "number" ? (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold", isPositive ? "bg-success-light text-success" : "bg-destructive-light text-destructive")}>
      <DeltaIcon className="size-3.5 shrink-0" />
      <span>{isPositive ? "+" : ""}{delta.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% vs. mês anterior</span>
    </span>
  ) : deltaUnavailableLabel ? (
    <Badge variant="secondary" className="shrink-0 whitespace-nowrap border-transparent bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
      <span>{deltaUnavailableLabel}</span>
    </Badge>
  ) : null;

  return (
    <div
      className={cn(
        "relative flex h-full min-w-0 flex-col gap-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)] sm:px-6",
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent", accentStyles[iconColor])} />
      <p className="truncate text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--muted)]">{label}</p>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconStyles[iconColor])}>
          <Icon className="size-4" />
        </div>
        <p className="min-w-0 flex-1 truncate text-2xl font-bold leading-[1.1] text-[var(--foreground)] tabular-nums" title={title ?? String(value)}>{value}</p>
        {deltaContent}
      </div>
      <div className="h-8">
        {sparklineData?.length ? <SparklineChart data={sparklineData} color={iconColor} /> : null}
      </div>
      {footer ? <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{footer}</p> : null}
    </div>
  );
}
