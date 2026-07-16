import { describe, expect, it } from "vitest";
import { calculateFinancialSummary, filterFinancialEntries, roundCurrency, sumAmounts } from "@/domain/financeiro/calculations";

describe("financial calculations", () => {
  it("adds string amounts numerically instead of concatenating", () => {
    expect(sumAmounts([{ amount: "1000" }, { amount: "660" }])).toBe(1660);
  });

  it("calculates receitas, despesas and saldo", () => {
    expect(
      calculateFinancialSummary([
        { type: "receita", amount: 1000 },
        { type: "receita", amount: 2000 },
        { type: "receita", amount: 3000 },
        { type: "despesa", amount: 500 },
        { type: "despesa", amount: 250 },
      ]),
    ).toEqual({ receitas: 6000, despesas: 750, saldo: 5250, total: 5 });
  });

  it("calculates summary for an explicit status", () => {
    expect(
      calculateFinancialSummary(
        [
          { type: "receita", amount: 1000, status: "confirmed" },
          { type: "despesa", amount: 250, status: "pending" },
          { type: "despesa", amount: 50, status: "confirmed" },
        ],
        { status: "pending" },
      ),
    ).toEqual({ receitas: 0, despesas: 250, saldo: -250, total: 1 });
  });

  it("handles null, undefined, zero and negative values without NaN", () => {
    expect(
      calculateFinancialSummary([
        { type: "receita", amount: null },
        { type: "receita", amount: undefined },
        { type: "receita", amount: 0 },
        { type: "despesa", amount: -10 },
      ]),
    ).toEqual({ receitas: 0, despesas: -10, saldo: 10, total: 4 });
  });

  it("returns zeros for empty lists", () => {
    expect(calculateFinancialSummary([])).toEqual({ receitas: 0, despesas: 0, saldo: 0, total: 0 });
  });

  it("keeps currency precision for decimal sums", () => {
    expect(sumAmounts([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
    expect(roundCurrency(10.005)).toBe(10.01);
  });

  it("handles large volumes of records", () => {
    const entries = Array.from({ length: 10_000 }, (_, index) => ({
      type: index % 2 === 0 ? "receita" : "despesa",
      amount: "1.25",
    }));

    expect(calculateFinancialSummary(entries)).toEqual({
      receitas: 6250,
      despesas: 6250,
      saldo: 0,
      total: 10_000,
    });
  });

  it("filters entries by type, status, category, cost center, search and date range", () => {
    const entries = [
      {
        type: "receita",
        amount: 1000,
        status: "confirmed",
        categoryId: "cat-a",
        categoryName: "Serviços",
        costCenterId: "cc-a",
        description: "Instalação",
        date: "2026-06-10",
      },
      {
        type: "despesa",
        amount: 250,
        status: "pending",
        categoryId: "cat-b",
        categoryName: "Materiais",
        costCenterId: "cc-b",
        description: "Compra de tubos",
        date: "2026-07-01",
      },
    ];

    expect(
      filterFinancialEntries(entries, {
        type: "receita",
        status: "confirmed",
        categoryId: "cat-a",
        costCenterId: "cc-a",
        search: "instala",
        dateFrom: new Date("2026-06-01"),
        dateTo: new Date("2026-06-30"),
      }),
    ).toHaveLength(1);

    expect(filterFinancialEntries(entries, { search: "inexistente" })).toHaveLength(0);
  });

  it("filters out mismatched status, category, cost center and dates", () => {
    const entries = [
      {
        type: "receita",
        amount: 100,
        status: "pending",
        categoryId: "cat-a",
        costCenterId: "cc-a",
        description: "Receita fora do filtro",
        date: "2026-06-10",
      },
      {
        type: "receita",
        amount: 200,
        status: "confirmed",
        categoryId: "cat-b",
        costCenterId: "cc-b",
        description: "Receita sem data",
        date: null,
      },
      {
        type: "receita",
        amount: 300,
        status: "confirmed",
        categoryId: "cat-a",
        costCenterId: "cc-a",
        description: "Receita com data inválida",
        date: "data-invalida",
      },
    ];

    expect(filterFinancialEntries(entries, { status: "confirmed" })).toHaveLength(2);
    expect(filterFinancialEntries(entries, { categoryId: "cat-a" })).toHaveLength(2);
    expect(filterFinancialEntries(entries, { costCenterId: "cc-a" })).toHaveLength(2);
    expect(filterFinancialEntries(entries, { dateFrom: new Date(2026, 5, 11) })).toHaveLength(0);
    expect(filterFinancialEntries(entries, { dateTo: new Date(2026, 5, 9) })).toHaveLength(0);
  });

  it("accepts Date objects and returns all matches when search is empty", () => {
    const entries = [
      {
        type: "receita",
        amount: 100,
        status: "confirmed",
        description: "Receita com Date",
        date: new Date(2026, 5, 10, 12),
      },
    ];

    expect(filterFinancialEntries(entries, { search: "   " })).toHaveLength(1);
    expect(
      filterFinancialEntries(entries, {
        dateFrom: new Date(2026, 5, 10),
        dateTo: new Date(2026, 5, 10),
      }),
    ).toHaveLength(1);
  });
});
