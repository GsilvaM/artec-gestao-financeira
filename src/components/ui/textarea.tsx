import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "box-border flex min-h-[112px] w-full min-w-0 resize-y rounded-[var(--radius-field)] border border-[var(--color-border-field)] bg-[var(--color-bg-field)] px-4 py-3 text-base font-semibold leading-normal text-foreground shadow-[var(--shadow-xs)] transition-all duration-200 ease-out placeholder:text-muted-foreground hover:border-primary/45 hover:bg-[var(--surface)] focus-visible:border-[var(--color-border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-border-focus)_24%,transparent)] disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
