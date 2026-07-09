import { Button } from "./button";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  label?: string;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  label = "registros",
  isLoading,
  onPageChange,
}: DataTablePaginationProps) {
  if (totalPages <= 1) return null;

  const start = Math.min((currentPage - 1) * pageSize + 1, total);
  const end = Math.min(currentPage * pageSize, total);

  function buildPageNumbers() {
    const maxVisible = 5;
    const pages: number[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const s = Math.max(1, currentPage - 2);
    const e = Math.min(totalPages, s + maxVisible - 1);
    for (let i = s; i <= e; i++) pages.push(i);
    return pages;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-4 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {start}–{end} de {total} {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        >
          Anterior
        </Button>
        {buildPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            disabled={isLoading}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
