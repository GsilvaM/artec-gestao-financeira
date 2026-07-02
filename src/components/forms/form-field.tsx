import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { Label } from "@/components/ui/label";

type FieldControl = ReactElement<{
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const generatedId = useId();
  const inputId = `field-${generatedId}`;
  const errorId = `${inputId}-error`;
  const child = isValidElement(children) ? (children as FieldControl) : null;

  const control = child
    ? cloneElement(child, {
        id: child.props.id ?? inputId,
        "aria-describedby": error ? errorId : child.props["aria-describedby"],
        "aria-invalid": Boolean(error) || child.props["aria-invalid"],
      })
    : children;

  return (
    <div className="group/form-field grid gap-1.5">
      <Label
        htmlFor={child ? child.props.id ?? inputId : undefined}
        className="text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground transition-colors group-focus-within/form-field:text-[var(--color-border-focus)]"
      >
        {label}
      </Label>
      {control}
      {error ? (
        <p id={errorId} className="min-h-4 text-xs font-semibold leading-4 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
