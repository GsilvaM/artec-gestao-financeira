import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "motion-control inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(21,94,239,0.2)] hover:bg-primary-hover hover:shadow-[0_14px_30px_rgba(21,94,239,0.28)] active:translate-y-px",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:translate-y-px",
        outline:
          "border border-border bg-card text-card-foreground shadow-sm hover:border-border-strong hover:bg-surface-muted active:translate-y-px",
        secondary:
          "bg-surface-soft text-text-primary border border-border hover:bg-surface-muted hover:border-border-strong active:translate-y-px",
        ghost:
          "text-text-secondary hover:bg-surface-soft hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[42px] px-4 py-2",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-11 px-6",
        icon: "size-[42px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children && <span>{children}</span>}
      {rightIcon}
    </button>
  );
}
