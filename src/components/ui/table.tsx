import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-scroll relative w-full overflow-auto rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <table className={cn("w-full min-w-[720px] border-separate border-spacing-0 text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b-0", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn("border-t bg-[var(--surface-2)] font-medium [&>tr]:last:border-b-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("h-14 border-b border-border transition-colors duration-200 hover:bg-primary-soft data-[state=selected]:bg-[var(--surface-2)]", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "h-11 bg-[var(--surface-2)] px-4 text-left align-middle text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--muted-foreground)] first:rounded-l-[var(--radius-md)] last:rounded-r-[var(--radius-md)]",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-[var(--border-subtle)] px-4 py-3 align-middle text-[var(--foreground)]",
        className
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn("mt-4 text-sm text-text-muted", className)} {...props} />;
}
