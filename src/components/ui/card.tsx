import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("motion-card rounded-xl border border-border/75 bg-card text-card-foreground shadow-[var(--shadow-card)]", className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("flex flex-col space-y-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <div className={cn("font-semibold leading-tight tracking-normal", className)} {...props} />;
}

export function CardDescription({ className, ...props }: CardProps) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn("flex items-center p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}
