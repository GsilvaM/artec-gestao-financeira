import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { MoneyValue, StatusBadge } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import type { FinancialEntryRow } from "@/domain/financeiro/types";

interface TransactionCardProps {
  transaction: FinancialEntryRow;
  onEdit?: (entry: FinancialEntryRow) => void;
  onDelete?: (entry: FinancialEntryRow) => void;
}

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const isReceita = transaction.type === "receita";

  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/25">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", isReceita ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive")}>
                {isReceita ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{transaction.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[transaction.categoryName, formatDate(transaction.date)].filter(Boolean).join(" / ")}
                </p>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-semibold leading-tight tabular-nums">
              <MoneyValue value={formatMoney(transaction.amount)} tone={isReceita ? "positive" : "negative"} />
            </p>
            <div className="mt-1 flex justify-end">
              <StatusBadge status={transaction.status} />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2">
          <span className="text-xs font-medium text-muted-foreground">{isReceita ? "Receita" : "Despesa"}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Acoes do lancamento">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                <Pencil className="size-4" />Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={() => onDelete?.(transaction)}>
                <Trash2 className="size-4" />Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
