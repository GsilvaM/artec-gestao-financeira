import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { MoneyValue } from "@/components/layout/page-shell";
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

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "text-[#2F73B8]",
  confirmed: "text-[#10B981]",
  cancelled: "text-[#EF4444]",
};

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const isReceita = transaction.type === "receita";

  return (
    <Card className="rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="space-y-1">
          {/* Linha principal: descrição + valor */}
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 break-words text-sm font-medium leading-tight text-[#0F172A]">
              {transaction.description}
            </p>
            <p className="shrink-0 text-lg font-semibold leading-tight tabular-nums">
              <MoneyValue
                value={formatMoney(transaction.amount)}
                tone={isReceita ? "positive" : "negative"}
              />
            </p>
          </div>

          {/* Linha secundária: categoria • data */}
          <p className="truncate text-xs text-[#64748B]">
            {[transaction.categoryName, formatDate(transaction.date)].filter(Boolean).join(" • ")}
          </p>

          {/* Linha inferior: tipo + status + ações */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-[#64748B]">
              {isReceita
                ? <ArrowUp className="size-3 text-[#10B981]" />
                : <ArrowDown className="size-3 text-[#EF4444]" />
              }
              {isReceita ? "Receita" : "Despesa"}
              <span className="text-[#94A3B8]">•</span>
              <span className={cn(statusColors[transaction.status] ?? "text-[#64748B]")}>
                {statusLabels[transaction.status] ?? transaction.status}
              </span>
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-5" aria-label="Ações do lançamento">
                  <MoreHorizontal className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                  <Pencil className="size-3.5" />Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => onDelete?.(transaction)}>
                  <Trash2 className="size-3.5" />Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
