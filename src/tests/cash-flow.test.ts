import { describe, expect, it } from "vitest";
import { buildCashFlowInsight, buildProjectedCashFlow, type ProjectedCashFlowTransaction } from "@/domain/financeiro/cash-flow";

function transaction(partial: Partial<ProjectedCashFlowTransaction> & Pick<ProjectedCashFlowTransaction, "id" | "type" | "amount" | "dueDate">): ProjectedCashFlowTransaction {
  return {
    description: partial.description ?? "Lancamento projetado",
    party: partial.party ?? "Cliente",
    status: partial.status ?? "Previsto",
    categoryId: partial.categoryId ?? null,
    categoryName: partial.categoryName ?? null,
    overdue: partial.overdue ?? false,
    ...partial,
  };
}

describe("buildProjectedCashFlow", () => {
  it("keeps the initial balance when there are no projected transactions", () => {
    const result = buildProjectedCashFlow({
      initialBalance: 1000,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 11),
      granularity: "day",
      transactions: [],
    });

    expect(result.summary.currentBalance).toBe(1000);
    expect(result.summary.finalProjectedBalance).toBe(1000);
    expect(result.periods).toHaveLength(3);
    expect(result.periods.every((period) => period.projectedBalance === 1000)).toBe(true);
  });

  it("accumulates inflows and outflows by day", () => {
    const result = buildProjectedCashFlow({
      initialBalance: 500,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 10),
      granularity: "day",
      transactions: [
        transaction({ id: "r1", type: "inflow", amount: 300, dueDate: "2026-07-09" }),
        transaction({ id: "p1", type: "outflow", amount: 120, dueDate: "2026-07-10" }),
      ],
    });

    expect(result.summary.predictedInflows).toBe(300);
    expect(result.summary.predictedOutflows).toBe(120);
    expect(result.summary.finalProjectedBalance).toBe(680);
    expect(result.periods.map((period) => period.projectedBalance)).toEqual([800, 680]);
  });

  it("tracks the lowest projected balance when cash becomes negative", () => {
    const result = buildProjectedCashFlow({
      initialBalance: 100,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 11),
      granularity: "day",
      transactions: [
        transaction({ id: "p1", type: "outflow", amount: 250, dueDate: "2026-07-10" }),
        transaction({ id: "r1", type: "inflow", amount: 80, dueDate: "2026-07-11" }),
      ],
    });

    expect(result.summary.lowestProjectedBalance).toBe(-150);
    expect(result.summary.lowestProjectedBalanceDate).toBe("2026-07-10");
    expect(result.summary.finalProjectedBalance).toBe(-70);
  });

  it("aggregates transactions by weekly buckets", () => {
    const result = buildProjectedCashFlow({
      initialBalance: 1000,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 22),
      granularity: "week",
      transactions: [
        transaction({ id: "r1", type: "inflow", amount: 100, dueDate: "2026-07-09" }),
        transaction({ id: "p1", type: "outflow", amount: 40, dueDate: "2026-07-14" }),
        transaction({ id: "p2", type: "outflow", amount: 70, dueDate: "2026-07-16" }),
      ],
    });

    expect(result.periods).toHaveLength(2);
    expect(result.periods[0]?.inflows).toBe(100);
    expect(result.periods[0]?.outflows).toBe(40);
    expect(result.periods[1]?.outflows).toBe(70);
    expect(result.summary.finalProjectedBalance).toBe(990);
  });

  it("builds an actionable insight when the projected balance falls below the configured minimum", () => {
    const result = buildProjectedCashFlow({
      initialBalance: 100,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 11),
      granularity: "day",
      transactions: [
        transaction({ id: "p1", type: "outflow", amount: 250, dueDate: "2026-07-10" }),
      ],
    });

    const insight = buildCashFlowInsight(result, 50);

    expect(insight.tone).toBe("warning");
    expect(insight.title).toContain("saldo");
    expect(insight.message).toContain("mínimo");
  });

  it("states that the balance is already negative instead of announcing a future drop", () => {
    const result = buildProjectedCashFlow({
      initialBalance: -500,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 11),
      granularity: "day",
      transactions: [
        transaction({ id: "p1", type: "outflow", amount: 250, dueDate: "2026-07-10" }),
      ],
    });

    const insight = buildCashFlowInsight(result);

    expect(insight.tone).toBe("warning");
    expect(insight.title).toContain("atual");
    expect(insight.message).toContain("já está negativo");
    expect(insight.message).not.toContain("ficará negativo");
  });

  it("filters projected transactions by view", () => {
    const transactions = [
      transaction({ id: "r1", type: "inflow", amount: 300, dueDate: "2026-07-09" }),
      transaction({ id: "p1", type: "outflow", amount: 120, dueDate: "2026-07-09" }),
    ];

    const inflows = buildProjectedCashFlow({
      initialBalance: 500,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 9),
      granularity: "day",
      view: "inflows",
      transactions,
    });
    const outflows = buildProjectedCashFlow({
      initialBalance: 500,
      dateFrom: new Date(2026, 6, 9),
      dateTo: new Date(2026, 6, 9),
      granularity: "day",
      view: "outflows",
      transactions,
    });

    expect(inflows.summary.predictedInflows).toBe(300);
    expect(inflows.summary.predictedOutflows).toBe(0);
    expect(inflows.summary.finalProjectedBalance).toBe(800);
    expect(inflows.periods[0]?.transactions.map((item) => item.type)).toEqual(["inflow"]);

    expect(outflows.summary.predictedInflows).toBe(0);
    expect(outflows.summary.predictedOutflows).toBe(120);
    expect(outflows.summary.finalProjectedBalance).toBe(380);
    expect(outflows.periods[0]?.transactions.map((item) => item.type)).toEqual(["outflow"]);
  });
});
