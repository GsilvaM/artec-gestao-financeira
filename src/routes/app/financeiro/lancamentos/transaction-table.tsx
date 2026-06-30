import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

const columns = ["Data", "Tipo", "Categoria", "Descrição", "Vínculos", "Valor", "Status", "Ações"];

export function TransactionTable({ entries, isLoading, error, onEdit, onDelete }: TransactionTableProps) {
  if (isLoading) return <TableFrame state="loading" />;
  if (error) return <TableFrame state="error" />;
  if (!entries.length) return <TableFrame state="empty" />;

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isReceita = entry.type === "receita";
            return (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(entry.date)}</TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", isReceita ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive")}>
                    {isReceita ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                    {isReceita ? "Receita" : "Despesa"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.categoryName}</TableCell>
                <TableCell className="max-w-[320px] truncate font-medium" title={entry.description}>{entry.description}</TableCell>
                <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                  {[entry.clientName, entry.collaboratorName].filter(Boolean).join(" / ") || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <MoneyValue value={formatMoney(entry.amount)} tone={isReceita ? "positive" : "negative"} />
                </TableCell>
                <TableCell><StatusBadge status={entry.status} /></TableCell>
                <TableCell className="w-12">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" aria-label="Ações do lançamento">
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
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function TableFrame({ state }: { state: "loading" | "error" | "empty" }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => <TableHead key={col}>{col}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="p-0">
              {state === "loading" ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-8 gap-4">
                      <div className="h-4 animate-pulse rounded-full bg-surface-muted" />
                      <div className="h-4 animate-pulse rounded-full bg-surface-muted" />
                      <div className="h-4 animate-pulse rounded-full bg-surface-muted" />
                      <div className="col-span-2 h-4 animate-pulse rounded-full bg-surface-muted" />
                      <div className="h-4 animate-pulse rounded-full bg-surface-muted" />
                      <div className="h-4 animate-pulse rounded-full bg-surface-muted" />
                      <div className="h-4 animate-pulse rounded-full bg-surface-muted" />
                    </div>
                  ))}
                </div>
              ) : state === "error" ? (
                <div className="flex h-48 items-center justify-center text-sm font-medium text-destructive">
                  Erro ao carregar lançamentos.
                </div>
              ) : (
                <EmptyState title="Nenhum lançamento encontrado." description="Cadastre receitas, custos ou despesas para acompanhar o financeiro." />
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}

