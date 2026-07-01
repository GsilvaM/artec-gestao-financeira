import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function Card({ elevated = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "motion-card rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-sm)]",
        elevated && "shadow-elevated",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("flex flex-col gap-2 p-4 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <h3 className={cn("text-xl font-bold leading-tight text-[var(--foreground)]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: CardProps) {
  return <p className={cn("text-sm text-[var(--muted-foreground)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn("flex items-center p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}
