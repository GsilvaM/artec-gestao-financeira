import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-xl border border-border bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-out placeholder:text-muted-foreground hover:border-primary/45 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30",
        className
      )}
      {...props}
    />
  );
}
