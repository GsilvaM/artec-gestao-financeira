import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SparklineChart } from "./SparklineChart";

type IconColor = "green" | "blue" | "red";

const iconStyles: Record<IconColor, string> = {
  green: "bg-[var(--bg-success)] text-[var(--text-success)]",
  blue: "bg-[var(--bg-accent)] text-[var(--text-accent)]",
  red: "bg-[var(--bg-danger)] text-[var(--text-danger)]",
};

export function MetricCard({
  label,
  value,
  delta,
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
  sparklineData?: number[];
  footer?: string;
  icon: LucideIcon;
  iconColor: IconColor;
  className?: string;
  title?: string;
}) {
  const isPositive = (delta ?? 0) >= 0;
  const DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-[12px] border-[0.5px] border-border/70 bg-[var(--surface-card)] px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className={cn("absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg", iconStyles[iconColor])}>
        <Icon className="size-4" />
      </div>
      <p className="max-w-[calc(100%-2.75rem)] truncate text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</p>
      <p className="truncate text-[22px] font-medium leading-[1.1] text-[var(--text-primary)] tabular-nums" title={title ?? String(value)}>{value}</p>
      {typeof delta === "number" ? (
        <div className={cn("flex items-center gap-1 text-xs font-medium", isPositive ? "text-[var(--text-success)]" : "text-[var(--text-danger)]")}>
          <DeltaIcon className="size-3.5" />
          {isPositive ? "+" : ""}{delta.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% vs. mês anterior
        </div>
      ) : null}
      {sparklineData?.length ? <SparklineChart data={sparklineData} color={iconColor} /> : null}
      {footer ? <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{footer}</p> : null}
    </div>
  );
}
