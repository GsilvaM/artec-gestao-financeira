import { useMemo, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowDownCircle, ArrowUpCircle, BarChart3, FileDown, Loader2, Percent, Scale } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  buildDre,
  buildDreInsights,
  buildExpenseComposition,
  buildHistoryFilters,
  buildMonthRangeFilters,
  buildMonthlyEvolutionSeries,
  formatOptionalPercent,
  formatPercent,
  getActiveMonthRange,
  getBreakEvenState,
  getPreviousMonthRange,
  type BreakEvenState,
  type DreInsight,
  type DreLine,
  type FatiaComposicao,
  type PontoMensal,
} from "@/domain/financeiro/dre-visual";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import { clientApi } from "@/server/financeiro/client-api";
import { cn, formatMoney } from "@/lib/utils";
import type { FinancialEntryFilters } from "@/domain/financeiro/types";
import { toast } from "sonner";

export function Component() {
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [groupFilter, setGroupFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("estrutura");
  const [historyMonths, setHistoryMonths] = useState<6 | 12>(6);
  const [exportOpen, setExportOpen] = useState(false);

  const activeMonth = useMemo(() => getActiveMonthRange(filterMonth), [filterMonth]);
  const previousMonth = useMemo(() => getPreviousMonthRange(activeMonth.value), [activeMonth.value]);

  const filters = useMemo<FinancialEntryFilters | undefined>(() => {
    const current: FinancialEntryFilters = {};
    if (search) current.search = search;
    if (filterMonth) {
      const [year, month] = filterMonth.split("-");
      current.dateFrom = new Date(Number(year), Number(month) - 1, 1);
      current.dateTo = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    }
    return Object.keys(current).length ? current : undefined;
  }, [filterMonth, search]);

  const previousFilters = useMemo(
    () => buildMonthRangeFilters(previousMonth, search),
    [previousMonth, search],
  );
  const historyFilters = useMemo(
    () => buildHistoryFilters(historyMonths, activeMonth.value),
    [activeMonth.value, historyMonths],
  );

  const { data: entries = [], isLoading, error } = useFinancialEntries(filters);
  const { data: previousEntries = [] } = useFinancialEntries(previousFilters);
  const { data: historyEntries = [], isLoading: isHistoryLoading } = useFinancialEntries(historyFilters);

  const dre = useMemo(() => buildDre(entries, previousEntries), [entries, previousEntries]);
  const composition = useMemo(() => buildExpenseComposition(dre.rows), [dre.rows]);
  const evolution = useMemo(
    () => buildMonthlyEvolutionSeries(historyEntries, historyMonths, activeMonth.value),
    [activeMonth.value, historyEntries, historyMonths],
  );
  const insights = useMemo(() => buildDreInsights(dre, composition), [composition, dre]);
  const categories = useMemo(
    () => Array.from(new Set(dre.rows.filter((row) => !row.emphasis).map((row) => row.category))).sort((a, b) => a.localeCompare(b)),
    [dre.rows],
  );
  const visibleRows = useMemo(
    () => sortDreRows(filterDreRows(dre.rows, groupFilter, categoryFilter), sortBy),
    [categoryFilter, dre.rows, groupFilter, sortBy],
  );
  const breakEven = useMemo(
    () => getBreakEvenState(dre.totalReceitas, dre.totalDespesas, formatMoney),
    [dre.totalDespesas, dre.totalReceitas],
  );
  const activeFilters = useMemo(
    () => [
      ...(search ? [{ key: "search", label: `Busca: ${search}`, onRemove: () => setSearch("") }] : []),
      ...(filterMonth ? [{ key: "month", label: `Periodo: ${formatMonthLabel(filterMonth)}`, onRemove: () => setFilterMonth("") }] : []),
      ...(groupFilter !== "todos" ? [{ key: "group", label: `Grupo: ${groupFilter}`, onRemove: () => setGroupFilter("todos") }] : []),
      ...(categoryFilter !== "todos" ? [{ key: "category", label: `Categoria: ${categoryFilter}`, onRemove: () => setCategoryFilter("todos") }] : []),
    ],
    [categoryFilter, filterMonth, groupFilter, search],
  );
  const periodLabel = formatMonthLabel(activeMonth.value);

  return (
    <PageShell icon={BarChart3} title="DRE" subtitle="Acompanhe receitas, despesas, resultado liquido e categorias que mais impactam a operacao.">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-primary">Periodo: {periodLabel}</span>
        <span className="badge border-border bg-[var(--surface-2)] text-muted-foreground">Regime: caixa</span>
      </div>

      <Card className="dre-filter-panel p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <FilterBar
            searchPlaceholder="Buscar categoria ou descricao..."
            search={search}
            onSearchChange={setSearch}
            activeFilters={activeFilters}
            filters={[
              {
                key: "month",
                label: "Periodo",
                primary: true,
                control: <MonthSelect value={filterMonth} onValueChange={setFilterMonth} />,
              },
              {
                key: "group",
                label: "Grupo",
                control: (
                  <select className="select-input" aria-label="Filtrar por grupo" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
                    <option value="todos">Todos os grupos</option>
                    <option value="Receitas">Receitas</option>
                    <option value="Despesas">Despesas</option>
                    <option value="Resultado">Resultado</option>
                  </select>
                ),
              },
              {
                key: "category",
                label: "Categoria",
                control: (
                  <select className="select-input" aria-label="Filtrar por categoria" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="todos">Todas as categorias</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                ),
              },
              {
                key: "sort",
                label: "Ordenacao",
                control: (
                  <select className="select-input" aria-label="Ordenar DRE" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="estrutura">Ordem gerencial</option>
                    <option value="valor">Maior valor realizado</option>
                    <option value="receita">Maior % da receita</option>
                  </select>
                ),
              },
            ]}
          />
          <div className="dre-filter-actions">
            <Button type="button" variant="outline" className="w-full lg:w-auto" onClick={() => setExportOpen(true)}>
              <FileDown className="size-4" />
              Exportar PDF
            </Button>
            {activeFilters.length ? (
              <Button type="button" variant="ghost" className="w-full lg:w-auto" onClick={() => {
                setSearch("");
                setFilterMonth("");
                setGroupFilter("todos");
                setCategoryFilter("todos");
              }}>
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="dre-kpi-grid">
        <MetricCard title="Receita total" value={formatMoney(dre.totalReceitas)} icon={ArrowUpCircle} tone="green" helper="Entradas reconhecidas no periodo" />
        <MetricCard title="Despesa total" value={formatMoney(dre.totalDespesas)} icon={ArrowDownCircle} tone="red" helper="Saidas reconhecidas no periodo" />
        <MetricCard title="Resultado liquido" value={formatMoney(dre.resultado)} icon={Scale} tone={dre.resultado < 0 ? "red" : "blue"} helper={dre.resultado < 0 ? "Resultado negativo no periodo" : "Resultado positivo no periodo"} />
        <MetricCard title="Margem liquida" value={formatOptionalPercent(dre.margemLiquida)} icon={Percent} tone={dre.resultado < 0 ? "red" : "green"} helper="Resultado liquido sobre receita" />
        <MetricCard title="Cobertura despesas" value={formatOptionalPercent(dre.coberturaDespesas)} icon={Activity} tone={dre.coberturaDespesas !== null && dre.coberturaDespesas < 100 ? "amber" : "green"} helper={dre.coberturaDespesas === null ? "Sem despesas no periodo" : "Receita / despesas"} />
      </div>

      <BreakEvenIndicator state={breakEven} receita={dre.totalReceitas} despesa={dre.totalDespesas} />

      <ManagerialInsights insights={insights} />

      <DreEvolutionChart
        data={evolution}
        months={historyMonths}
        onMonthsChange={setHistoryMonths}
        isLoading={isHistoryLoading}
      />

      <ExpenseComposition composition={composition} />

      <div className="desktop-table">
        <DreTable rows={visibleRows} isLoading={isLoading} hasError={Boolean(error)} hasFilters={activeFilters.length > 0} />
      </div>

      <div className="mobile-list">
        <DreMobileList rows={visibleRows} isLoading={isLoading} hasError={Boolean(error)} hasFilters={activeFilters.length > 0} />
      </div>

      <DrePdfExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        activeMonth={activeMonth.value}
      />
    </PageShell>
  );
}

function ManagerialInsights({ insights }: { insights: DreInsight[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4">
        <p className="card-label">Leitura rapida</p>
        <h2 className="mt-2 text-lg font-bold leading-tight text-foreground">Resumo gerencial do periodo</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-semibold leading-relaxed",
              insight.tone === "positive" && "border-success/20 bg-success-light text-success",
              insight.tone === "negative" && "border-destructive/20 bg-destructive-light text-destructive",
              insight.tone === "warning" && "border-warning/20 bg-warning-light text-warning",
              insight.tone === "neutral" && "border-border bg-[var(--surface-2)] text-muted-foreground",
            )}
          >
            {insight.text}
          </div>
        ))}
      </div>
    </Card>
  );
}

type ExportPeriod = "mensal" | "trimestre" | "anual" | "customizado";
type ExportParams = Record<string, string | number>;

function DrePdfExportDialog({
  open,
  onOpenChange,
  activeMonth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeMonth: string;
}) {
  const now = new Date();
  const [period, setPeriod] = useState<ExportPeriod>("mensal");
  const [month, setMonth] = useState(activeMonth);
  const [quarter, setQuarter] = useState(String(Math.floor(now.getMonth() / 3) + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`);
  const [isGenerating, setIsGenerating] = useState(false);

  const customError = period === "customizado" && startDate && endDate && endDate < startDate
    ? "A data final deve ser posterior ou igual a inicial."
    : "";
  const canGenerate = !customError && !isGenerating;

  async function handleGenerate() {
    if (!canGenerate) return;

    try {
      setIsGenerating(true);
      const params = buildExportParams(period, month || activeMonth, quarter, year, startDate, endDate);
      const blob = await clientApi.dre.exportPdf(params);
      downloadBlob(blob, getClientFilename(params));
      toast.success("PDF do DRE gerado com sucesso.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel gerar o PDF.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dre-export-dialog max-h-[calc(100dvh-1rem)] overflow-y-auto">
        <DialogCloseButton onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Exportar DRE em PDF</DialogTitle>
          <DialogDescription>
            Sera gerado um PDF com resumo, comparativo mensal, composicao de despesas e tabela detalhada do periodo selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="dre-export-form grid gap-4">
          <div className="rounded-xl border border-primary/15 bg-primary-light p-3 text-sm font-semibold leading-relaxed text-primary">
            A exportacao usa um layout proprio de PDF e nao depende do tamanho da tela atual.
          </div>

          <Field label="Periodo">
            <select className="select-input" value={period} onChange={(event) => setPeriod(event.target.value as ExportPeriod)}>
              <option value="mensal">Mes atual</option>
              <option value="trimestre">Trimestre</option>
              <option value="anual">Ano inteiro</option>
              <option value="customizado">Intervalo customizado</option>
            </select>
          </Field>

          {period === "mensal" && (
            <Field label="Mes especifico">
              <input className="search-input px-4" type="month" value={month || activeMonth} onChange={(event) => setMonth(event.target.value)} />
            </Field>
          )}

          {period === "trimestre" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Trimestre">
                <select className="select-input" value={quarter} onChange={(event) => setQuarter(event.target.value)}>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </Field>
              <Field label="Ano">
                <input className="search-input px-4" type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(event.target.value)} />
              </Field>
            </div>
          )}

          {period === "anual" && (
            <Field label="Ano">
              <input className="search-input px-4" type="number" min="2000" max="2100" value={year} onChange={(event) => setYear(event.target.value)} />
            </Field>
          )}

          {period === "customizado" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data inicial">
                <input className="search-input px-4" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </Field>
              <Field label="Data final" error={customError}>
                <input className="search-input px-4" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-invalid={Boolean(customError)} />
              </Field>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>Cancelar</Button>
          <Button type="button" onClick={() => void handleGenerate()} disabled={!canGenerate}>
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            {isGenerating ? "Gerando PDF..." : "Gerar PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-foreground">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-semibold text-destructive">{error}</span> : null}
    </label>
  );
}

function buildExportParams(
  period: ExportPeriod,
  month: string,
  quarter: string,
  year: string,
  startDate: string,
  endDate: string,
): ExportParams {
  if (period === "mensal") return { periodo: "mensal", mes: month };
  if (period === "trimestre") return { periodo: "trimestre", trimestre: quarter, ano: year };
  if (period === "anual") return { periodo: "anual", ano: year };
  return { periodo: "customizado", inicio: startDate, fim: endDate };
}

function getClientFilename(params: ExportParams) {
  if (params.periodo === "mensal") return `DRE_ArtecGestao_${params.mes}.pdf`;
  if (params.periodo === "trimestre") return `DRE_ArtecGestao_${params.ano}-T${params.trimestre}.pdf`;
  if (params.periodo === "anual") return `DRE_ArtecGestao_${params.ano}.pdf`;
  return `DRE_ArtecGestao_${params.inicio}_${params.fim}.pdf`;
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

function BreakEvenIndicator({ state, receita, despesa }: { state: BreakEvenState; receita: number; despesa: number }) {
  const toneClass = state.tone === "negative" ? "text-destructive" : state.tone === "positive" ? "text-success" : "text-muted-foreground";
  const markerClass = state.tone === "negative" ? "bg-destructive" : state.tone === "positive" ? "bg-success" : "bg-primary";
  const gapLabel = state.gap > 0 ? `Gap ${formatMoney(state.gap)}` : state.gap < 0 ? `Sobra ${formatMoney(Math.abs(state.gap))}` : "Sem gap";

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="card-label">Ponto de equilibrio</p>
          <h2 className={cn("mt-2 text-lg font-bold leading-tight", toneClass)}>{state.text}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A receita cobre {formatPercent(state.coberturaPct)} das despesas.
          </p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <span className="rounded-xl bg-[var(--surface-2)] px-3 py-2 font-semibold text-muted-foreground">Receita atual <strong className="block tabular-nums text-success">{formatMoney(receita)}</strong></span>
            <span className="rounded-xl bg-[var(--surface-2)] px-3 py-2 font-semibold text-muted-foreground">Despesa <strong className="block tabular-nums text-destructive">{formatMoney(despesa)}</strong></span>
            <span className="rounded-xl bg-[var(--surface-2)] px-3 py-2 font-semibold text-muted-foreground">Gap <strong className={cn("block tabular-nums", toneClass)}>{gapLabel}</strong></span>
          </div>
        </div>
        <div className="min-w-0 flex-1 lg:max-w-xl">
          <div className="relative h-4 rounded-full bg-surface-muted">
            <span className="absolute inset-y-0 left-0 rounded-full bg-success" style={{ width: `${clampPercent(state.receitaPct)}%` }} />
            <span className={cn("absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-2 border-surface shadow-sm", markerClass)} style={{ left: `calc(${clampPercent(state.despesaPct)}% - 10px)` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 text-xs font-bold text-muted-foreground">
            <span>Receita atual</span>
            <span>Meta de equilibrio</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DreEvolutionChart({
  data,
  months,
  onMonthsChange,
  isLoading,
}: {
  data: PontoMensal[];
  months: 6 | 12;
  onMonthsChange: (months: 6 | 12) => void;
  isLoading: boolean;
}) {
  const hasEnoughData = data.some((point) => point.hasData);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="card-label">Evolucao mensal</p>
          <h2 className="mt-2 text-lg font-bold leading-tight text-foreground">Receita, despesa e resultado</h2>
        </div>
        <div className="dre-period-toggle inline-flex rounded-xl border border-border bg-[var(--surface-2)] p-1">
          {[6, 12].map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={months === option ? "default" : "ghost"}
              className="h-9 px-3"
              onClick={() => onMonthsChange(option as 6 | 12)}
            >
              {option} meses
            </Button>
          ))}
        </div>
      </div>
      <div className="dre-chart-scroll min-h-[260px] overflow-x-auto">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center text-sm font-semibold text-muted-foreground">Carregando grafico...</div>
        ) : !hasEnoughData ? (
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm font-semibold text-muted-foreground">
            Ainda nao ha dados suficientes para evolucao mensal.
          </div>
        ) : (
          <div className={cn("dre-chart-frame h-[300px] lg:h-[340px]", months === 12 && "dre-chart-frame-wide")}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tickFormatter={formatMonthLabel} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(value: number) => compactMoney(value)} tickLine={false} axisLine={false} fontSize={12} width={64} />
                <Tooltip content={<DreChartTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 12 }} />
                <Bar dataKey="receita" name="Receita" fill="var(--chart-revenue)" radius={[8, 8, 0, 0]} maxBarSize={32} />
                <Bar dataKey="despesa" name="Despesa" fill="var(--chart-expense)" radius={[8, 8, 0, 0]} maxBarSize={32} />
                <Line type="monotone" dataKey="resultado" name="Resultado" stroke="var(--chart-balance)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

function DreChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const values = Object.fromEntries(payload.map((item) => [item.name, item.value ?? 0]));
  const receita = Number(values.Receita ?? 0);
  const despesa = Number(values.Despesa ?? 0);
  const resultado = Number(values.Resultado ?? 0);
  const margem = receita > 0 ? (resultado / receita) * 100 : null;

  return (
    <div className="max-w-[min(280px,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-3 text-sm shadow-elevated">
      <p className="mb-2 font-bold text-foreground">{formatMonthLabel(label ?? "")}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-6">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
            <strong className="tabular-nums text-foreground">{formatMoney(item.value ?? 0)}</strong>
          </div>
        ))}
        <div className="border-t border-border pt-1.5 text-xs font-semibold text-muted-foreground">
          Margem {formatOptionalPercent(margem)} - Diferenca receita vs despesa {formatMoney(receita - despesa)}
        </div>
      </div>
    </div>
  );
}

function ExpenseComposition({ composition }: { composition: FatiaComposicao[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="card-label">Composicao de despesas</p>
        <h2 className="mt-2 text-lg font-bold leading-tight text-foreground">Categorias que mais pressionam a receita</h2>
      </div>
      {composition.length ? (
        <div className="space-y-4">
          <div className="dre-composition-bar flex h-5 overflow-hidden rounded-full bg-surface-muted">
            {composition.map((item) => (
              <span
                key={item.categoria}
                className={cn("h-full min-w-1", item.alerta && "ring-2 ring-inset ring-destructive/40")}
                style={{ width: `${item.percentual}%`, background: item.color }}
                title={`${item.categoria}: ${formatPercent(item.percentual)}`}
              />
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {composition.map((item) => (
              <div key={item.categoria} className="min-w-0 rounded-xl border border-border bg-[var(--surface-2)] px-3 py-3">
                <div className="dre-composition-item-head flex min-w-0 items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span className="break-words">{item.categoria}</span>
                    {item.alerta && <AlertTriangle className="size-4 shrink-0 text-destructive" aria-label="Categoria em alerta" />}
                  </span>
                  <strong className="shrink-0 text-sm tabular-nums text-foreground">{formatMoney(item.valor)}</strong>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-bold text-muted-foreground sm:grid-cols-2">
                  <span>{formatPercent(item.percentual)} das despesas</span>
                  <span>{formatPercent(item.percentualReceita)} da receita</span>
                </div>
                {item.alerta ? (
                  <p className="mt-2 rounded-lg bg-destructive-light px-2 py-1 text-xs font-semibold text-destructive">
                    Pressao relevante sobre a margem.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm font-semibold text-muted-foreground">
          Nenhuma despesa no periodo.
        </div>
      )}
    </Card>
  );
}

function DreTable({ rows, isLoading, hasError, hasFilters }: { rows: DreLine[]; isLoading: boolean; hasError: boolean; hasFilters: boolean }) {
  return (
    <Card className="overflow-hidden">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Realizado</TableHead>
            <TableHead className="text-right">% Receita</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-56 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : hasError ? (
            <TableRow>
              <TableCell colSpan={4} className="h-56 text-center text-sm font-medium text-destructive">
                Erro ao carregar DRE.
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id} className={cn(row.emphasis && "bg-muted/45 font-semibold", row.alert && "bg-danger-50/70 hover:bg-danger-50")}>
                <TableCell className="text-muted-foreground">{row.group}</TableCell>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    {row.alert && <AlertTriangle className="size-4 text-destructive" aria-label="Categoria em alerta" />}
                    {row.category}
                  </span>
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", row.type === "receita" ? "text-success" : row.type === "despesa" ? "text-destructive" : row.amount < 0 ? "text-destructive" : "text-primary")}>
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", row.alert ? "font-bold text-destructive" : "text-muted-foreground")}>{formatPercent(row.revenueShare)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="p-0">
                <EmptyState
                  title={hasFilters ? "Nenhuma categoria encontrada." : "Nenhum lancamento encontrado."}
                  description={hasFilters ? "Limpe os filtros ou altere o periodo para visualizar mais linhas da DRE." : "Cadastre receitas e despesas para visualizar a DRE."}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function DreMobileList({ rows, isLoading, hasError, hasFilters }: { rows: DreLine[]; isLoading: boolean; hasError: boolean; hasFilters: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="dre-mobile-card">
            <div className="h-3 w-20 animate-pulse rounded-full bg-surface-muted" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded-full bg-surface-muted" />
            <div className="mt-3 flex items-center justify-between">
              <div className="h-5 w-24 animate-pulse rounded-full bg-surface-muted" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-2xl border border-dashed border-destructive/30 bg-danger-50 p-8 text-center text-sm font-medium text-destructive">
        Erro ao carregar DRE.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        title={hasFilters ? "Nenhuma categoria encontrada." : "Nenhum lancamento encontrado."}
        description={hasFilters ? "Limpe os filtros ou altere o periodo para visualizar mais linhas da DRE." : "Cadastre receitas e despesas para visualizar a DRE."}
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article key={row.id} className={cn("dre-mobile-card", row.emphasis && "border-primary-100 bg-primary-50/30", row.alert && "border-destructive/30 bg-danger-50")}>
          <div>
            <span className="dre-group-label">{row.group}</span>
            <h3 className="inline-flex items-center gap-2">
              {row.alert && <AlertTriangle className="size-4 text-destructive" aria-label="Categoria em alerta" />}
              {row.category}
            </h3>
          </div>
          <div className="dre-values">
            <strong className={cn(
              "money",
              row.type === "receita" ? "money-income" : row.type === "despesa" ? "money-expense" : row.amount < 0 ? "money-expense" : "money-balance",
            )}>
              {formatMoney(row.amount)}
            </strong>
            <span>{formatPercent(row.revenueShare)} da receita</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function filterDreRows(rows: DreLine[], groupFilter: string, categoryFilter: string): DreLine[] {
  return rows.filter((row) => {
    if (groupFilter !== "todos" && row.group !== groupFilter) return false;
    if (categoryFilter !== "todos" && row.category !== categoryFilter) return false;
    return true;
  });
}

function sortDreRows(rows: DreLine[], sortBy: string): DreLine[] {
  if (sortBy === "valor") return [...rows].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  if (sortBy === "receita") return [...rows].sort((a, b) => Math.abs(b.revenueShare) - Math.abs(a.revenueShare));
  return rows;
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
  return label.replace(".", "");
}

function compactMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return formatMoney(value);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
