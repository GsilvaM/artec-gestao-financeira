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
    <div className="space-y-2">
      <Label htmlFor={child ? child.props.id ?? inputId : undefined}>{label}</Label>
      {control}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
