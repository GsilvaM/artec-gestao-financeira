import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-soft text-primary",
        secondary: "border-transparent bg-surface-soft text-text-secondary",
        destructive: "border-transparent bg-danger-soft text-danger-strong",
        outline: "border-border bg-card text-card-foreground",
        success: "border-transparent bg-success-soft text-success-strong",
        warning: "border-transparent bg-warning-soft text-warning-strong",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
