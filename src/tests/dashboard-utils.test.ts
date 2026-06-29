import { describe, expect, it } from "vitest";
import { calculateFinancialPercentages, formatCompactMoney, getActivityStatusMeta } from "@/routes/app/dashboard-utils";

describe("dashboard utilities", () => {
  it("formats compact BRL values for chart axes", () => {
    expect(formatCompactMoney(10000)).toMatch(/^R\$\s?10/);
  });

  it("calculates dashboard percentages with one decimal", () => {
    expect(calculateFinancialPercentages(1000, 660, 340)).toEqual({
      receitaPercent: 60.2,
      despesaPercent: 39.8,
      saldoPercent: 20.5,
    });
  });

  it("maps activity statuses to semantic badge labels", () => {
    expect(getActivityStatusMeta("pending").label).toBe("Pendente");
    expect(getActivityStatusMeta("completed").label).toBe("Concluido");
    expect(getActivityStatusMeta("overdue").label).toBe("Atrasado");
    expect(getActivityStatusMeta("cancelled").label).toBe("Cancelado");
  });
});
