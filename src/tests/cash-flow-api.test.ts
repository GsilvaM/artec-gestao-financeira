import { beforeEach, describe, expect, it, vi } from "vitest";
import * as cashFlow from "@/routes/api/financeiro/cash-flow";
import {
  getCashFlow,
  getProjectedCashFlow,
} from "@/server/financeiro/queries.js";

vi.mock("@/server/financeiro/queries.js", () => ({
  getCashFlow: vi.fn(),
  getProjectedCashFlow: vi.fn(),
}));

vi.mock("@/server/financeiro/cash-flow-export.js", () => ({
  parseCashFlowExportQuery: vi.fn(),
  getCashFlowExportFilename: vi.fn(),
  getCashFlowExportPayload: vi.fn(),
}));

vi.mock("@/server/financeiro/cash-flow-pdf.js", () => ({
  renderCashFlowPdf: vi.fn(),
}));

describe("cash-flow API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid granularity before calling query functions", async () => {
    const request = new Request(
      "http://localhost/api/financeiro/cash-flow?dateFrom=2026-07-16&dateTo=2026-07-30&granularity=quarter"
    );

    const response = await cashFlow.loader({ request, params: {} });

    expect(response.status).toBe(400);
    expect(getCashFlow).not.toHaveBeenCalled();
    expect(getProjectedCashFlow).not.toHaveBeenCalled();
  });

  it("parses projected cash-flow query with schema defaults", async () => {
    vi.mocked(getProjectedCashFlow).mockResolvedValue({
      filters: {
        dateFrom: "2026-07-16",
        dateTo: "2026-07-30",
        granularity: "day",
        view: "both",
        categoryId: null,
        bank: "all",
      },
      summary: {
        currentBalance: 0,
        predictedInflows: 0,
        predictedOutflows: 0,
        finalProjectedBalance: 0,
        lowestProjectedBalance: 0,
        lowestProjectedBalanceDate: "2026-07-16",
        inflowCount: 0,
        outflowCount: 0,
      },
      periods: [],
    });
    const request = new Request(
      "http://localhost/api/financeiro/cash-flow?mode=projected&dateFrom=2026-07-16&dateTo=2026-07-30"
    );

    const response = await cashFlow.loader({ request, params: {} });

    expect(response.status).toBe(200);
    expect(getProjectedCashFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        granularity: "day",
        view: "both",
        bank: "all",
      })
    );
  });
});
