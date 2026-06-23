import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] shadow-sm transition-colors placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/35 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[#DC2626] aria-[invalid=true]:ring-[#DC2626]/20",
        className,
      )}
      {...props}
    />
  );
}
