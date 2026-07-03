import type { FinancialEntryFilters, FinancialEntryRow } from "./types";

export const LIMIAR_ALERTA_DESPESA_PCT_RECEITA = 0.5;

export type DreLineType = "receita" | "despesa" | "resultado";

export type VariacaoDirecao = "alta" | "baixa" | "estavel" | "novo";

export interface VariacaoResultado {
  percentual: number | null;
  absoluto: number;
  direcao: VariacaoDirecao;
}

export interface DreLine {
  id: string;
  group: string;
  category: string;
  type: DreLineType;
  amount: number;
  revenueShare: number;
  variation: VariacaoResultado;
  alert: boolean;
  categoryColor: string | null;
  emphasis?: boolean;
}

export interface FatiaComposicao {
  categoria: string;
  valor: number;
  percentual: number;
  percentualReceita: number;
  alerta: boolean;
  color: string;
}

export interface PontoMensal {
  mes: string;
  receita: number;
  despesa: number;
  resultado: number;
  margem: number | null;
  hasData?: boolean;
}

export interface DreInsight {
  id: string;
  tone: "positive" | "negative" | "warning" | "neutral";
  text: string;
}

export type BreakEvenTone = "negative" | "positive" | "neutral";

export interface BreakEvenState {
  tone: BreakEvenTone;
  difference: number;
  receitaPct: number;
  despesaPct: number;
  coberturaPct: number;
  gap: number;
  text: string;
}

export interface MonthRange {
  value: string;
  dateFrom: Date;
  dateTo: Date;
}

const COMPOSITION_COLORS = [
  "var(--chart-balance)",
  "var(--chart-revenue)",
  "var(--warning)",
  "var(--violet)",
  "var(--chart-expense)",
  "var(--info)",
];

export function calcularVariacao(atual: number, anterior: number | null): VariacaoResultado {
  const absolute = roundCurrency(atual - (anterior ?? 0));

  if (anterior === null) {
    return {
      percentual: atual === 0 ? 0 : null,
      absoluto: absolute,
      direcao: atual === 0 ? "estavel" : "novo",
    };
  }

  if (anterior === 0) {
    return {
      percentual: atual === 0 ? 0 : null,
      absoluto: absolute,
      direcao: atual === 0 ? "estavel" : "novo",
    };
  }

  const percentual = ((atual - anterior) / Math.abs(anterior)) * 100;
  const direcao = percentual > 0 ? "alta" : percentual < 0 ? "baixa" : "estavel";

  return {
    percentual: roundPercent(percentual),
    absoluto: absolute,
    direcao,
  };
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0,0%";
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function formatOptionalPercent(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "-" : formatPercent(value);
}

export function formatVariacao(variation: VariacaoResultado): string {
  if (variation.direcao === "novo") return "Novo";
  if (variation.percentual === null) return "Novo";
  if (variation.percentual === 0 && variation.absoluto === 0) return "-";
  const sign = variation.percentual > 0 ? "+" : "";
  return `${sign}${formatPercent(variation.percentual)}`;
}

export function getVariacaoTone(type: DreLineType, variation: VariacaoResultado): "positive" | "negative" | "neutral" {
  if (variation.direcao === "estavel") return "neutral";
  if (type === "resultado") return variation.absoluto >= 0 ? "positive" : "negative";
  if (type === "receita") return variation.direcao === "alta" || variation.direcao === "novo" ? "positive" : "negative";
  if (type === "despesa") return variation.direcao === "alta" || variation.direcao === "novo" ? "negative" : "positive";
  return "neutral";
}

export function getActiveMonthRange(filterMonth: string, referenceDate = new Date()): MonthRange {
  const value = filterMonth || `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
  const { year, month } = parseMonthValue(value, referenceDate);
  return {
    value,
    dateFrom: new Date(year, month - 1, 1),
    dateTo: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

export function getPreviousMonthRange(monthValue: string): MonthRange {
  const { year, month } = parseMonthValue(monthValue);
  const date = new Date(year, month - 2, 1);
  return getActiveMonthRange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, date);
}

export function buildMonthRangeFilters(range: MonthRange, search?: string): FinancialEntryFilters {
  const filters: FinancialEntryFilters = {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
  };
  if (search) filters.search = search;
  return filters;
}

export function buildHistoryFilters(monthsBack: 6 | 12, referenceMonth: string): FinancialEntryFilters {
  const { year, month } = parseMonthValue(referenceMonth);
  return {
    dateFrom: new Date(year, month - monthsBack, 1),
    dateTo: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

export function buildDre(entries: FinancialEntryRow[], previousEntries: FinancialEntryRow[] = []) {
  const totalReceitas = sumByType(entries, "receita");
  const totalDespesas = sumByType(entries, "despesa");
  const previousReceitas = sumByType(previousEntries, "receita");
  const previousDespesas = sumByType(previousEntries, "despesa");
  const resultado = roundCurrency(totalReceitas - totalDespesas);
  const previousResultado = roundCurrency(previousReceitas - previousDespesas);

  const previousByCategory = buildCategoryMap(previousEntries, 0);
  const categoryRows = buildCategoryMap(entries, totalReceitas);

  const rows = [...categoryRows.values()]
    .map((row) => {
      const previous = previousByCategory.get(row.id);
      const variation = calcularVariacao(row.amount, previous ? previous.amount : null);
      return {
        ...row,
        variation,
        alert: shouldAlertExpenseCategory(row.type, row.amount, totalReceitas),
      };
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "receita" ? -1 : 1;
      return b.amount - a.amount;
    });

  if (entries.length) {
    rows.unshift({
      id: "total-receitas",
      group: "Receitas",
      category: "Receita bruta",
      type: "receita",
      amount: totalReceitas,
      revenueShare: totalReceitas ? 100 : 0,
      variation: calcularVariacao(totalReceitas, previousReceitas),
      alert: false,
      categoryColor: null,
      emphasis: true,
    });
    rows.push({
      id: "total-despesas",
      group: "Despesas",
      category: "Total de despesas",
      type: "despesa",
      amount: totalDespesas,
      revenueShare: totalReceitas ? (totalDespesas / totalReceitas) * 100 : 0,
      variation: calcularVariacao(totalDespesas, previousDespesas),
      alert: shouldAlertExpenseCategory("despesa", totalDespesas, totalReceitas),
      categoryColor: null,
      emphasis: true,
    });
    rows.push({
      id: "resultado-liquido",
      group: "Resultado",
      category: "Resultado liquido",
      type: "resultado",
      amount: resultado,
      revenueShare: totalReceitas ? (resultado / totalReceitas) * 100 : 0,
      variation: calcularVariacao(resultado, previousResultado),
      alert: false,
      categoryColor: null,
      emphasis: true,
    });
  }

  return {
    totalReceitas,
    totalDespesas,
    resultado,
    margemLiquida: totalReceitas > 0 ? roundPercent((resultado / totalReceitas) * 100) : null,
    coberturaDespesas: totalDespesas > 0 ? roundPercent((totalReceitas / totalDespesas) * 100) : null,
    gapEquilibrio: roundCurrency(totalDespesas - totalReceitas),
    variacaoReceitas: calcularVariacao(totalReceitas, previousReceitas),
    variacaoDespesas: calcularVariacao(totalDespesas, previousDespesas),
    variacaoResultado: calcularVariacao(resultado, previousResultado),
    rows,
  };
}

export function buildExpenseComposition(rows: DreLine[]): FatiaComposicao[] {
  const expenses = rows.filter((row) => row.type === "despesa" && !row.emphasis && row.amount > 0);
  const total = expenses.reduce((sum, row) => sum + row.amount, 0);
  const totalReceitas = rows.find((row) => row.id === "total-receitas")?.amount ?? 0;
  if (total <= 0) return [];

  const visible: FatiaComposicao[] = [];
  let outrosValor = 0;
  let outrosAlerta = false;

  expenses.forEach((row, index) => {
    const percentual = (row.amount / total) * 100;
    if (index >= 5 || percentual < 2) {
      outrosValor += row.amount;
      outrosAlerta ||= row.alert;
      return;
    }

    visible.push({
      categoria: row.category,
      valor: roundCurrency(row.amount),
      percentual: roundPercent(percentual),
      percentualReceita: totalReceitas > 0 ? roundPercent((row.amount / totalReceitas) * 100) : 0,
      alerta: row.alert,
      color: row.alert ? "var(--chart-expense)" : row.categoryColor || getCompositionColor(index),
    });
  });

  if (outrosValor > 0) {
    visible.push({
      categoria: "Outros",
      valor: roundCurrency(outrosValor),
      percentual: roundPercent((outrosValor / total) * 100),
      percentualReceita: totalReceitas > 0 ? roundPercent((outrosValor / totalReceitas) * 100) : 0,
      alerta: outrosAlerta,
      color: outrosAlerta ? "var(--chart-expense)" : getCompositionColor(4),
    });
  }

  return normalizeCompositionPercentages(visible);
}

export function buildMonthlyEvolution(entries: FinancialEntryRow[]): PontoMensal[] {
  const points = new Map<string, PontoMensal>();

  for (const entry of entries) {
    const month = getEntryMonth(entry.date);
    if (!month) continue;
    const point = points.get(month) ?? { mes: month, receita: 0, despesa: 0, resultado: 0, margem: null, hasData: true };
    if (entry.type === "receita") point.receita += entry.amount;
    if (entry.type === "despesa") point.despesa += entry.amount;
    point.receita = roundCurrency(point.receita);
    point.despesa = roundCurrency(point.despesa);
    point.resultado = roundCurrency(point.receita - point.despesa);
    point.margem = point.receita > 0 ? roundPercent((point.resultado / point.receita) * 100) : null;
    point.hasData = true;
    points.set(month, point);
  }

  return [...points.values()].sort((a, b) => a.mes.localeCompare(b.mes));
}

export function buildMonthlyEvolutionSeries(
  entries: FinancialEntryRow[],
  monthsBack: 6 | 12,
  referenceMonth: string,
): PontoMensal[] {
  const existing = new Map(buildMonthlyEvolution(entries).map((point) => [point.mes, point]));
  const { year, month } = parseMonthValue(referenceMonth);
  const points: PontoMensal[] = [];
  const cursor = new Date(year, month - monthsBack, 1);

  for (let index = 0; index < monthsBack; index += 1) {
    const mes = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    points.push(existing.get(mes) ?? { mes, receita: 0, despesa: 0, resultado: 0, margem: null, hasData: false });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return points;
}

export function buildDreInsights({
  totalReceitas,
  totalDespesas,
  resultado,
  margemLiquida,
  coberturaDespesas,
}: ReturnType<typeof buildDre>, composition: FatiaComposicao[]): DreInsight[] {
  if (totalReceitas <= 0 && totalDespesas <= 0) {
    return [{ id: "empty", tone: "neutral", text: "Ainda nao ha dados suficientes para gerar uma leitura gerencial do periodo." }];
  }

  const insights: DreInsight[] = [];

  if (resultado < 0) {
    insights.push({
      id: "resultado-negativo",
      tone: "negative",
      text: `As despesas superaram as receitas em ${formatCurrencyText(Math.abs(resultado))} no periodo.`,
    });
  } else if (resultado > 0) {
    insights.push({
      id: "resultado-positivo",
      tone: "positive",
      text: `A receita supera as despesas em ${formatCurrencyText(resultado)} no periodo.`,
    });
  } else {
    insights.push({ id: "equilibrio", tone: "neutral", text: "Receitas e despesas estao empatadas no periodo." });
  }

  const topExpense = composition[0];
  if (topExpense) {
    insights.push({
      id: "maior-despesa",
      tone: topExpense.alerta ? "warning" : "neutral",
      text: `${topExpense.categoria} representa ${formatPercent(topExpense.percentualReceita)} da receita e ${formatPercent(topExpense.percentual)} das despesas.`,
    });
  }

  const coberturaText = coberturaDespesas === null
    ? "Nao ha despesas no periodo para medir cobertura."
    : `A receita cobre ${formatPercent(coberturaDespesas)} das despesas.`;
  insights.push({
    id: "cobertura",
    tone: coberturaDespesas !== null && coberturaDespesas < 100 ? "warning" : "positive",
    text: coberturaText,
  });

  if (margemLiquida !== null) {
    insights.push({
      id: "margem",
      tone: margemLiquida < 0 ? "negative" : margemLiquida === 0 ? "neutral" : "positive",
      text: `Margem liquida do periodo: ${formatPercent(margemLiquida)}.`,
    });
  }

  return insights.slice(0, 4);
}

export function getBreakEvenState(receita: number, despesa: number, formatter: (value: number) => string): BreakEvenState {
  const scale = Math.max(receita, despesa, 1);
  const difference = roundCurrency(receita - despesa);
  const receitaPct = clampPercent((receita / scale) * 100);
  const despesaPct = clampPercent((despesa / scale) * 100);
  const coberturaPct = despesa > 0 ? roundPercent((receita / despesa) * 100) : receita > 0 ? 100 : 0;
  const gap = roundCurrency(despesa - receita);

  if (difference < 0) {
    return {
      tone: "negative",
      difference: Math.abs(difference),
      receitaPct,
      despesaPct,
      coberturaPct,
      gap,
      text: `Falta ${formatter(Math.abs(difference))} para cobrir as despesas do periodo`,
    };
  }

  if (difference > 0) {
    return {
      tone: "positive",
      difference,
      receitaPct,
      despesaPct,
      coberturaPct,
      gap,
      text: `Margem de ${formatter(difference)} acima do ponto de equilibrio`,
    };
  }

  return {
    tone: "neutral",
    difference: 0,
    receitaPct,
    despesaPct,
    coberturaPct,
    gap,
    text: "Ponto de equilibrio atingido",
  };
}

export function shouldAlertExpenseCategory(type: DreLineType, amount: number, totalReceitas: number): boolean {
  if (type !== "despesa" || totalReceitas <= 0) return false;
  return amount / totalReceitas >= LIMIAR_ALERTA_DESPESA_PCT_RECEITA;
}

function buildCategoryMap(entries: FinancialEntryRow[], totalReceitas: number) {
  const categoryRows = new Map<string, DreLine>();

  for (const entry of entries) {
    if (entry.type !== "receita" && entry.type !== "despesa") continue;
    const category = entry.categoryName || "Sem categoria";
    const group = entry.type === "receita" ? "Receitas" : "Despesas";
    const key = `${entry.type}:${category}`;
    const current = categoryRows.get(key) ?? {
      id: key,
      group,
      category,
      type: entry.type,
      amount: 0,
      revenueShare: 0,
      variation: calcularVariacao(0, 0),
      alert: false,
      categoryColor: entry.categoryColor,
    };
    current.amount = roundCurrency(current.amount + entry.amount);
    current.revenueShare = totalReceitas ? (current.amount / totalReceitas) * 100 : 0;
    categoryRows.set(key, current);
  }

  return categoryRows;
}

function sumByType(entries: FinancialEntryRow[], type: "receita" | "despesa"): number {
  return roundCurrency(entries.filter((entry) => entry.type === type).reduce((sum, entry) => sum + entry.amount, 0));
}

function normalizeCompositionPercentages(items: FatiaComposicao[]): FatiaComposicao[] {
  if (!items.length) return items;
  const total = items.reduce((sum, item) => sum + item.percentual, 0);
  const delta = roundPercent(100 - total);
  let largestIndex = 0;
  items.forEach((item, index) => {
    const largest = items[largestIndex];
    if (largest && item.percentual > largest.percentual) largestIndex = index;
  });
  return items.map((item, index) => index === largestIndex ? { ...item, percentual: roundPercent(item.percentual + delta) } : item);
}

function formatCurrencyText(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseMonthValue(value: string, fallback = new Date()): { year: number; month: number } {
  const [yearValue, monthValue] = value.split("-").map(Number);
  const year = typeof yearValue === "number" && Number.isFinite(yearValue) ? yearValue : fallback.getFullYear();
  const month = typeof monthValue === "number" && Number.isFinite(monthValue) && monthValue >= 1 && monthValue <= 12
    ? monthValue
    : fallback.getMonth() + 1;
  return { year, month };
}

function getCompositionColor(index: number): string {
  return COMPOSITION_COLORS[index % COMPOSITION_COLORS.length] ?? "var(--chart-balance)";
}

function getEntryMonth(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value + (value.includes("T") ? "" : "T00:00:00"));
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
