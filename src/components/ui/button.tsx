import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  "motion-control inline-flex box-border items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold leading-none align-middle transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.98] [&_span]:inline-flex [&_span]:items-center [&_span]:leading-none [&_svg]:pointer-events-none [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[var(--shadow-md)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline:
          "border border-border bg-surface text-foreground shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft",
        secondary:
          "border border-border bg-[var(--surface-2)] text-foreground shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-[var(--surface-3)]",
        ghost:
          "text-muted-foreground hover:bg-[var(--surface-2)] hover:text-foreground hover:-translate-y-px",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 min-h-10 px-4",
        sm: "h-9 min-h-9 px-4 text-sm",
        lg: "h-11 min-h-11 px-5",
        icon: "size-10 min-h-10 min-w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type IconButtonProps = Omit<ButtonProps, "children" | "leftIcon" | "rightIcon"> & {
  children: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    loading,
    leftIcon,
    rightIcon,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent leading-none"
          aria-hidden="true"
        />
      ) : (
        leftIcon
      )}
      {children}
      {rightIcon}
    </button>
  );
});

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    className,
    variant = "ghost",
    size = "icon",
    children,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </Button>
  );
});
