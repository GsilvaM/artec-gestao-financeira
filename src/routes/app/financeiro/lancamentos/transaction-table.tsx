import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EmptyState, MoneyValue, StatusBadge } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import type { FinancialEntryRow } from "@/domain/financeiro/types";

interface TransactionTableProps {
  entries: FinancialEntryRow[];
  isLoading: boolean;
  error: boolean;
  onEdit: (entry: FinancialEntryRow) => void;
  onDelete: (entry: FinancialEntryRow) => void;
}

export function TransactionTable({ entries, isLoading, error, onEdit, onDelete }: TransactionTableProps) {
  const columns = ["Data", "Tipo", "Categoria", "Descrição", "Valor", "Status", "Ações"];

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              {columns.map((col) => <TableHead key={col}>{col}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              {columns.map((col) => <TableHead key={col}>{col}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center text-[#EF4444]">
                Erro ao carregar lançamentos
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    );
  }

  if (!entries.length) {
    return (
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              {columns.map((col) => <TableHead key={col}>{col}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="p-0">
                <EmptyState
                  title="Nenhum lançamento encontrado."
                  description="Use o botão Novo Lançamento para cadastrar receitas, custos ou despesas."
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              {columns.map((col) => (
                <TableHead key={col} className="sticky top-0 bg-[#F8FAFC]">{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow
                key={entry.id}
                className={cn(
                  "transition-colors duration-150 hover:bg-[#F8FAFC]",
                  index % 2 === 1 && "bg-[#FAFBFC]",
                )}
              >
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    entry.type === "receita"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700",
                  )}>
                    {entry.type === "receita" ? "Receita" : "Despesa"}
                  </span>
                </TableCell>
                <TableCell>{entry.categoryName}</TableCell>
                <TableCell className="font-medium">{entry.description}</TableCell>
                <TableCell>
                  <MoneyValue
                    value={formatMoney(entry.amount)}
                    tone={entry.type === "receita" ? "positive" : "negative"}
                  />
                </TableCell>
                <TableCell><StatusBadge status={entry.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações do lançamento">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onEdit(entry)}>
                        <Pencil className="size-4" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => onDelete(entry)}>
                        <Trash2 className="size-4" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
