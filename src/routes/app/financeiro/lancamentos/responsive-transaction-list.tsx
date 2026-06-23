import { EmptyState } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import type { FinancialEntryRow } from "@/domain/financeiro/types";
import { TransactionCard } from "./transaction-card";
import { TransactionTable } from "./transaction-table";

interface ResponsiveTransactionListProps {
  entries: FinancialEntryRow[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onEdit: (entry: FinancialEntryRow) => void;
  onDelete: (entry: FinancialEntryRow) => void;
}

export function ResponsiveTransactionList({ entries, isLoading, error, onEdit, onDelete }: ResponsiveTransactionListProps) {
  if (isLoading) {
    return (
      <>
        <div className="block md:hidden">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-slate-100" />
                    <div className="h-4 w-20 rounded bg-slate-100" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded bg-slate-100" />
                  <div className="h-4 w-1/2 rounded bg-slate-100" />
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                </div>
                <div className="border-t border-[#E2E8F0] pt-2">
                  <div className="mb-1 h-3 w-10 rounded bg-slate-100" />
                  <div className="h-7 w-28 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <TransactionTable entries={[]} isLoading error={false} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="block md:hidden">
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="flex items-center justify-center p-8">
              <p className="text-[#EF4444]">Erro ao carregar lançamentos</p>
            </CardContent>
          </Card>
        </div>
        <div className="hidden md:block">
          <TransactionTable entries={[]} isLoading={false} error={true} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </>
    );
  }

  if (!entries?.length) {
    return (
      <>
        <div className="block md:hidden">
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-0">
              <EmptyState
                title="Nenhum lançamento encontrado."
                description="Use o botão Novo Lançamento para cadastrar receitas, custos ou despesas."
              />
            </CardContent>
          </Card>
        </div>
        <div className="hidden md:block">
          <TransactionTable entries={[]} isLoading={false} error={false} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="block md:hidden">
        <div className="space-y-3">
          {entries.map((entry) => (
            <TransactionCard
              key={entry.id}
              transaction={entry}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
      <div className="hidden md:block">
        <TransactionTable
          entries={entries}
          isLoading={false}
          error={false}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </>
  );
}
