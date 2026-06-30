import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex w-full min-h-[112px] rounded-2xl border border-border bg-surface text-text-primary px-4 py-3 text-sm font-semibold shadow-[var(--shadow-xs)] transition-all duration-160 ease-in-out placeholder:text-text-muted hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[4px] focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical",
        className,
      )}
      {...props}
    />
  );
}
