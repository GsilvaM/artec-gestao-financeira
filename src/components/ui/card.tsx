import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("rounded-lg border border-border/80 bg-card text-card-foreground shadow-[var(--shadow-card)]", className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("flex flex-col space-y-1.5 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <div className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: CardProps) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}
