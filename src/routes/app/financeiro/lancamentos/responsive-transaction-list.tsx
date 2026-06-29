import { EmptyState } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import type { FinancialEntryRow } from "@/domain/financeiro/types";
import { useEffect, useState } from "react";
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
  const isDesktop = useIsDesktop();

  if (isLoading) {
    return isDesktop ? (
      <TransactionTable entries={[]} isLoading error={false} onEdit={onEdit} onDelete={onDelete} />
    ) : (
      <div className="block md:hidden">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="size-7 animate-pulse rounded-md bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
                <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="h-px bg-border/70" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return isDesktop ? (
      <TransactionTable entries={[]} isLoading={false} error={true} onEdit={onEdit} onDelete={onDelete} />
    ) : (
      <div className="block md:hidden">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-sm font-medium text-destructive">Erro ao carregar lançamentos.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entries?.length) {
    return isDesktop ? (
      <TransactionTable entries={[]} isLoading={false} error={false} onEdit={onEdit} onDelete={onDelete} />
    ) : (
      <div className="block md:hidden">
        <Card>
          <CardContent className="p-0">
            <EmptyState title="Nenhum lançamento encontrado." description="Cadastre receitas, custos ou despesas para acompanhar o financeiro." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return isDesktop ? (
    <TransactionTable entries={entries} isLoading={false} error={false} onEdit={onEdit} onDelete={onDelete} />
  ) : (
    <div className="block md:hidden">
      <div className="space-y-2">
        {entries.map((entry) => (
          <TransactionCard key={entry.id} transaction={entry} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === "undefined" || !window.matchMedia ? true : window.matchMedia("(min-width: 768px)").matches));

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
