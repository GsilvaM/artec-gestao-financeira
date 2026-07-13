import { ArrowDown, ArrowUp, Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FinancialEntryRow } from "@/domain/financeiro/types";
import { cn, formatDate, formatMoney } from "@/lib/utils";

const statusStyles: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmado", className: "bg-[var(--bg-success)] text-[var(--text-success)]" },
  pending: { label: "Pendente", className: "bg-[var(--bg-warning)] text-[var(--text-warning)]" },
  cancelled: { label: "Cancelado", className: "bg-[var(--bg-danger)] text-[var(--text-danger)]" },
  reversed: { label: "Estornado", className: "bg-[var(--bg-danger)] text-[var(--text-danger)]" },
  pago: { label: "Pago", className: "bg-[var(--bg-success)] text-[var(--text-success)]" },
  aberto: { label: "Aberto", className: "bg-[var(--bg-warning)] text-[var(--text-warning)]" },
  vencido: { label: "Vencido", className: "bg-[var(--bg-danger)] text-[var(--text-danger)]" },
};

function TransactionStatusBadge({ status }: { status: string }) {
  const meta = statusStyles[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold leading-none", meta.className)}>
      {meta.label}
    </span>
  );
}

export function TransactionCard({
  transaction,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  transaction: FinancialEntryRow;
  onEdit?: (entry: FinancialEntryRow) => void;
  onDuplicate?: (entry: FinancialEntryRow) => void;
  onDelete?: (entry: FinancialEntryRow) => void;
}) {
  const isReceita = transaction.type === "receita";

  return (
    <Card className="transaction-mobile-card overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface)] transition duration-200 hover:border-primary/25 hover:shadow-[var(--shadow-xs)]">
      <CardContent className="p-3.5">
        <div className="flex items-start gap-2.5">
          <span className={cn("mt-px flex size-8 shrink-0 items-center justify-center rounded-full", isReceita ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]")}>
            {isReceita ? <ArrowUp className="size-[13px]" /> : <ArrowDown className="size-[13px]" />}
          </span>
          <div className="transaction-mobile-copy min-w-0 flex-1">
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-medium leading-5 text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                <span className="transaction-mobile-title block group-open:line-clamp-none group-open:break-words">{transaction.description}</span>
                <span className="sr-only">Toque para alternar a descricao completa</span>
              </summary>
            </details>
            <p className="transaction-mobile-meta mt-px text-[11px] leading-4 text-[var(--text-muted)]">
              {[transaction.categoryName, formatDate(transaction.date)].filter(Boolean).join(" - ")}
            </p>
            {transaction.clientName || transaction.collaboratorName ? (
              <p className="transaction-mobile-party mt-px text-[11px] leading-4 text-[var(--text-muted)]">
                {[transaction.clientName, transaction.collaboratorName].filter(Boolean).join(" / ")}
              </p>
            ) : null}
          </div>
          <div className="transaction-mobile-value shrink-0 text-right">
            <p className={cn("text-sm font-extrabold leading-5 tabular-nums", isReceita ? "text-[var(--text-success)]" : "text-[var(--text-danger)]")}>
              {formatMoney(transaction.amount)}
            </p>
            <div className="mt-1 flex justify-end">
              <TransactionStatusBadge status={transaction.status} />
            </div>
          </div>
        </div>

        <div className="transaction-mobile-footer">
          <span className={cn("transaction-type-pill", isReceita ? "bg-[var(--bg-success)] text-[var(--text-success)]" : "bg-[var(--bg-danger)] text-[var(--text-danger)]")}>{transaction.type}</span>
          <div className="transaction-mobile-actions" aria-label="Acoes do lancamento">
            <Button variant="ghost" size="sm" className="transaction-action-btn" onClick={() => onEdit?.(transaction)} aria-label={`Editar ${transaction.description}`}>
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button variant="ghost" size="sm" className="transaction-action-btn" onClick={() => onDuplicate?.(transaction)} aria-label={`Duplicar ${transaction.description}`}>
              <Copy className="size-4" />
              Duplicar
            </Button>
            <Button variant="ghost" size="icon" className="transaction-action-danger" onClick={() => onDelete?.(transaction)} aria-label={`Excluir ${transaction.description}`}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
