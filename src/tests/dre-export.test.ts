// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildDreExportPayload,
  parseDreExportQuery,
  resolveDreExportPeriod,
} from "@/server/financeiro/dre-export";
import { renderDrePdf } from "@/server/financeiro/dre-pdf";
import type { FinancialEntryRow } from "@/domain/financeiro/types";

function entry(partial: Partial<FinancialEntryRow>): FinancialEntryRow {
  return {
    id: partial.id ?? "entry",
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

describe("dre export", () => {
  it("resolve periodos mensal, trimestre, anual e customizado", () => {
    expect(resolveDreExportPeriod({ periodo: "mensal", mes: "2026-07" }).filenameToken).toBe("2026-07");
    expect(resolveDreExportPeriod({ periodo: "trimestre", trimestre: 2, ano: 2026 }).filenameToken).toBe("2026-T2");
    expect(resolveDreExportPeriod({ periodo: "anual", ano: 2026 }).filenameToken).toBe("2026");
    expect(resolveDreExportPeriod({ periodo: "customizado", inicio: "2026-04-01", fim: "2026-06-30" }).filenameToken).toBe("2026-04-01_2026-06-30");
  });

  it("rejeita parametros invalidos antes de gerar PDF", () => {
    expect(() => parseDreExportQuery(new URLSearchParams("periodo=trimestre&ano=2026"))).toThrow();
    expect(() => resolveDreExportPeriod({ periodo: "customizado", inicio: "2026-06-30", fim: "2026-04-01" })).toThrow("Data final");
  });

  it("mantem resumo batendo com a soma das categorias do exemplo real", () => {
    const payload = buildDreExportPayload(
      [
        entry({ id: "r", type: "receita", amount: 20769, categoryName: "Servicos" }),
        entry({ id: "d1", type: "despesa", amount: 22456.28, categoryName: "Colaborador" }),
        entry({ id: "d2", type: "despesa", amount: 4957.88, categoryName: "Ticket aliment." }),
        entry({ id: "d3", type: "despesa", amount: 874.92, categoryName: "EPIs" }),
        entry({ id: "d4", type: "despesa", amount: 583.28, categoryName: "Gestor" }),
        entry({ id: "d5", type: "despesa", amount: 291.64, categoryName: "Outros" }),
      ],
      [],
      resolveDreExportPeriod({ periodo: "mensal", mes: "2026-07" }),
    );

    expect(payload.summary.receitas).toBe(20769);
    expect(payload.summary.despesas).toBe(29164);
    expect(payload.summary.resultado).toBe(-8395);
    expect(payload.summary.margemLiquida).toBeLessThan(0);
    expect(payload.expenseComposition.length).toBeGreaterThan(0);
    expect(payload.insights.some((insight) => insight.id === "resultado-negativo")).toBe(true);
    expect(payload.breakEven.tone).toBe("negative");
  });

  it("inclui comparativo mensal para periodos com mais de um mes", () => {
    const payload = buildDreExportPayload(
      [
        entry({ type: "receita", amount: 1000, date: "2026-04-10" }),
        entry({ type: "despesa", amount: 400, date: "2026-06-10" }),
      ],
      [],
      resolveDreExportPeriod({ periodo: "trimestre", trimestre: 2, ano: 2026 }),
    );

    expect(payload.monthlyComparison.map((point) => point.mes)).toEqual(["2026-04", "2026-05", "2026-06"]);
    expect(payload.monthlyComparison[1]).toMatchObject({ hasData: false, margem: null });
  });

  it("gera PDF valido mesmo sem movimentacao", async () => {
    const payload = buildDreExportPayload(
      [],
      [],
      resolveDreExportPeriod({ periodo: "mensal", mes: "2026-07" }),
      new Date("2026-07-03T12:00:00.000Z"),
    );

    const pdf = await renderDrePdf(payload);

    expect(pdf.byteLength).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
