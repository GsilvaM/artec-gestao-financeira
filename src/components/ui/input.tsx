import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex w-full min-h-[46px] rounded-2xl border border-border bg-surface text-text-primary px-4 py-2 text-sm font-semibold transition-all duration-160 ease-in-out placeholder:text-text-muted hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[4px] focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/10",
        className
      )}
      {...props}
    />
  );
}
