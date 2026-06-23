import { ArrowDownCircle, ArrowUpCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
    <Card className="rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex size-8 items-center justify-center rounded-full",
              isReceita ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
            )}>
              {isReceita
                ? <ArrowUpCircle className="size-5" />
                : <ArrowDownCircle className="size-5" />
              }
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">
              {isReceita ? "Receita" : "Despesa"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={transaction.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Ações do lançamento">
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
        </div>

        <div className="mt-4">
          <p className="text-base font-semibold text-[#0F172A]">{transaction.description}</p>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-[#64748B]">
              <span className="text-xs text-[#94A3B8]">Categoria: </span>
              {transaction.categoryName}
            </p>
            <p className="text-sm text-[#64748B]">
              <span className="text-xs text-[#94A3B8]">Data: </span>
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-[#E2E8F0] pt-3">
          <p className="text-xs text-[#94A3B8]">Valor</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            <MoneyValue
              value={formatMoney(transaction.amount)}
              tone={isReceita ? "positive" : "negative"}
            />
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
