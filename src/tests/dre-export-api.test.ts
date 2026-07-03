import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/server/financeiro/dre-export.js", async () => {
  const actual = await vi.importActual<typeof import("@/server/financeiro/dre-export")>("@/server/financeiro/dre-export");
  return {
    ...actual,
    getDreExportPayload: vi.fn(),
    getDreExportFilename: vi.fn(() => "DRE_ArtecGestao_2026-07.pdf"),
  };
});

vi.mock("@/server/financeiro/dre-pdf.js", () => ({
  renderDrePdf: vi.fn(async () => Buffer.from("%PDF-1.7\nmock")),
}));

import * as dre from "@/routes/api/financeiro/dre";
import { getDreExportPayload } from "@/server/financeiro/dre-export.js";

describe("dre export api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna PDF com headers de download", async () => {
    vi.mocked(getDreExportPayload).mockResolvedValue({} as never);

    const response = await dre.loader({
      request: new Request("http://localhost/api/financeiro/dre/export/pdf?periodo=mensal&mes=2026-07"),
      params: { id: "export" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("DRE_ArtecGestao_2026-07.pdf");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toContain("%PDF");
  });

  it("retorna 400 para parametros invalidos", async () => {
    const response = await dre.loader({
      request: new Request("http://localhost/api/financeiro/dre/export/pdf?periodo=trimestre&ano=2026"),
      params: { id: "export" },
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
