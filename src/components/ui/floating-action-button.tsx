import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: ReactNode;
  label: string;
  compactLabel?: string;
  loading?: boolean;
}

export function FloatingActionButton({
  icon,
  label,
  compactLabel,
  className,
  loading,
  disabled,
  ...props
}: FloatingActionButtonProps) {
  return (
    <Button
      {...props}
      type={props.type ?? "button"}
      loading={loading}
      disabled={disabled}
      leftIcon={icon}
      aria-label={label}
      className={cn("mobile-fab", className)}
    >
      <span>{compactLabel ?? label}</span>
    </Button>
  );
}
