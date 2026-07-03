import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, BarChart3, FileDown, Loader2, Scale } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
  buildExpenseComposition,
  buildHistoryFilters,
  buildMonthRangeFilters,
  buildMonthlyEvolution,
  formatPercent,
  formatVariacao,
  getActiveMonthRange,
  getBreakEvenState,
  getPreviousMonthRange,
  getVariacaoTone,
  type BreakEvenState,
  type DreLine,
  type FatiaComposicao,
  type PontoMensal,
  type VariacaoResultado,
} from "@/domain/financeiro/dre-visual";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import { clientApi } from "@/server/financeiro/client-api";
import { cn, formatMoney } from "@/lib/utils";
import type { FinancialEntryFilters } from "@/domain/financeiro/types";
import { toast } from "sonner";

export function Component() {
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
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
  const evolution = useMemo(() => buildMonthlyEvolution(historyEntries), [historyEntries]);
  const breakEven = useMemo(
    () => getBreakEvenState(dre.totalReceitas, dre.totalDespesas, formatMoney),
    [dre.totalDespesas, dre.totalReceitas],
  );

  return (
    <PageShell icon={BarChart3} title="DRE" subtitle="Demonstração de resultado por período.">
      <div className="stats-grid">
        <MetricCard title="Receitas" value={formatMoney(dre.totalReceitas)} icon={ArrowUpCircle} tone="green" helper={formatVariacao(dre.variacaoReceitas)} />
        <MetricCard title="Despesas" value={formatMoney(dre.totalDespesas)} icon={ArrowDownCircle} tone="red" helper={formatVariacao(dre.variacaoDespesas)} />
        <MetricCard title="Resultado" value={formatMoney(dre.resultado)} icon={Scale} tone={dre.resultado < 0 ? "red" : "blue"} helper={formatVariacao(dre.variacaoResultado)} />
      </div>

      <BreakEvenIndicator state={breakEven} receita={dre.totalReceitas} despesa={dre.totalDespesas} />

      <DreEvolutionChart
        data={evolution}
        months={historyMonths}
        onMonthsChange={setHistoryMonths}
        isLoading={isHistoryLoading}
      />

      <ExpenseComposition composition={composition} />

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => setExportOpen(true)}>
          <FileDown className="size-4" />
          Exportar PDF
        </Button>
      </div>

      <FilterBar searchPlaceholder="Buscar categoria ou descrição..." search={search} onSearchChange={setSearch}>
        <MonthSelect value={filterMonth} onValueChange={setFilterMonth} />
      </FilterBar>

      <div className="desktop-table">
        <DreTable rows={dre.rows} isLoading={isLoading} hasError={Boolean(error)} />
      </div>

      <div className="mobile-list">
        <DreMobileList rows={dre.rows} isLoading={isLoading} hasError={Boolean(error)} />
      </div>

      <DrePdfExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        activeMonth={activeMonth.value}
      />
    </PageShell>
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
      <DialogContent>
        <DialogCloseButton onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Exportar DRE em PDF</DialogTitle>
          <DialogDescription>
            Escolha o periodo do PDF sem alterar os filtros da tela.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
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

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="card-label">Ponto de equilíbrio</p>
          <h2 className={cn("mt-2 text-lg font-bold leading-tight", toneClass)}>{state.text}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Receita atual {formatMoney(receita)} · Despesas {formatMoney(despesa)}
          </p>
        </div>
        <div className="min-w-0 flex-1 lg:max-w-xl">
          <div className="relative h-4 rounded-full bg-surface-muted">
            <span className="absolute inset-y-0 left-0 rounded-full bg-success" style={{ width: `${state.receitaPct}%` }} />
            <span className={cn("absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-2 border-surface shadow-sm", markerClass)} style={{ left: `calc(${state.despesaPct}% - 10px)` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 text-xs font-bold text-muted-foreground">
            <span>Receita</span>
            <span>Despesa</span>
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
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="card-label">Evolução mensal</p>
          <h2 className="mt-2 text-lg font-bold leading-tight text-foreground">Receita, despesa e resultado</h2>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-[var(--surface-2)] p-1">
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
      <div className="h-[280px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">Carregando gráfico...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tickFormatter={formatMonthLabel} tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickFormatter={(value: number) => compactMoney(value)} tickLine={false} axisLine={false} fontSize={12} width={64} />
              <Tooltip content={<DreChartTooltip />} />
              <Line type="monotone" dataKey="receita" name="Receita" stroke="var(--chart-revenue)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="despesa" name="Despesa" stroke="var(--chart-expense)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="resultado" name="Resultado" stroke="var(--chart-balance)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
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

  return (
    <div className="rounded-xl border border-border bg-popover p-3 text-sm shadow-elevated">
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
      </div>
    </div>
  );
}

function ExpenseComposition({ composition }: { composition: FatiaComposicao[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <p className="card-label">Composição de despesas</p>
        <h2 className="mt-2 text-lg font-bold leading-tight text-foreground">Categorias que mais pressionam a receita</h2>
      </div>
      {composition.length ? (
        <div className="space-y-4">
          <div className="flex h-5 overflow-hidden rounded-full bg-surface-muted">
            {composition.map((item) => (
              <span
                key={item.categoria}
                className={cn("h-full min-w-1", item.alerta && "ring-2 ring-inset ring-destructive/40")}
                style={{ width: `${item.percentual}%`, background: item.color }}
                title={`${item.categoria}: ${formatPercent(item.percentual)}`}
              />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {composition.map((item) => (
              <div key={item.categoria} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-[var(--surface-2)] px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                  <span className="truncate">{item.categoria}</span>
                  {item.alerta && <AlertTriangle className="size-4 shrink-0 text-destructive" aria-label="Categoria em alerta" />}
                </span>
                <strong className="shrink-0 text-sm tabular-nums text-muted-foreground">{formatPercent(item.percentual)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm font-semibold text-muted-foreground">
          Nenhuma despesa no período.
        </div>
      )}
    </Card>
  );
}

function DreTable({ rows, isLoading, hasError }: { rows: DreLine[]; isLoading: boolean; hasError: boolean }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Realizado</TableHead>
            <TableHead>% Receita</TableHead>
            <TableHead>Variação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-56 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : hasError ? (
            <TableRow>
              <TableCell colSpan={5} className="h-56 text-center text-sm font-medium text-destructive">
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
                <TableCell className={row.type === "receita" ? "text-success" : row.type === "despesa" ? "text-destructive" : row.amount < 0 ? "text-destructive" : "text-primary"}>
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{formatPercent(row.revenueShare)}</TableCell>
                <TableCell>
                  <VariationBadge variation={row.variation} type={row.type} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <EmptyState title="Nenhum lançamento encontrado." description="Cadastre receitas e despesas para visualizar a DRE." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function DreMobileList({ rows, isLoading, hasError }: { rows: DreLine[]; isLoading: boolean; hasError: boolean }) {
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
      <EmptyState title="Nenhum lançamento encontrado." description="Cadastre receitas e despesas para visualizar a DRE." />
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
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-xs font-semibold text-muted-foreground">Variação</span>
            <VariationBadge variation={row.variation} type={row.type} />
          </div>
        </article>
      ))}
    </div>
  );
}

function VariationBadge({ variation, type }: { variation: VariacaoResultado; type: DreLine["type"] }) {
  const tone = getVariacaoTone(type, variation);
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center justify-center rounded-full border px-2.5 text-xs font-bold leading-none tabular-nums",
        tone === "positive" && "border-success/20 bg-success-light text-success",
        tone === "negative" && "border-destructive/20 bg-destructive-light text-destructive",
        tone === "neutral" && "border-border bg-[var(--surface-2)] text-muted-foreground",
      )}
    >
      {formatVariacao(variation)}
    </span>
  );
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
