import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  parseDate,
  requireId,
  handleRepoError,
} from "@/routes/api/financeiro/_utils";
import handler from "@/routes/api/financeiro/handler";
import * as entries from "@/routes/api/financeiro/entries";
import * as categories from "@/routes/api/financeiro/categories";

vi.mock("@/server/financeiro/repositories.js", () => ({
  financialEntryRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  accountPayableRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  accountReceivableRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  categoryRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  costCenterRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock("@/server/financeiro/queries.js", () => ({
  getDre: vi.fn(),
  getCashFlow: vi.fn(),
}));

import { financialEntryRepo, categoryRepo } from "@/server/financeiro/repositories.js";

const MOCK_ENTRY = {
  id: "11111111-1111-1111-1111-111111111111",
  description: "Receita teste",
  amount: 1000,
  type: "receita",
  date: new Date("2026-06-10"),
  status: "confirmed",
  categoryId: "00000000-0000-0000-0000-000000000001",
  costCenterId: null,
  userId: "00000000-0000-0000-0000-000000000002",
  notes: null,
  createdAt: new Date("2026-06-10"),
  updatedAt: new Date("2026-06-10"),
  deletedAt: null,
  category: { id: "00000000-0000-0000-0000-000000000001", name: "Serviços", type: "receita", color: "#10B981", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-06-10"), deletedAt: null },
  costCenter: null,
};

const MOCK_CATEGORY = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Serviços",
  type: "receita",
  color: "#10B981",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-06-10"),
  deletedAt: null,
};

describe("_utils", () => {
  describe("parseDate", () => {
    it("returns undefined for null", () => {
      expect(parseDate(null)).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(parseDate("")).toBeUndefined();
    });

    it("returns Date for valid date string", () => {
      const result = parseDate("2026-06-23");
      expect(result).toBeInstanceOf(Date);
    });

    it("returns undefined for invalid date string", () => {
      expect(parseDate("not-a-date")).toBeUndefined();
    });
  });

  describe("requireId", () => {
    it("throws ValidationError for undefined", () => {
      expect(() => requireId(undefined)).toThrow("ID é obrigatório");
    });

    it("throws ValidationError for empty string", () => {
      expect(() => requireId("")).toThrow("ID é obrigatório");
    });

    it("does not throw for valid string", () => {
      expect(() => requireId("valid-id")).not.toThrow();
    });
  });

  describe("handleRepoError", () => {
    it("returns 404 for NotFoundError", async () => {
      const err = new Error("Entry not found");
      err.name = "NotFoundError";
      const response = handleRepoError(err);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("Entry not found");
    });

    it("returns 400 for ZodError", async () => {
      const err = new Error("Validation failed");
      err.name = "ZodError";
      const response = handleRepoError(err);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Validation failed");
    });

    it("returns 400 for ValidationError", async () => {
      const err = new Error("ID é obrigatório");
      err.name = "ValidationError";
      const response = handleRepoError(err);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("ID é obrigatório");
    });

    it("returns 500 for unknown errors", async () => {
      const response = handleRepoError(new Error("Unexpected"));
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Unexpected");
    });
  });
});

describe("handler dispatcher", () => {
  it("returns 404 for unknown resource", async () => {
    const request = new Request("http://localhost/api/financeiro/unknown");
    const response = await handler(request);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("unknown");
  });

  it("routes entries GET to entries loader", async () => {
    vi.mocked(financialEntryRepo.findAll).mockResolvedValue([MOCK_ENTRY] as never);
    const request = new Request("http://localhost/api/financeiro/entries");
    const response = await handler(request);
    expect(response.status).toBe(200);
  });
});

describe("entries route module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna lista de lançamentos via loader", async () => {
    vi.mocked(financialEntryRepo.findAll).mockResolvedValue([MOCK_ENTRY] as never);
    const request = new Request("http://localhost/api/financeiro/entries");
    const response = await entries.loader({ request, params: {} });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].description).toBe("Receita teste");
  });

  it("retorna 404 para id inexistente via loader", async () => {
    vi.mocked(financialEntryRepo.findById).mockRejectedValue(
      Object.assign(new Error("FinancialEntry with id x not found"), { name: "NotFoundError" }),
    );
    const request = new Request("http://localhost/api/financeiro/entries?id=uuid-inexistente");
    const response = await entries.loader({ request, params: {} });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("not found");
  });

  it("retorna 201 para POST via action", async () => {
    vi.mocked(financialEntryRepo.create).mockResolvedValue(MOCK_ENTRY as never);
    const payload = {
      description: "Nova entrada",
      amount: 500,
      type: "receita",
      date: "2026-07-01",
      categoryId: "00000000-0000-0000-0000-000000000001",
      userId: "00000000-0000-0000-0000-000000000002",
    };
    const request = new Request("http://localhost/api/financeiro/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = await entries.action({ request, params: {} });
    expect(response.status).toBe(201);
  });

  it("retorna 405 para método não suportado", async () => {
    const request = new Request("http://localhost/api/financeiro/entries", { method: "PATCH" });
    const response = await entries.action({ request, params: {} });
    expect(response.status).toBe(405);
  });
});

describe("categories route module", () => {
  it("retorna lista de categorias via loader", async () => {
    vi.mocked(categoryRepo.findAll).mockResolvedValue([MOCK_CATEGORY]);
    const request = new Request("http://localhost/api/financeiro/categories");
    const response = await categories.loader({ request, params: {} });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Serviços");
  });
});
