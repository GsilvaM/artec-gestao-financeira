import { z } from "zod";
import {
  cashFlowGranularitySchema,
  cashFlowViewSchema,
  type ProjectedCashFlowResult,
} from "../../domain/financeiro/cash-flow.js";
import { formatDate, formatMoney } from "../../lib/utils.js";
import { getProjectedCashFlow } from "./queries.js";

export const cashFlowExportQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  granularity: cashFlowGranularitySchema.default("day"),
  view: cashFlowViewSchema.default("both"),
  categoryId: z.string().optional(),
  bank: z.string().default("all"),
});

export type CashFlowExportQuery = z.infer<typeof cashFlowExportQuerySchema>;

export interface CashFlowExportPayload extends ProjectedCashFlowResult {
  companyName: string;
  title: string;
  generatedAt: Date;
  periodLabel: string;
}

export function parseCashFlowExportQuery(params: URLSearchParams): CashFlowExportQuery {
  return cashFlowExportQuerySchema.parse(Object.fromEntries(params.entries()));
}

export async function getCashFlowExportPayload(query: CashFlowExportQuery): Promise<CashFlowExportPayload> {
  const dateFrom = parseDateOnly(query.dateFrom);
  const dateTo = endOfDay(parseDateOnly(query.dateTo));
  const result = await getProjectedCashFlow({
    dateFrom,
    dateTo,
    granularity: query.granularity,
    view: query.view,
    categoryId: query.categoryId,
    bank: query.bank,
  });

  return {
    ...result,
    companyName: "ArtecGestao",
    title: "Fluxo de Caixa",
    generatedAt: new Date(),
    periodLabel: `${formatDate(dateFrom)} a ${formatDate(dateTo)}`,
  };
}

export function getCashFlowExportFilename(payload: CashFlowExportPayload): string {
  return `fluxo-de-caixa_${payload.filters.dateFrom}_${payload.filters.dateTo}.pdf`;
}

export function formatGeneratedAt(date: Date) {
  return `${formatDate(date)} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function toProjectionRows(payload: CashFlowExportPayload) {
  return payload.periods.map((period) => ({
    period: period.label,
    inflows: formatMoney(period.inflows),
    outflows: formatMoney(period.outflows),
    netMovement: formatMoney(period.netMovement),
    projectedBalance: formatMoney(period.projectedBalance),
  }));
}

function parseDateOnly(value: string) {
  const parts = value.split("-").map(Number);
  const year = parts[0] ?? Number.NaN;
  const month = parts[1] ?? Number.NaN;
  const day = parts[2] ?? Number.NaN;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    throw Object.assign(new Error("Data invalida para exportacao."), { name: "ValidationError" });
  }
  return date;
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
