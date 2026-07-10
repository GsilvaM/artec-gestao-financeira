import { Button } from "./button";
import { Select } from "./select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  label?: string;
  className?: string;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const pageSizeOptions = [10, 20, 50, 100, 200].map((value) => ({
  value: String(value),
  label: `${value} por página`,
}));

export function DataTablePagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  label = "registros",
  className,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(currentPage, safeTotalPages);
  const start = total === 0 ? 0 : Math.min((safeCurrentPage - 1) * pageSize + 1, total);
  const end = Math.min(safeCurrentPage * pageSize, total);
  const hasPages = safeTotalPages > 1;

  function buildPageNumbers() {
    const maxVisible = 5;
    const pages: number[] = [];

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
      return pages;
    }

    const startPage = Math.min(
      Math.max(1, safeCurrentPage - 2),
      safeTotalPages - maxVisible + 1,
    );
    const endPage = Math.min(safeTotalPages, startPage + maxVisible - 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }

  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-4 shadow-[var(--shadow-xs)] lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">
          Mostrando {start}-{end} de {total} {label}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">
          Página {safeCurrentPage} de {safeTotalPages}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-bold uppercase text-muted-foreground">
              Exibir
            </span>
            <Select
              aria-label={`Quantidade de ${label} por página`}
              className="h-9 min-h-9 w-[156px] rounded-xl px-3 pr-9 text-xs"
              value={String(pageSize)}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              options={pageSizeOptions}
              disabled={isLoading}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={!hasPages || safeCurrentPage <= 1 || isLoading}
          >
            Anterior
          </Button>

          <div className="hidden items-center gap-2 sm:flex">
            {buildPageNumbers().map((page) => (
              <Button
                key={page}
                variant={page === safeCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                aria-current={page === safeCurrentPage ? "page" : undefined}
              >
                {page}
              </Button>
            ))}
          </div>

          <span className="inline-flex h-9 min-w-24 items-center justify-center rounded-xl border border-border bg-surface px-3 text-xs font-bold text-muted-foreground sm:hidden">
            {safeCurrentPage} / {safeTotalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={!hasPages || safeCurrentPage >= safeTotalPages || isLoading}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
