import { cn } from "@/lib/utils";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-bold text-text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}
