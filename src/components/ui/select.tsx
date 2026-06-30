import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex w-full min-h-[46px] rounded-2xl border border-border bg-surface text-text-primary px-4 text-sm font-semibold shadow-[var(--shadow-xs)] transition-all duration-160 ease-in-out hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[4px] focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
        props.value === "" ? "text-text-muted" : "text-text-primary",
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
