import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Info,
  Landmark,
  Layers3,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { useCategories } from "@/domain/financeiro/hooks/use-categories";
import { useProjectedCashFlow } from "@/domain/financeiro/hooks/use-cash-flow";
import { clientApi } from "@/server/financeiro/client-api";
import {
  buildCashFlowInsight,
  resolvePresetRange,
  toDateKey,
  type CashFlowGranularity,
  type CashFlowView,
  type ProjectedCashFlowPeriod,
  type ProjectedCashFlowResult,
  type ProjectedCashFlowTransaction,
} from "@/domain/financeiro/cash-flow";
import { cn, formatMoney, getMoneyToneClass } from "@/lib/utils";

type PeriodPreset = "7d" | "15d" | "30d" | "60d" | "90d" | "custom";
type ChartMode = "full" | "balance";

interface CashFlowFilters {
  preset: PeriodPreset;
  dateFrom: string;
  dateTo: string;
  bank: string;
  categoryId: string;
  granularity: CashFlowGranularity;
  view: CashFlowView;
}

const defaultRange = resolvePresetRange("15d");
const defaultFilters: CashFlowFilters = {
  preset: "15d",
  dateFrom: toDateKey(defaultRange.from),
  dateTo: toDateKey(defaultRange.to),
  bank: "all",
  categoryId: "all",
  granularity: "day",
  view: "both",
};

const periodOptions: Array<{ value: PeriodPreset; label: string }> = [
  { value: "7d", label: "Próximos 7 dias" },
  { value: "15d", label: "Próximos 15 dias" },
  { value: "30d", label: "Próximos 30 dias" },
  { value: "60d", label: "Próximos 60 dias" },
  { value: "90d", label: "Próximos 90 dias" },
  { value: "custom", label: "Personalizado" },
];

export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [chartMode, setChartMode] = useState<ChartMode>("full");
  const [minimumBalanceInput, setMinimumBalanceInput] = useState("0");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const minimumBalance = Number(minimumBalanceInput.replace(/\./g, "").replace(",", ".")) || 0;
  const { data, isLoading, isError } = useProjectedCashFlow({
    granularity: appliedFilters.granularity,
    view: appliedFilters.view,
    dateFrom: appliedFilters.dateFrom,
    dateTo: appliedFilters.dateTo,
    categoryId: appliedFilters.categoryId === "all" ? undefined : appliedFilters.categoryId,
    bank: appliedFilters.bank,
  });
  const { data: categories = [] } = useCategories();
  const result = data ?? emptyCashFlow(appliedFilters);
  const visiblePeriods = useMemo(() => result.periods, [result.periods]);
  const chartData = useMemo(() => toChartData(visiblePeriods), [visiblePeriods]);
  const sparklineData = useMemo(() => visiblePeriods.map((period) => period.projectedBalance), [visiblePeriods]);
  const insight = useMemo(() => buildCashFlowInsight(result, minimumBalance), [minimumBalance, result]);
  const todayKey = toDateKey(new Date());
  const todayPoint = chartData.find((point) => point.dateFrom <= todayKey && point.dateTo >= todayKey);
  const activeCategory = categories.find((category) => category.id === appliedFilters.categoryId);
  const activeFilters = buildActiveFilterLabels(appliedFilters, activeCategory?.name);

  function updateDraft(patch: Partial<CashFlowFilters>) {
    setDraftFilters((current) => {
      const next = { ...current, ...patch };
      if (patch.preset && patch.preset !== "custom") {
        const range = resolvePresetRange(patch.preset);
        next.dateFrom = toDateKey(range.from);
        next.dateTo = toDateKey(range.to);
      }
      return next;
    });
  }

  function applyFilters() {
    setSearchParams(filtersToSearchParams(draftFilters), { replace: false });
    setExpandedRows(new Set());
    setMobileFiltersOpen(false);
  }

  function clearFilters() {
    setDraftFilters(defaultFilters);
    setSearchParams(new URLSearchParams(), { replace: false });
    setExpandedRows(new Set());
    setMobileFiltersOpen(false);
  }

  function toggleRow(id: string) {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedRows(new Set(visiblePeriods.filter((period) => period.transactions.length > 0).map((period) => period.id)));
  }

  function collapseAll() {
    setExpandedRows(new Set());
  }

  async function handleExportExcel() {
    try {
      setExporting("excel");
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Artec Gestao";
      workbook.created = new Date();

      const summarySheet = workbook.addWorksheet("Resumo");
      summarySheet.columns = [{ header: "Indicador", key: "label", width: 30 }, { header: "Valor", key: "value", width: 22 }];
      summarySheet.addRows([
        { label: "Saldo atual", value: result.summary.currentBalance },
        { label: "Entradas previstas", value: result.summary.predictedInflows },
        { label: "Saídas previstas", value: result.summary.predictedOutflows },
        { label: "Saldo final projetado", value: result.summary.finalProjectedBalance },
        { label: "Menor saldo projetado", value: result.summary.lowestProjectedBalance },
      ]);
      styleMoneyColumn(summarySheet, ["B"]);

      const projectionSheet = workbook.addWorksheet("Projeção");
      projectionSheet.columns = [
        { header: "Período", key: "period", width: 22 },
        { header: "Entradas", key: "inflows", width: 16 },
        { header: "Saidas", key: "outflows", width: 16 },
        { header: "Movimento líquido", key: "netMovement", width: 20 },
        { header: "Saldo projetado", key: "projectedBalance", width: 20 },
      ];
      projectionSheet.addRow({ period: "Saldo inicial", projectedBalance: result.summary.currentBalance });
      visiblePeriods.forEach((period) => projectionSheet.addRow({
        period: period.label,
        inflows: period.inflows,
        outflows: period.outflows,
        netMovement: period.netMovement,
        projectedBalance: period.projectedBalance,
      }));
      styleMoneyColumn(projectionSheet, ["B", "C", "D", "E"]);

      const transactionSheet = workbook.addWorksheet("Lancamentos");
      transactionSheet.columns = [
        { header: "Tipo", key: "type", width: 14 },
        { header: "Descricao", key: "description", width: 42 },
        { header: "Cliente / Fornecedor", key: "party", width: 28 },
        { header: "Valor", key: "amount", width: 16 },
        { header: "Vencimento", key: "dueDate", width: 16 },
        { header: "Status", key: "status", width: 14 },
        { header: "Em atraso", key: "overdue", width: 12 },
      ];
      visiblePeriods.flatMap((period) => period.transactions).forEach((transaction) => transactionSheet.addRow({
        type: transaction.type === "inflow" ? "Entrada" : "Saida",
        description: transaction.description,
        party: transaction.party ?? "-",
        amount: transaction.amount,
        dueDate: transaction.dueDate,
        status: transaction.status,
        overdue: transaction.overdue ? "Sim" : "Não",
      }));
      styleMoneyColumn(transactionSheet, ["D"]);
      styleHeader(summarySheet);
      styleHeader(projectionSheet);
      styleHeader(transactionSheet);

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `fluxo-de-caixa_${appliedFilters.dateFrom}_${appliedFilters.dateTo}_${timestampToken()}.xlsx`);
      toast.success("Excel do Fluxo de Caixa gerado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o Excel.");
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    try {
      setExporting("pdf");
      const blob = await clientApi.cashFlow.exportPdf({
        dateFrom: appliedFilters.dateFrom,
        dateTo: appliedFilters.dateTo,
        granularity: appliedFilters.granularity,
        view: appliedFilters.view,
        categoryId: appliedFilters.categoryId === "all" ? undefined : appliedFilters.categoryId,
        bank: appliedFilters.bank,
      });
      downloadBlob(blob, `fluxo-de-caixa_${appliedFilters.dateFrom}_${appliedFilters.dateTo}_${timestampToken()}.pdf`);
      toast.success("PDF do Fluxo de Caixa gerado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o PDF.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <PageShell icon={CalendarDays} title="Fluxo de Caixa" subtitle="Entradas, saídas e saldo projetado por período">
      <div className="cashflow-export-desktop flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => void handleExportExcel()} disabled={Boolean(exporting)}>
          {exporting === "excel" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
          Exportar Excel
        </Button>
        <Button type="button" className="w-full sm:w-auto" onClick={() => void handleExportPdf()} disabled={Boolean(exporting)}>
          {exporting === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
          Exportar PDF
        </Button>
      </div>
      <div className="cashflow-mobile-toolbar">
        <Button
          type="button"
          variant="outline"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="cashflow-filter-panel"
        >
          <SlidersHorizontal className="size-4" />
          Filtros
          {activeFilters.length ? <span className="filter-count-badge">{activeFilters.length}</span> : null}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" aria-label="Acoes de exportacao do fluxo de caixa">
              <MoreHorizontal className="size-4" />
              Acoes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => void handleExportExcel()} disabled={Boolean(exporting)}>
              {exporting === "excel" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
              Exportar Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleExportPdf()} disabled={Boolean(exporting)}>
              {exporting === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
              Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="cashflow-active-filter-summary" aria-label="Filtros aplicados">
        {activeFilters.map((filter) => (
          <span key={filter}>{filter}</span>
        ))}
      </div>

      <Card id="cashflow-filter-panel" className={cn("cashflow-filter-card overflow-hidden border border-border/70 bg-[var(--surface)] shadow-[var(--shadow-xs)]", mobileFiltersOpen && "cashflow-filter-card-open")}>
        <div className="cashflow-filter-shell">
          <div className="cashflow-filter-grid">
            <FilterField icon={CalendarDays} label="Período">
              <Select value={draftFilters.preset} onChange={(event) => updateDraft({ preset: event.target.value as PeriodPreset })} options={periodOptions} />
            </FilterField>
            <FilterField icon={Landmark} label="Banco">
              <Select value={draftFilters.bank} onChange={(event) => updateDraft({ bank: event.target.value })} options={[{ value: "all", label: "Todos (Consolidado)" }]} />
            </FilterField>
            <FilterField icon={Layers3} label="Categoria">
              <Select value={draftFilters.categoryId} onChange={(event) => updateDraft({ categoryId: event.target.value })} options={[{ value: "all", label: "Todas" }, ...categories.map((category) => ({ value: category.id, label: category.name }))]} />
            </FilterField>
            <FilterField icon={CalendarDays} label="Granularidade">
              <Select value={draftFilters.granularity} onChange={(event) => updateDraft({ granularity: event.target.value as CashFlowGranularity })} options={[{ value: "day", label: "Diária" }, { value: "week", label: "Semanal" }, { value: "month", label: "Mensal" }]} />
            </FilterField>
            <FilterField icon={Search} label="Visão">
              <Select value={draftFilters.view} onChange={(event) => updateDraft({ view: event.target.value as CashFlowView })} options={[{ value: "both", label: "Ambas" }, { value: "inflows", label: "Apenas entradas" }, { value: "outflows", label: "Apenas saídas" }]} />
            </FilterField>
            <div className="cashflow-filter-actions">
              <Button type="button" variant="outline" className="h-11 min-w-[96px]" onClick={clearFilters}>Limpar</Button>
              <Button type="button" className="h-11 min-w-[96px]" onClick={applyFilters}>Aplicar</Button>
            </div>
          </div>
          {draftFilters.preset === "custom" ? (
            <div className="cashflow-custom-range-grid">
              <FilterField icon={CalendarDays} label="Data inicial">
                <Input type="date" value={draftFilters.dateFrom} onChange={(event) => updateDraft({ dateFrom: event.target.value })} />
              </FilterField>
              <FilterField icon={CalendarDays} label="Data final">
                <Input type="date" value={draftFilters.dateTo} onChange={(event) => updateDraft({ dateTo: event.target.value })} />
              </FilterField>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-muted-foreground">Totais do período</p>
        <p className="hidden text-xs font-semibold text-muted-foreground sm:block">{activeFilters.join(" - ")}</p>
      </div>

      {isLoading ? <KpiSkeleton /> : (
        <>
          <div className="cashflow-kpi-grid">
            <KpiCard title="Saldo final projetado" value={formatMoney(result.summary.finalProjectedBalance)} icon={Banknote} tone={result.summary.finalProjectedBalance < result.summary.currentBalance ? "orange" : "blue"} helper={formatDelta(result.summary.finalProjectedBalance - result.summary.currentBalance)} valueClassName={getMoneyToneClass(result.summary.finalProjectedBalance)} sparklineData={sparklineData} />
            <KpiCard title="Saldo atual" value={formatMoney(result.summary.currentBalance)} icon={Wallet} tone="blue" helper="Conciliado pelos lançamentos confirmados" valueClassName={getMoneyToneClass(result.summary.currentBalance)} sparklineData={sparklineData} />
            <KpiCard title="Entradas previstas" value={formatMoney(result.summary.predictedInflows)} icon={ArrowUpCircle} tone="green" helper={`${result.summary.inflowCount} lançamentos`} valueClassName={getMoneyToneClass(result.summary.predictedInflows)} sparklineData={sparklineData} />
            <KpiCard title="Saídas previstas" value={formatMoney(result.summary.predictedOutflows)} icon={ArrowDownCircle} tone="orange" helper={`${result.summary.outflowCount} lançamentos`} valueClassName={getMoneyToneClass(-result.summary.predictedOutflows)} sparklineData={sparklineData} />
            <KpiCard title="Menor saldo projetado" value={formatMoney(result.summary.lowestProjectedBalance)} icon={TrendingDown} tone={result.summary.lowestProjectedBalance < minimumBalance || result.summary.lowestProjectedBalance < 0 ? "orange" : "blue"} helper={`em ${formatShortDate(result.summary.lowestProjectedBalanceDate)}`} valueClassName={getMoneyToneClass(result.summary.lowestProjectedBalance)} sparklineData={sparklineData} alert={result.summary.lowestProjectedBalance < minimumBalance || result.summary.lowestProjectedBalance < 0} />
          </div>
          <div className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed", insight.tone === "positive" ? "border-success/20 bg-success-light text-success" : "border-warning/20 bg-warning-light text-warning") }>
            <div className="flex items-start gap-2">
              {insight.tone === "positive" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
              <div>
                <p className="font-black">{insight.title}</p>
                <p className="mt-1 text-sm font-medium">{insight.message}</p>
              </div>
            </div>
          </div>
        </>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/80">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="inline-flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-primary" />
                Evolução do Saldo Projetado
                <Info className="size-4 text-muted-foreground" />
              </CardTitle>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                Saldo mínimo (R$)
                <input className="cashflow-minimum-input" inputMode="decimal" value={minimumBalanceInput} onChange={(event) => setMinimumBalanceInput(event.target.value)} />
                <Pencil className="size-4 text-primary" />
              </label>
              <div className="inline-flex rounded-xl border border-border bg-[var(--surface-2)] p-1">
                <Button type="button" size="sm" variant={chartMode === "full" ? "default" : "ghost"} className="h-9 px-3" onClick={() => setChartMode("full")}>Entradas e Saídas</Button>
                <Button type="button" size="sm" variant={chartMode === "balance" ? "default" : "ghost"} className="h-9 px-3" onClick={() => setChartMode("balance")}>Apenas Saldo</Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {isError ? (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-destructive/30 bg-danger-50 text-sm font-semibold text-destructive">Erro ao carregar fluxo de caixa.</div>
          ) : isLoading ? (
            <div className="cashflow-chart-loading" aria-label="Carregando grafico do fluxo de caixa">
              <Skeleton className="h-4 w-36 rounded-full" />
              <div className="cashflow-chart-loading-bars">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={index} style={{ height: `${34 + (index % 4) * 14}%` }} />
                ))}
              </div>
              <Skeleton className="h-3 w-48 rounded-full" />
            </div>
          ) : chartData.length ? (
            <div className="cashflow-chart-shell">
              <div className="cashflow-chart-legend" aria-hidden="true">
                {chartMode === "full" && appliedFilters.view !== "outflows" ? <span><i className="bg-[var(--chart-revenue)]" />Entradas</span> : null}
                {chartMode === "full" && appliedFilters.view !== "inflows" ? <span><i className="bg-[var(--chart-expense)]" />Saidas</span> : null}
                <span><i className="bg-[var(--chart-balance)]" />Saldo projetado</span>
              </div>
              <div className="cashflow-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatCompactMoney} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={78} />
                  <Tooltip content={<CashFlowTooltip />} />
                  <ReferenceLine y={minimumBalance} stroke="var(--warning)" strokeDasharray="4 4" />
                  {chartMode === "full" && appliedFilters.view !== "outflows" ? <Bar dataKey="inflows" name="Entradas" fill="var(--chart-revenue)" radius={[6, 6, 0, 0]} maxBarSize={28} /> : null}
                  {chartMode === "full" && appliedFilters.view !== "inflows" ? <Bar dataKey="outflows" name="Saídas" fill="var(--chart-expense)" radius={[6, 6, 0, 0]} maxBarSize={28} /> : null}
                  <Area type="monotone" dataKey="projectedBalance" name="Saldo projetado" fill="var(--chart-balance)" fillOpacity={0.12} stroke="var(--chart-balance)" strokeWidth={2} />
                  <Line type="monotone" dataKey="projectedBalance" name="Linha do saldo" stroke="var(--chart-balance)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} legendType="none" />
                  {todayPoint ? <ReferenceDot x={todayPoint.label} y={todayPoint.projectedBalance} r={6} fill="var(--warning)" stroke="var(--surface)" strokeWidth={2} /> : null}
                </ComposedChart>
              </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState title="Nenhuma projeção encontrada." description="Não há contas pendentes no período selecionado." />
          )}
        </CardContent>
      </Card>

      <ProjectionTable
        periods={visiblePeriods}
        initialBalance={result.summary.currentBalance}
        isLoading={isLoading}
        isError={isError}
        expandedRows={expandedRows}
        onToggleRow={toggleRow}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
    </PageShell>
  );
}

function ProjectionTable({ periods, initialBalance, isLoading, isError, expandedRows, onToggleRow, onExpandAll, onCollapseAll }: {
  periods: ProjectedCashFlowPeriod[];
  initialBalance: number;
  isLoading: boolean;
  isError: boolean;
  expandedRows: Set<string>;
  onToggleRow: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            Projeção Detalhada
            <Info className="size-4 text-muted-foreground" />
          </CardTitle>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button type="button" size="sm" variant="outline" className="min-w-0 px-2 text-xs sm:px-4 sm:text-sm" onClick={onExpandAll}><ChevronDown className="size-4" />Expandir todos</Button>
            <Button type="button" size="sm" variant="outline" className="min-w-0 px-2 text-xs sm:px-4 sm:text-sm" onClick={onCollapseAll}><ChevronRight className="size-4" />Recolher todos</Button>
          </div>
        </div>
      </CardHeader>
      <div className="cashflow-projection-mobile">
        <CashFlowPeriodList
          periods={periods}
          initialBalance={initialBalance}
          isLoading={isLoading}
          isError={isError}
          expandedRows={expandedRows}
          onToggleRow={onToggleRow}
        />
      </div>
      <div className="cashflow-projection-desktop table-scroll" role="region" aria-label="Projeção detalhada, deslize horizontalmente para ver todas as colunas" tabIndex={0}>
        <p className="table-scroll-hint">Deslize para ver todas as colunas</p>
        <table className="cashflow-table">
          <thead>
            <tr>
              <th>Período</th>
              <th className="text-right">Entradas</th>
              <th className="text-right">Saídas</th>
              <th className="text-right">Movimento líquido</th>
              <th className="text-right">Saldo projetado</th>
            </tr>
          </thead>
          <tbody>
            <tr className="cashflow-initial-row">
              <td><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />Saldo inicial</span></td>
              <td className="text-right text-muted-foreground">Sem previsao</td>
              <td className="text-right text-muted-foreground">Sem previsao</td>
              <td className="text-right text-muted-foreground">Sem movimento</td>
              <td className="text-right font-black text-primary">{formatMoney(initialBalance)}</td>
            </tr>
            {isLoading ? (
              <tr><td colSpan={5} className="h-56 text-center text-sm font-semibold text-muted-foreground">Carregando projeção...</td></tr>
            ) : isError ? (
              <tr><td colSpan={5} className="h-56 text-center text-sm font-semibold text-destructive">Erro ao carregar fluxo de caixa.</td></tr>
            ) : periods.length ? periods.map((period) => {
              const hasTransactions = period.transactions.length > 0;
              const expanded = expandedRows.has(period.id);
              return (
                <Fragment key={period.id}>
                  <tr className={cn(hasTransactions ? "cursor-pointer hover:bg-surface-2" : "cashflow-row-empty")} onClick={() => hasTransactions && onToggleRow(period.id)}>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        {hasTransactions ? expanded ? <ChevronDown className="size-4 text-primary" /> : <ChevronRight className="size-4 text-muted-foreground" /> : <span className="size-4" />}
                        {period.label}
                      </span>
                    </td>
                    <td className="text-right font-bold text-success">{period.inflows ? formatMoney(period.inflows) : <span className="text-muted-foreground">R$ 0,00</span>}</td>
                    <td className="text-right font-bold text-destructive">{period.outflows ? formatMoney(period.outflows) : <span className="text-muted-foreground">R$ 0,00</span>}</td>
                    <td className={cn("text-right font-bold", period.netMovement < 0 ? "text-destructive" : period.netMovement > 0 ? "text-success" : "text-muted-foreground")}>{period.netMovement ? formatSignedMoney(period.netMovement) : "Sem movimento"}</td>
                    <td className="text-right font-black text-primary">{formatMoney(period.projectedBalance)}</td>
                  </tr>
                  {expanded ? (
                    <tr key={`${period.id}:details`}>
                      <td colSpan={5} className="bg-[var(--surface-2)] p-0">
                        <TransactionDetails transactions={period.transactions} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            }) : (
              <tr><td colSpan={5} className="p-0"><EmptyState title="Nenhuma conta pendente encontrada." description="Altere o período ou os filtros para visualizar previsões futuras." /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CashFlowPeriodList({ periods, initialBalance, isLoading, isError, expandedRows, onToggleRow }: {
  periods: ProjectedCashFlowPeriod[];
  initialBalance: number;
  isLoading: boolean;
  isError: boolean;
  expandedRows: Set<string>;
  onToggleRow: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 p-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="cashflow-card">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="mt-3 h-5 w-40 rounded-full" />
            <Skeleton className="mt-4 h-4 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <div className="rounded-2xl border border-dashed border-destructive/30 bg-danger-50 p-6 text-center text-sm font-semibold text-destructive">
          Erro ao carregar fluxo de caixa.
        </div>
      </div>
    );
  }

  if (!periods.length) {
    return (
      <div className="p-4">
        <EmptyState title="Nenhuma conta pendente encontrada." description="Altere o periodo ou os filtros para visualizar previsoes futuras." />
      </div>
    );
  }

  const periodsWithMovement = periods.filter((period) => period.transactions.length > 0);
  const hiddenEmptyPeriods = periods.length - periodsWithMovement.length;
  const visiblePeriods = periodsWithMovement.length ? periodsWithMovement : periods.slice(0, 1);

  return (
    <div className="grid gap-3 p-4">
      <article className="cashflow-card cashflow-initial-card">
        <header>
          <span>Saldo inicial</span>
          <strong>{formatMoney(initialBalance)}</strong>
        </header>
      </article>
      {visiblePeriods.map((period) => {
        const expanded = expandedRows.has(period.id);
        const hasTransactions = period.transactions.length > 0;
        return (
          <article key={period.id} className={cn("cashflow-card", !hasTransactions && "cashflow-card-empty")}>
            <button
              type="button"
              className="cashflow-period-button"
              onClick={() => hasTransactions && onToggleRow(period.id)}
              disabled={!hasTransactions}
              aria-expanded={hasTransactions ? expanded : undefined}
            >
              <span className="cashflow-period-copy">
                {hasTransactions ? expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" /> : null}
                <span>{period.label}</span>
                {!hasTransactions ? <small>Sem movimentacao prevista</small> : null}
              </span>
              <strong className={getMoneyToneClass(period.projectedBalance)}>{formatMoney(period.projectedBalance)}</strong>
            </button>
            {hasTransactions ? (
              <div className="cashflow-values">
                <div>
                  <span>Entradas</span>
                  <strong className="text-success">{formatMoney(period.inflows)}</strong>
                </div>
                <div>
                  <span>Saidas</span>
                  <strong className="text-destructive">{formatMoney(period.outflows)}</strong>
                </div>
                <div>
                  <span>Movimento</span>
                  <strong className={cn(period.netMovement < 0 ? "text-destructive" : period.netMovement > 0 ? "text-success" : "text-muted-foreground")}>
                    {formatSignedMoney(period.netMovement)}
                  </strong>
                </div>
              </div>
            ) : null}
            {expanded ? <TransactionCards transactions={period.transactions} /> : null}
          </article>
        );
      })}
      {hiddenEmptyPeriods > 0 ? (
        <article className="cashflow-card cashflow-card-empty cashflow-empty-group">
          <div>
            <span>{hiddenEmptyPeriods} {hiddenEmptyPeriods === 1 ? "dia sem movimentacao prevista" : "dias sem movimentacao prevista"}</span>
            <strong>Ocultos para leitura rapida</strong>
          </div>
        </article>
      ) : null}
    </div>
  );
}

function TransactionCards({ transactions }: { transactions: ProjectedCashFlowTransaction[] }) {
  return (
    <div className="cashflow-transaction-list">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="cashflow-transaction-card">
          <div className="min-w-0">
            <Badge variant={transaction.type === "inflow" ? "success" : "destructive"}>
              {transaction.type === "inflow" ? "Entrada" : "Saida"}
            </Badge>
            <p className="mt-2 font-bold text-foreground">{transaction.description}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {transaction.party ?? "Sem favorecido"} - {formatShortDate(transaction.dueDate)}
            </p>
            {transaction.overdue ? <p className="mt-2 text-xs font-bold text-destructive">Em atraso desde {formatShortDate(transaction.dueDate)}</p> : null}
          </div>
          <strong className={cn("shrink-0 text-right tabular-nums", transaction.type === "inflow" ? "text-success" : "text-destructive")}>
            {formatMoney(transaction.amount)}
          </strong>
        </div>
      ))}
    </div>
  );
}

function TransactionDetails({ transactions }: { transactions: ProjectedCashFlowTransaction[] }) {
  const inflows = transactions.filter((transaction) => transaction.type === "inflow").length;
  const outflows = transactions.length - inflows;

  return (
    <div className="cashflow-details">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">{transactions.length} lançamentos - {inflows} entrada(s) - {outflows} saída(s)</p>
      <div className="mt-3 overflow-x-auto">
        <table className="cashflow-detail-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descricao</th>
              <th>Cliente / Fornecedor</th>
              <th className="text-right">Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td><Badge variant={transaction.type === "inflow" ? "success" : "destructive"}>{transaction.type === "inflow" ? "Entrada" : "Saída"}</Badge></td>
                <td>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-semibold text-foreground">{transaction.description}</span>
                    {transaction.overdue ? <Badge variant="destructive">Em atraso desde {formatShortDate(transaction.dueDate)}</Badge> : null}
                  </div>
                </td>
                <td>{transaction.party ?? "-"}</td>
                <td className={cn("text-right font-black tabular-nums", transaction.type === "inflow" ? "text-success" : "text-destructive")}>{formatMoney(transaction.amount)}</td>
                <td>{formatShortDate(transaction.dueDate)}</td>
                <td><Badge variant="secondary">{cashFlowStatusLabel(transaction.status)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterField({ icon: Icon, label, children }: { icon: typeof CalendarDays; label: string; children: React.ReactNode }) {
  return (
    <label className="cashflow-filter-field">
      <span><Icon className="size-4" />{label}</span>
      {children}
    </label>
  );
}

function cashFlowStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    overdue: "Vencido",
    confirmed: "Confirmado",
    paid: "Pago",
    received: "Recebido",
    reversed: "Estornado",
    cancelled: "Cancelado",
  };
  return labels[status] ?? status;
}

function CashFlowTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="max-w-[min(280px,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-sm shadow-elevated">
      <p className="mb-2 font-black text-foreground">{label}</p>
      {payload.filter((item) => item.name !== "Linha do saldo").map((item) => (
        <p key={item.name} className="flex items-center justify-between gap-6 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: item.color }} />{item.name}</span>
          <strong className="tabular-nums text-foreground">{formatMoney(item.value ?? 0)}</strong>
        </p>
      ))}
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, tone, helper, valueClassName, sparklineData, alert }: { title: string; value: string; icon: typeof Wallet; tone: "blue" | "green" | "orange"; helper?: string; valueClassName?: string; sparklineData: number[]; alert?: boolean }) {
  const iconClassName = tone === "green" ? "bg-success-soft text-success" : tone === "orange" ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary";
  return (
    <div className={cn("stat-card", alert && "border-warning/40 bg-warning-light/40") }>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("flex size-10 items-center justify-center rounded-2xl", iconClassName)}>
            <Icon className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">{title}</p>
          <p className={cn("mt-2 text-xl font-black tracking-tight", valueClassName)}>{value}</p>
        </div>
        {alert ? <AlertTriangle className="size-4 shrink-0 text-warning" /> : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-muted-foreground">{helper}</p> : null}
      <div className="mt-4 h-8">
        <svg viewBox="0 0 100 24" className="h-full w-full" aria-hidden="true">
          <path d={buildSparklinePath(sparklineData)} fill="none" stroke={tone === "green" ? "var(--success)" : tone === "orange" ? "var(--warning)" : "var(--primary)"} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function buildSparklinePath(values: number[]) {
  if (!values.length) return "M0 12";
  const width = 100;
  const height = 24;
  const max = Math.max(...values.map((value) => Math.abs(value))) || 1;
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const normalized = max === 0 ? 0.5 : 1 - value / max;
    const y = normalized * height;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function KpiSkeleton() {
  return (
    <div className="cashflow-kpi-grid">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="stat-card">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="mt-4 h-8 w-40 rounded-full" />
          <Skeleton className="mt-3 h-3 w-32 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function parseFilters(params: URLSearchParams): CashFlowFilters {
  const preset = parsePreset(params.get("periodo"));
  const range = preset === "custom"
    ? { from: params.get("inicio") || defaultFilters.dateFrom, to: params.get("fim") || defaultFilters.dateTo }
    : (() => {
        const resolved = resolvePresetRange(preset);
        return { from: toDateKey(resolved.from), to: toDateKey(resolved.to) };
      })();
  return {
    preset,
    dateFrom: range.from,
    dateTo: range.to,
    bank: params.get("banco") || "all",
    categoryId: params.get("categoria") || "all",
    granularity: parseGranularity(params.get("granularidade")),
    view: parseView(params.get("visao")),
  };
}

function filtersToSearchParams(filters: CashFlowFilters) {
  const params = new URLSearchParams();
  if (filters.preset !== defaultFilters.preset) params.set("periodo", filters.preset);
  if (filters.preset === "custom") {
    params.set("inicio", filters.dateFrom);
    params.set("fim", filters.dateTo);
  }
  if (filters.bank !== "all") params.set("banco", filters.bank);
  if (filters.categoryId !== "all") params.set("categoria", filters.categoryId);
  if (filters.granularity !== defaultFilters.granularity) params.set("granularidade", filters.granularity);
  if (filters.view !== defaultFilters.view) params.set("visao", filters.view);
  return params;
}

function buildActiveFilterLabels(filters: CashFlowFilters, categoryName?: string) {
  return [
    periodOptions.find((option) => option.value === filters.preset)?.label ?? "Próximos 15 dias",
    filters.bank === "all" ? "Todos os bancos" : filters.bank,
    categoryName ?? "Todas as categorias",
    filters.granularity === "day" ? "Diária" : filters.granularity === "week" ? "Semanal" : "Mensal",
    filters.view === "both" ? "Ambas" : filters.view === "inflows" ? "Apenas entradas" : "Apenas saídas",
  ];
}

function toChartData(periods: ProjectedCashFlowPeriod[]) {
  return periods.map((period) => ({
    label: period.label,
    dateFrom: period.dateFrom,
    dateTo: period.dateTo,
    inflows: period.inflows,
    outflows: period.outflows,
    projectedBalance: period.projectedBalance,
    netMovement: period.netMovement,
  }));
}

function emptyCashFlow(filters: CashFlowFilters): ProjectedCashFlowResult {
  return {
    filters: {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      granularity: filters.granularity,
      view: filters.view,
      categoryId: filters.categoryId === "all" ? null : filters.categoryId,
      bank: filters.bank,
    },
    summary: {
      currentBalance: 0,
      predictedInflows: 0,
      predictedOutflows: 0,
      finalProjectedBalance: 0,
      lowestProjectedBalance: 0,
      lowestProjectedBalanceDate: filters.dateFrom,
      inflowCount: 0,
      outflowCount: 0,
    },
    periods: [],
  };
}

function parsePreset(value: string | null): PeriodPreset {
  return value === "7d" || value === "15d" || value === "30d" || value === "60d" || value === "90d" || value === "custom" ? value : "15d";
}

function parseGranularity(value: string | null): CashFlowGranularity {
  return value === "week" || value === "month" ? value : "day";
}

function parseView(value: string | null): CashFlowView {
  return value === "inflows" || value === "outflows" ? value : "both";
}

function formatShortDate(value: string) {
  const parts = value.slice(0, 10).split("-").map(Number);
  const year = parts[0] ?? Number.NaN;
  const month = parts[1] ?? Number.NaN;
  const day = parts[2] ?? Number.NaN;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCompactMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return formatMoney(value);
}

function formatSignedMoney(value: number) {
  return `${value > 0 ? "+" : ""}${formatMoney(value)}`;
}

function formatDelta(value: number) {
  if (value === 0) return "Sem variação em relação a hoje";
  return `${value < 0 ? "Queda" : "Alta"} de ${formatMoney(Math.abs(value))} em relação a hoje`;
}

function styleHeader(sheet: { getRow: (row: number) => { font?: { bold?: boolean } } }) {
  sheet.getRow(1).font = { bold: true };
}

function styleMoneyColumn(sheet: { getColumn: (column: string) => { numFmt?: string } }, columns: string[]) {
  columns.forEach((column) => {
    sheet.getColumn(column).numFmt = '"R$" #,##0.00';
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function timestampToken() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
}
