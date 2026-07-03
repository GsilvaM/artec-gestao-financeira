import { z } from "zod";
import {
  buildDre,
  buildMonthlyEvolution,
  formatPercent,
  formatVariacao,
  type DreLine,
  type PontoMensal,
} from "../../domain/financeiro/dre-visual.js";
import type { FinancialEntryRow } from "../../domain/financeiro/types.js";
import { formatDate, formatMoney } from "../../lib/utils.js";
import { financialEntryRepo } from "./repositories.js";

const companyName = "ArtecGestao";

const mensalSchema = z.object({
  periodo: z.literal("mensal"),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
});

const trimestreSchema = z.object({
  periodo: z.literal("trimestre"),
  trimestre: z.coerce.number().int().min(1).max(4),
  ano: z.coerce.number().int().min(2000).max(2100),
});

const anualSchema = z.object({
  periodo: z.literal("anual"),
  ano: z.coerce.number().int().min(2000).max(2100),
});

const customizadoSchema = z.object({
  periodo: z.literal("customizado"),
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const dreExportQuerySchema = z.discriminatedUnion("periodo", [
  mensalSchema,
  trimestreSchema,
  anualSchema,
  customizadoSchema,
]);

export type DreExportQuery = z.infer<typeof dreExportQuerySchema>;

export interface DreExportPeriod {
  kind: DreExportQuery["periodo"];
  dateFrom: Date;
  dateTo: Date;
  previousDateFrom: Date;
  previousDateTo: Date;
  label: string;
  filenameToken: string;
  includesMultipleMonths: boolean;
}

export interface DreExportPayload {
  companyName: string;
  title: string;
  period: DreExportPeriod;
  generatedAt: Date;
  summary: {
    receitas: number;
    despesas: number;
    resultado: number;
  };
  rows: DreLine[];
  monthlyComparison: PontoMensal[];
  empty: boolean;
}

export function parseDreExportQuery(params: URLSearchParams): DreExportQuery {
  return dreExportQuerySchema.parse(Object.fromEntries(params.entries()));
}

export function resolveDreExportPeriod(query: DreExportQuery): DreExportPeriod {
  if (query.periodo === "mensal") {
    const [year, month] = parseYearMonth(query.mes);
    const dateFrom = new Date(year, month - 1, 1);
    const dateTo = endOfDay(new Date(year, month, 0));
    const previous = new Date(year, month - 2, 1);
    return {
      kind: query.periodo,
      dateFrom,
      dateTo,
      previousDateFrom: new Date(previous.getFullYear(), previous.getMonth(), 1),
      previousDateTo: endOfDay(new Date(previous.getFullYear(), previous.getMonth() + 1, 0)),
      label: dateFrom.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      filenameToken: query.mes,
      includesMultipleMonths: false,
    };
  }

  if (query.periodo === "trimestre") {
    const startMonth = (query.trimestre - 1) * 3;
    const dateFrom = new Date(query.ano, startMonth, 1);
    const dateTo = endOfDay(new Date(query.ano, startMonth + 3, 0));
    const previousFrom = new Date(query.ano, startMonth - 3, 1);
    return {
      kind: query.periodo,
      dateFrom,
      dateTo,
      previousDateFrom: previousFrom,
      previousDateTo: endOfDay(new Date(previousFrom.getFullYear(), previousFrom.getMonth() + 3, 0)),
      label: `${formatDateOnly(dateFrom)} a ${formatDateOnly(dateTo)}`,
      filenameToken: `${query.ano}-T${query.trimestre}`,
      includesMultipleMonths: true,
    };
  }

  if (query.periodo === "anual") {
    const dateFrom = new Date(query.ano, 0, 1);
    const dateTo = endOfDay(new Date(query.ano, 11, 31));
    return {
      kind: query.periodo,
      dateFrom,
      dateTo,
      previousDateFrom: new Date(query.ano - 1, 0, 1),
      previousDateTo: endOfDay(new Date(query.ano - 1, 11, 31)),
      label: String(query.ano),
      filenameToken: String(query.ano),
      includesMultipleMonths: true,
    };
  }

  const dateFrom = parseDateOnly(query.inicio);
  const dateTo = endOfDay(parseDateOnly(query.fim));
  if (dateTo < dateFrom) {
    throw Object.assign(new Error("Data final deve ser posterior ou igual a data inicial."), { name: "ValidationError" });
  }
  const days = Math.max(1, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / 86_400_000));
  const previousDateTo = endOfDay(new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate() - 1));
  const previousDateFrom = new Date(previousDateTo.getFullYear(), previousDateTo.getMonth(), previousDateTo.getDate() - days + 1);

  return {
    kind: query.periodo,
    dateFrom,
    dateTo,
    previousDateFrom,
    previousDateTo,
    label: `${formatDateOnly(dateFrom)} a ${formatDateOnly(dateTo)}`,
    filenameToken: `${query.inicio}_${query.fim}`,
    includesMultipleMonths: crossesMonthBoundary(dateFrom, dateTo),
  };
}

export function buildDreExportPayload(
  entries: FinancialEntryRow[],
  previousEntries: FinancialEntryRow[],
  period: DreExportPeriod,
  generatedAt = new Date(),
): DreExportPayload {
  const dre = buildDre(entries, previousEntries);
  return {
    companyName,
    title: "Demonstracao de Resultado",
    period,
    generatedAt,
    summary: {
      receitas: dre.totalReceitas,
      despesas: dre.totalDespesas,
      resultado: dre.resultado,
    },
    rows: dre.rows,
    monthlyComparison: period.includesMultipleMonths ? buildMonthlyComparison(entries, period.dateFrom, period.dateTo) : [],
    empty: entries.length === 0,
  };
}

export async function getDreExportPayload(query: DreExportQuery): Promise<DreExportPayload> {
  const period = resolveDreExportPeriod(query);
  const [entries, previousEntries] = await Promise.all([
    financialEntryRepo.findAll({ dateFrom: period.dateFrom, dateTo: period.dateTo }),
    financialEntryRepo.findAll({ dateFrom: period.previousDateFrom, dateTo: period.previousDateTo }),
  ]);

  return buildDreExportPayload(
    entries.map(toFinancialEntryRow),
    previousEntries.map(toFinancialEntryRow),
    period,
  );
}

export function getDreExportFilename(payload: DreExportPayload): string {
  return `DRE_${sanitizeFilename(payload.companyName)}_${payload.period.filenameToken}.pdf`;
}

export function toPdfTableRows(rows: DreLine[]) {
  return rows.map((row) => ({
    group: row.group,
    category: row.category,
    amount: formatMoney(row.amount),
    revenueShare: formatPercent(row.revenueShare),
    variation: formatVariacao(row.variation),
    type: row.type,
    emphasis: Boolean(row.emphasis),
  }));
}

export function formatGeneratedAt(date: Date) {
  return `${formatDate(date)} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function buildMonthlyComparison(entries: FinancialEntryRow[], dateFrom: Date, dateTo: Date): PontoMensal[] {
  const existing = new Map(buildMonthlyEvolution(entries).map((point) => [point.mes, point]));
  const points: PontoMensal[] = [];
  const cursor = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
  const end = new Date(dateTo.getFullYear(), dateTo.getMonth(), 1);

  while (cursor <= end) {
    const mes = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    points.push(existing.get(mes) ?? { mes, receita: 0, despesa: 0, resultado: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return points;
}

type RepoEntry = Awaited<ReturnType<typeof financialEntryRepo.findAll>>[number];

function toFinancialEntryRow(entry: RepoEntry): FinancialEntryRow {
  return {
    id: entry.id,
    description: entry.description,
    amount: Number(entry.amount),
    type: entry.type === "receita" ? "receita" : "despesa",
    date: entry.date.toISOString(),
    status: entry.status === "pending" || entry.status === "cancelled" ? entry.status : "confirmed",
    categoryId: entry.categoryId,
    categoryName: entry.category?.name ?? "",
    categoryColor: entry.category?.color ?? null,
    costCenterId: entry.costCenterId,
    costCenterName: entry.costCenter?.name ?? null,
    collaboratorId: entry.collaboratorId,
    collaboratorName: entry.collaborator?.name ?? null,
    clientName: entry.clientName,
    userId: entry.userId,
    notes: entry.notes,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function parseYearMonth(value: string): [number, number] {
  const [yearValue, monthValue] = value.split("-").map(Number);
  const year = typeof yearValue === "number" && Number.isFinite(yearValue) ? yearValue : Number.NaN;
  const month = typeof monthValue === "number" && Number.isFinite(monthValue) ? monthValue : Number.NaN;
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw Object.assign(new Error("Mes invalido para exportacao."), { name: "ValidationError" });
  }
  return [year, month];
}

function parseDateOnly(value: string): Date {
  const [yearValue, monthValue, dayValue] = value.split("-").map(Number);
  const year = typeof yearValue === "number" && Number.isFinite(yearValue) ? yearValue : Number.NaN;
  const month = typeof monthValue === "number" && Number.isFinite(monthValue) ? monthValue : Number.NaN;
  const day = typeof dayValue === "number" && Number.isFinite(dayValue) ? dayValue : Number.NaN;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error("Data invalida para exportacao."), { name: "ValidationError" });
  }
  return date;
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function formatDateOnly(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function sanitizeFilename(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "");
}

function crossesMonthBoundary(dateFrom: Date, dateTo: Date): boolean {
  return dateFrom.getFullYear() !== dateTo.getFullYear() || dateFrom.getMonth() !== dateTo.getMonth();
}
