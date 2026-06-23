import { ArrowDownCircle, ArrowUpCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

const statusDotColor: Record<string, string> = {
  pending: "bg-[#2F73B8]",
  confirmed: "bg-[#10B981]",
  cancelled: "bg-[#EF4444]",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const isReceita = transaction.type === "receita";

  return (
    <Card className="rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isReceita
              ? <ArrowUpCircle className="size-4 text-[#10B981]" />
              : <ArrowDownCircle className="size-4 text-[#EF4444]" />
            }
            <span className="text-xs font-semibold text-[#0F172A]">
              {isReceita ? "Receita" : "Despesa"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full", statusDotColor[transaction.status] ?? "bg-slate-400")} />
              <span className="text-[10px] font-medium text-[#64748B]">{statusLabels[transaction.status] ?? transaction.status}</span>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6" aria-label="Ações do lançamento">
                  <MoreHorizontal className="size-3.5" />
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

        <p className="mt-1.5 text-sm font-semibold text-[#0F172A] leading-tight">{transaction.description}</p>

        <p className="mt-0.5 text-xs text-[#64748B]">
          {[transaction.categoryName, formatDate(transaction.date)].filter(Boolean).join(" • ")}
        </p>

        <p className="mt-1 text-lg font-bold tabular-nums leading-tight">
          <MoneyValue
            value={formatMoney(transaction.amount)}
            tone={isReceita ? "positive" : "negative"}
          />
        </p>
      </CardContent>
    </Card>
  );
}
