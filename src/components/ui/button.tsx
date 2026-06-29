import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "motion-control inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_16px_30px_-22px_var(--primary)] hover:bg-primary-hover active:translate-y-px",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/92 active:translate-y-px",
        outline: "border border-border/80 bg-card text-card-foreground shadow-sm hover:border-primary/25 hover:bg-accent hover:text-accent-foreground active:translate-y-px",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-accent hover:text-accent-foreground active:translate-y-px",
        ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-11 px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
