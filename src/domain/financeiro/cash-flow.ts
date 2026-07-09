import { z } from "zod";

export const cashFlowGranularitySchema = z.enum(["day", "week", "month"]);
export const cashFlowViewSchema = z.enum(["both", "inflows", "outflows"]);

export const cashFlowQuerySchema = z.object({
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  granularity: cashFlowGranularitySchema.default("day"),
  view: cashFlowViewSchema.default("both"),
  categoryId: z.string().optional(),
  bank: z.string().default("all"),
});

export type CashFlowGranularity = z.infer<typeof cashFlowGranularitySchema>;
export type CashFlowView = z.infer<typeof cashFlowViewSchema>;
export type CashFlowQuery = z.infer<typeof cashFlowQuerySchema>;

export interface ProjectedCashFlowTransaction {
  id: string;
  type: "inflow" | "outflow";
  description: string;
  party: string | null;
  amount: number;
  dueDate: string;
  status: string;
  categoryId: string | null;
  categoryName: string | null;
  overdue: boolean;
}

export interface ProjectedCashFlowPeriod {
  id: string;
  label: string;
  dateFrom: string;
  dateTo: string;
  inflows: number;
  outflows: number;
  netMovement: number;
  projectedBalance: number;
  transactions: ProjectedCashFlowTransaction[];
}

export interface ProjectedCashFlowSummary {
  currentBalance: number;
  predictedInflows: number;
  predictedOutflows: number;
  finalProjectedBalance: number;
  lowestProjectedBalance: number;
  lowestProjectedBalanceDate: string;
  inflowCount: number;
  outflowCount: number;
}

export interface ProjectedCashFlowResult {
  filters: {
    dateFrom: string;
    dateTo: string;
    granularity: CashFlowGranularity;
    view: CashFlowView;
    categoryId: string | null;
    bank: string;
  };
  summary: ProjectedCashFlowSummary;
  periods: ProjectedCashFlowPeriod[];
}

export function buildProjectedCashFlow(input: {
  initialBalance: number;
  dateFrom: Date;
  dateTo: Date;
  granularity: CashFlowGranularity;
  view?: CashFlowView;
  categoryId?: string | null;
  bank?: string;
  transactions: ProjectedCashFlowTransaction[];
}): ProjectedCashFlowResult {
  const dateFrom = startOfDay(input.dateFrom);
  const dateTo = endOfDay(input.dateTo);
  if (dateTo < dateFrom) {
    throw Object.assign(new Error("Data final deve ser posterior ou igual a data inicial."), { name: "ValidationError" });
  }

  const view = input.view ?? "both";
  const transactions = input.transactions
    .filter((transaction) => {
      const dueDate = parseDateOnly(transaction.dueDate);
      const matchesView = view === "both" || (view === "inflows" && transaction.type === "inflow") || (view === "outflows" && transaction.type === "outflow");
      return matchesView && dueDate >= dateFrom && dueDate <= dateTo;
    })
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  const buckets = buildPeriodBuckets(dateFrom, dateTo, input.granularity);
  let runningBalance = roundCurrency(input.initialBalance);
  let lowestProjectedBalance = runningBalance;
  let lowestProjectedBalanceDate = toDateKey(dateFrom);
  let predictedInflows = 0;
  let predictedOutflows = 0;
  let inflowCount = 0;
  let outflowCount = 0;

  const periods = buckets.map((bucket) => {
    const periodTransactions = transactions.filter((transaction) => {
      const dueDate = parseDateOnly(transaction.dueDate);
      return dueDate >= bucket.from && dueDate <= bucket.to;
    });
    const inflows = roundCurrency(sumByType(periodTransactions, "inflow"));
    const outflows = roundCurrency(sumByType(periodTransactions, "outflow"));
    const netMovement = roundCurrency(inflows - outflows);
    runningBalance = roundCurrency(runningBalance + netMovement);
    predictedInflows = roundCurrency(predictedInflows + inflows);
    predictedOutflows = roundCurrency(predictedOutflows + outflows);
    inflowCount += periodTransactions.filter((transaction) => transaction.type === "inflow").length;
    outflowCount += periodTransactions.filter((transaction) => transaction.type === "outflow").length;

    if (runningBalance < lowestProjectedBalance) {
      lowestProjectedBalance = runningBalance;
      lowestProjectedBalanceDate = toDateKey(bucket.from);
    }

    return {
      id: `${toDateKey(bucket.from)}:${toDateKey(bucket.to)}`,
      label: formatBucketLabel(bucket.from, bucket.to, input.granularity),
      dateFrom: toDateKey(bucket.from),
      dateTo: toDateKey(bucket.to),
      inflows,
      outflows,
      netMovement,
      projectedBalance: runningBalance,
      transactions: periodTransactions,
    };
  });

  return {
    filters: {
      dateFrom: toDateKey(dateFrom),
      dateTo: toDateKey(dateTo),
      granularity: input.granularity,
      view,
      categoryId: input.categoryId ?? null,
      bank: input.bank ?? "all",
    },
    summary: {
      currentBalance: roundCurrency(input.initialBalance),
      predictedInflows,
      predictedOutflows,
      finalProjectedBalance: runningBalance,
      lowestProjectedBalance,
      lowestProjectedBalanceDate,
      inflowCount,
      outflowCount,
    },
    periods,
  };
}

export function resolvePresetRange(preset: string, referenceDate = new Date()) {
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "60d" ? 60 : preset === "90d" ? 90 : 15;
  const from = startOfDay(referenceDate);
  const to = endOfDay(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days - 1));
  return { from, to };
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseDateOnly(value: string) {
  const parts = value.slice(0, 10).split("-").map(Number);
  const year = parts[0] ?? Number.NaN;
  const month = parts[1] ?? Number.NaN;
  const day = parts[2] ?? Number.NaN;
  return startOfDay(new Date(year, month - 1, day));
}

function buildPeriodBuckets(dateFrom: Date, dateTo: Date, granularity: CashFlowGranularity) {
  const buckets: Array<{ from: Date; to: Date }> = [];
  const cursor = startOfDay(dateFrom);

  while (cursor <= dateTo) {
    const from = new Date(cursor);
    const to = getBucketEnd(from, granularity, dateTo);
    buckets.push({ from, to });
    cursor.setDate(to.getDate() + 1);
    cursor.setMonth(to.getMonth());
    cursor.setFullYear(to.getFullYear());
  }

  return buckets;
}

function getBucketEnd(from: Date, granularity: CashFlowGranularity, max: Date) {
  if (granularity === "day") return endOfDay(from);
  if (granularity === "week") {
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return endOfDay(to > max ? max : to);
  }
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  return endOfDay(to > max ? max : to);
}

function formatBucketLabel(from: Date, to: Date, granularity: CashFlowGranularity) {
  if (granularity === "day") {
    return from.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", weekday: "short" });
  }
  if (granularity === "week") {
    return `${from.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - ${to.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  }
  return from.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

function sumByType(transactions: ProjectedCashFlowTransaction[], type: ProjectedCashFlowTransaction["type"]) {
  return transactions.filter((transaction) => transaction.type === type).reduce((sum, transaction) => sum + transaction.amount, 0);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function roundCurrency(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}
