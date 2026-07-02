import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, placeholder, ...props },
  ref,
) {
  return (
    <span className="relative block w-full min-w-0">
      <select
        ref={ref}
        className={cn(
          "flex min-h-[var(--field-height)] w-full appearance-none rounded-[var(--radius-field)] border border-[var(--color-border-field)] bg-[var(--color-bg-field)] px-4 pr-10 text-sm font-semibold leading-none text-foreground shadow-[var(--shadow-xs)] transition-all duration-200 ease-out hover:border-primary/45 hover:bg-[var(--surface)] focus-visible:border-[var(--color-border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-border-focus)_24%,transparent)] disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30",
          props.value === "" ? "text-text-muted" : "text-text-primary",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
    </span>
  );
});
