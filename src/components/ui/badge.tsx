import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex h-6 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary-soft text-primary",
        secondary: "border-border bg-surface-soft text-text-secondary",
        destructive: "border-danger/15 bg-danger-soft text-danger-strong",
        outline: "border-border bg-card text-card-foreground",
        success: "border-success/15 bg-success-soft text-success-strong",
        warning: "border-warning/20 bg-warning-soft text-warning-strong",
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
