import { FilterBar, MonthSelect, StatusSelect } from "@/components/layout/page-shell";

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  pago: "Pago",
  vencido: "Vencido",
};

function formatMonthFilter(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  if (!year || !monthIndex) return month;
  const date = new Date(year, monthIndex - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function TransactionFilters({
  search,
  onSearchChange,
  month,
  onMonthChange,
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
}) {
  const activeFilters = [
    month ? { key: "month", label: formatMonthFilter(month), onRemove: () => onMonthChange("") } : null,
    status ? { key: "status", label: statusLabels[status] ?? status, onRemove: () => onStatusChange("") } : null,
  ].filter((filter): filter is { key: string; label: string; onRemove: () => void } => Boolean(filter));

  return (
    <FilterBar
      searchPlaceholder="Buscar descrição, cliente ou fornecedor..."
      search={search}
      onSearchChange={onSearchChange}
      activeFilters={activeFilters}
    >
      <MonthSelect value={month} onValueChange={onMonthChange} />
      <StatusSelect value={status} onValueChange={onStatusChange} />
    </FilterBar>
  );
}
