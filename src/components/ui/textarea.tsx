import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[112px] w-full resize-y rounded-xl border border-border bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-foreground shadow-[var(--shadow-xs)] transition-all duration-200 ease-out placeholder:text-muted-foreground hover:border-primary/45 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    />
  );
}
