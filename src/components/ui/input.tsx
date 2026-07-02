import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, type, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-xl border border-border bg-[var(--surface-2)] px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-xs)] transition-all duration-200 ease-out placeholder:text-muted-foreground hover:border-primary/45 hover:bg-[var(--surface)] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30",
        className
      )}
      {...props}
    />
  );
});
