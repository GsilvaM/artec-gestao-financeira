import type { LucideIcon } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

export function SummaryCard({
  label,
  value,
  icon,
  iconColor,
  footer,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: "green" | "blue" | "red";
  footer?: string;
  className?: string;
}) {
  return <MetricCard label={label} value={value} icon={icon} iconColor={iconColor} footer={footer} className={className} />;
}
