import { describe, expect, it } from "vitest";
import {
  buildDre,
  buildDreInsights,
  buildExpenseComposition,
  buildMonthlyEvolution,
  buildMonthlyEvolutionSeries,
  calcularVariacao,
  formatOptionalPercent,
  getBreakEvenState,
  shouldAlertExpenseCategory,
} from "@/domain/financeiro/dre-visual";
import type { FinancialEntryRow } from "@/domain/financeiro/types";

function entry(partial: Partial<FinancialEntryRow>): FinancialEntryRow {
  return {
    id: partial.id ?? crypto.randomUUID(),
    description: partial.description ?? "Lancamento",
    amount: partial.amount ?? 0,
    type: partial.type ?? "despesa",
    date: partial.date ?? "2026-07-01",
    status: partial.status ?? "confirmed",
    categoryId: partial.categoryId ?? "cat",
    categoryName: partial.categoryName ?? "Categoria",
    categoryColor: partial.categoryColor ?? null,
    costCenterId: partial.costCenterId ?? null,
    costCenterName: partial.costCenterName ?? null,
    collaboratorId: partial.collaboratorId ?? null,
    collaboratorName: partial.collaboratorName ?? null,
    clientName: partial.clientName ?? null,
    userId: partial.userId ?? "user",
    notes: partial.notes ?? null,
    createdAt: partial.createdAt ?? "2026-07-01T00:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-07-01T00:00:00.000Z",
  };
}

describe("dre visual helpers", () => {
  it("calcula variacao sem NaN ou Infinity", () => {
    expect(calcularVariacao(120, 100)).toEqual({ percentual: 20, absoluto: 20, direcao: "alta" });
    expect(calcularVariacao(80, 100)).toEqual({ percentual: -20, absoluto: -20, direcao: "baixa" });
    expect(calcularVariacao(10, null)).toEqual({ percentual: null, absoluto: 10, direcao: "novo" });
    expect(calcularVariacao(0, 0)).toEqual({ percentual: 0, absoluto: 0, direcao: "estavel" });
    expect(calcularVariacao(100, 100)).toEqual({ percentual: 0, absoluto: 0, direcao: "estavel" });
  });

  it("aplica a mesma variacao em cards e linhas por categoria", () => {
    const dre = buildDre(
      [
        entry({ type: "receita", amount: 2000, categoryName: "Servicos" }),
        entry({ type: "despesa", amount: 1000, categoryName: "Colaborador" }),
      ],
      [
        entry({ type: "receita", amount: 1000, categoryName: "Servicos" }),
        entry({ type: "despesa", amount: 500, categoryName: "Colaborador" }),
      ],
    );

    expect(dre.variacaoReceitas.percentual).toBe(100);
    expect(dre.variacaoDespesas.percentual).toBe(100);
    expect(dre.margemLiquida).toBe(50);
    expect(dre.coberturaDespesas).toBe(200);
    expect(dre.rows.find((row) => row.category === "Colaborador")?.variation.percentual).toBe(100);
  });

  it("soma a composicao de despesas em aproximadamente 100%", () => {
    const dre = buildDre([
      entry({ type: "receita", amount: 20769, categoryName: "Receita" }),
      entry({ type: "despesa", amount: 22456.28, categoryName: "Colaborador" }),
      entry({ type: "despesa", amount: 4957.88, categoryName: "Ticket aliment." }),
      entry({ type: "despesa", amount: 874.92, categoryName: "EPIs" }),
      entry({ type: "despesa", amount: 583.28, categoryName: "Gestor" }),
      entry({ type: "despesa", amount: 291.64, categoryName: "Pequenas" }),
    ]);

    const composition = buildExpenseComposition(dre.rows);
    const totalPercent = composition.reduce((sum, item) => sum + item.percentual, 0);

    expect(totalPercent).toBeGreaterThanOrEqual(99);
    expect(totalPercent).toBeLessThanOrEqual(101);
    expect(composition.find((item) => item.categoria === "Colaborador")?.alerta).toBe(true);
    expect(composition.find((item) => item.categoria === "Colaborador")?.percentualReceita).toBeGreaterThan(100);
  });

  it("trata ponto de equilibrio negativo, positivo e exato", () => {
    const format = (value: number) => `R$ ${value.toFixed(2)}`;

    expect(getBreakEvenState(20769, 29163.53, format).text).toContain("R$ 8394.53");
    expect(getBreakEvenState(30000, 20000, format).tone).toBe("positive");
    expect(getBreakEvenState(1000, 1000, format).text).toBe("Ponto de equilibrio atingido");
  });

  it("dispara alerta no limiar exato e nao dispara abaixo", () => {
    expect(shouldAlertExpenseCategory("despesa", 500, 1000)).toBe(true);
    expect(shouldAlertExpenseCategory("despesa", 499.99, 1000)).toBe(false);
    expect(shouldAlertExpenseCategory("receita", 1000, 1000)).toBe(false);
  });

  it("gera evolucao mensal apenas com meses que possuem dados", () => {
    const points = buildMonthlyEvolution([
      entry({ type: "receita", amount: 1000, date: "2026-06-10" }),
      entry({ type: "despesa", amount: 400, date: "2026-06-11" }),
      entry({ type: "receita", amount: 2000, date: "2026-07-01" }),
    ]);

    expect(points).toEqual([
      { mes: "2026-06", receita: 1000, despesa: 400, resultado: 600, margem: 60, hasData: true },
      { mes: "2026-07", receita: 2000, despesa: 0, resultado: 2000, margem: 100, hasData: true },
    ]);
  });

  it("preenche serie mensal com meses sem dados e insights gerenciais", () => {
    const entries = [
      entry({ type: "receita", amount: 1000, date: "2026-06-10", categoryName: "Servicos" }),
      entry({ type: "despesa", amount: 1200, date: "2026-06-11", categoryName: "Colaborador" }),
    ];
    const dre = buildDre(entries);
    const composition = buildExpenseComposition(dre.rows);
    const points = buildMonthlyEvolutionSeries(entries, 6, "2026-07");
    const insights = buildDreInsights(dre, composition);

    expect(points).toHaveLength(6);
    expect(points.at(-2)).toMatchObject({ mes: "2026-06", hasData: true });
    expect(points[0]).toMatchObject({ hasData: false });
    expect(insights.some((insight) => insight.id === "resultado-negativo")).toBe(true);
    expect(formatOptionalPercent(null)).toBe("-");
  });
});
