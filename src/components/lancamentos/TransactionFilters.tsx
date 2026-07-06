import { FilterBar, StatusSelect } from "@/components/layout/page-shell";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { CategoryRow } from "@/domain/financeiro/types";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Efetivado",
  cancelled: "Cancelado",
  reversed: "Estornado",
};

const typeLabels: Record<string, string> = {
  receita: "Receitas",
  despesa: "Despesas",
};

const periodLabels: Record<string, string> = {
  today: "Hoje",
  week: "Semana",
  month: "Mês",
  year: "Ano",
  custom: "Personalizado",
};

const originLabels: Record<string, string> = {
  manual: "Manual",
  accounts_payable: "Contas a pagar",
  accounts_receivable: "Contas a receber",
  import: "Importação",
  system: "Sistema",
};

const paymentMethodOptions = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "outros", label: "Outros" },
];

function formatDateFilter(value: string) {
  if (!value) return "";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

export function TransactionFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  period,
  onPeriodChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  categoryId,
  onCategoryChange,
  categories,
  origin,
  onOriginChange,
  paymentMethod,
  onPaymentMethodChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  period: string;
  onPeriodChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: CategoryRow[];
  origin: string;
  onOriginChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
}) {
  const category = categories.find((item) => item.id === categoryId);
  const activeFilters = [
    type ? { key: "type", label: typeLabels[type] ?? type, onRemove: () => onTypeChange("") } : null,
    status ? { key: "status", label: statusLabels[status] ?? status, onRemove: () => onStatusChange("") } : null,
    period ? { key: "period", label: periodLabels[period] ?? period, onRemove: () => onPeriodChange("") } : null,
    period === "custom" && dateFrom ? { key: "from", label: `Desde ${formatDateFilter(dateFrom)}`, onRemove: () => onDateFromChange("") } : null,
    period === "custom" && dateTo ? { key: "to", label: `Até ${formatDateFilter(dateTo)}`, onRemove: () => onDateToChange("") } : null,
    categoryId ? { key: "category", label: category?.name ?? "Categoria", onRemove: () => onCategoryChange("") } : null,
    origin ? { key: "origin", label: originLabels[origin] ?? origin, onRemove: () => onOriginChange("") } : null,
    paymentMethod ? { key: "payment", label: paymentMethodOptions.find((item) => item.value === paymentMethod)?.label ?? paymentMethod, onRemove: () => onPaymentMethodChange("") } : null,
  ].filter((filter): filter is { key: string; label: string; onRemove: () => void } => Boolean(filter));

  return (
    <FilterBar
      searchPlaceholder="Buscar descrição, fornecedor, cliente ou observações..."
      search={search}
      onSearchChange={onSearchChange}
      activeFilters={activeFilters}
      defaultOpen="desktop"
    >
      <Select
        aria-label="Filtrar por tipo"
        value={type}
        onChange={(event) => onTypeChange(event.target.value)}
        options={[
          { value: "receita", label: "Receitas" },
          { value: "despesa", label: "Despesas" },
        ]}
        placeholder="Tipo"
      />
      <StatusSelect value={status} onValueChange={onStatusChange} />
      <Select
        aria-label="Filtrar por período"
        value={period}
        onChange={(event) => onPeriodChange(event.target.value)}
        options={[
          { value: "today", label: "Hoje" },
          { value: "week", label: "Semana" },
          { value: "month", label: "Mês" },
          { value: "year", label: "Ano" },
          { value: "custom", label: "Personalizado" },
        ]}
        placeholder="Período"
      />
      {period === "custom" ? (
        <>
          <Input
            aria-label="Data inicial"
            type="date"
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
          />
          <Input
            aria-label="Data final"
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
          />
        </>
      ) : null}
      <Select
        aria-label="Filtrar por categoria"
        value={categoryId}
        onChange={(event) => onCategoryChange(event.target.value)}
        options={categories.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        placeholder="Categoria"
      />
      <Select
        aria-label="Filtrar por origem"
        value={origin}
        onChange={(event) => onOriginChange(event.target.value)}
        options={[
          { value: "manual", label: "Manual" },
          { value: "accounts_payable", label: "Contas a pagar" },
          { value: "accounts_receivable", label: "Contas a receber" },
          { value: "import", label: "Importação" },
          { value: "system", label: "Sistema" },
        ]}
        placeholder="Origem"
      />
      <Select
        aria-label="Filtrar por forma de pagamento"
        value={paymentMethod}
        onChange={(event) => onPaymentMethodChange(event.target.value)}
        options={paymentMethodOptions}
        placeholder="Forma de pagamento"
      />
    </FilterBar>
  );
}
