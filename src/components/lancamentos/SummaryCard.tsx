import type { LucideIcon } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

export function SummaryCard({
  label,
  value,
  icon,
  iconColor,
  footer,
  className,
  valueTone,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: "green" | "blue" | "red";
  footer?: string;
  className?: string;
  valueTone?: "neutral" | "positive" | "negative";
}) {
  return <MetricCard label={label} value={value} icon={icon} iconColor={iconColor} footer={footer} className={["summary-card", className].filter(Boolean).join(" ")} valueTone={valueTone} />;
}
