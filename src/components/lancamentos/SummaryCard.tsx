import type { LucideIcon } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CurrencyValue } from "@/components/ui/currency-value";

export function SummaryCard({
  label,
  value,
  icon,
  iconColor,
  footer,
  className,
  valueTone,
  currency = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: "green" | "blue" | "red";
  footer?: string;
  className?: string;
  valueTone?: "neutral" | "positive" | "negative";
  currency?: boolean;
}) {
  const displayValue =
    currency && typeof value === "number" ? (
      <CurrencyValue value={value} tone={valueTone} size="lg" />
    ) : (
      value
    );

  return <MetricCard label={label} value={displayValue} icon={icon} iconColor={iconColor} footer={footer} className={["summary-card", className].filter(Boolean).join(" ")} valueTone={currency ? "neutral" : valueTone} />;
}
