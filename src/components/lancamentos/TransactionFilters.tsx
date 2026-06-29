import { FilterBar, MonthSelect, StatusSelect } from "@/components/layout/page-shell";

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
  return (
    <FilterBar searchPlaceholder="Buscar descrição, cliente ou fornecedor..." search={search} onSearchChange={onSearchChange}>
      <MonthSelect value={month} onValueChange={onMonthChange} />
      <StatusSelect value={status} onValueChange={onStatusChange} />
    </FilterBar>
  );
}
