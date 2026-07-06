import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  parseDate,
  requireId,
  handleRepoError,
} from "@/routes/api/financeiro/_utils";
import handler from "@/routes/api/financeiro/handler";
import * as entries from "@/routes/api/financeiro/entries";
import * as accountsPayable from "@/routes/api/financeiro/accounts-payable";
import * as accountsReceivable from "@/routes/api/financeiro/accounts-receivable";
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
  collaboratorRepo: {
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
  getDashboardKpis: vi.fn(),
}));

vi.mock("@/server/financeiro/accounts-payable-service.js", () => ({
  payAccountPayable: vi.fn(),
}));

vi.mock("@/server/financeiro/accounts-receivable-service.js", () => ({
  receiveAccountReceivable: vi.fn(),
}));

import {
  financialEntryRepo,
  categoryRepo,
  accountPayableRepo,
  accountReceivableRepo,
} from "@/server/financeiro/repositories.js";
import { payAccountPayable } from "@/server/financeiro/accounts-payable-service.js";
import { receiveAccountReceivable } from "@/server/financeiro/accounts-receivable-service.js";

const MOCK_ENTRY = {
  id: "11111111-1111-1111-1111-111111111111",
  description: "Receita teste",
  amount: 1000,
  type: "receita",
  date: new Date("2026-06-10"),
  status: "confirmed",
  categoryId: "00000000-0000-0000-0000-000000000001",
  costCenterId: null,
  collaboratorId: null,
  clientName: null,
  userId: "00000000-0000-0000-0000-000000000002",
  notes: null,
  createdAt: new Date("2026-06-10"),
  updatedAt: new Date("2026-06-10"),
  deletedAt: null,
  category: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Serviços",
    type: "receita",
    color: "#10B981",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-06-10"),
    deletedAt: null,
  },
  costCenter: null,
  collaborator: null,
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

const MOCK_PAYABLE = {
  id: "22222222-2222-2222-2222-222222222222",
  description: "Fornecedor teste",
  amount: 300,
  dueDate: new Date("2026-07-05"),
  paidDate: new Date("2026-07-06"),
  status: "paid",
  categoryId: "00000000-0000-0000-0000-000000000001",
  costCenterId: null,
  supplier: "Fornecedor",
  userId: "00000000-0000-0000-0000-000000000002",
  notes: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-06"),
  deletedAt: null,
  category: MOCK_CATEGORY,
  costCenter: null,
};

const MOCK_RECEIVABLE = {
  id: "33333333-3333-3333-3333-333333333333",
  description: "Cliente teste",
  amount: 450,
  dueDate: new Date("2026-07-05"),
  receivedDate: new Date("2026-07-06"),
  status: "received",
  categoryId: "00000000-0000-0000-0000-000000000001",
  costCenterId: null,
  client: "Cliente",
  userId: "00000000-0000-0000-0000-000000000002",
  notes: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-06"),
  deletedAt: null,
  category: MOCK_CATEGORY,
  costCenter: null,
};

const MOCK_ORIGINATED_ENTRY = {
  ...MOCK_ENTRY,
  id: "44444444-4444-4444-4444-444444444444",
  notes:
    "[originType=accounts_receivable;originId=33333333-3333-3333-3333-333333333333]",
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
    vi.mocked(financialEntryRepo.findAll).mockResolvedValue([
      MOCK_ENTRY,
    ] as never);
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
    vi.mocked(financialEntryRepo.findAll).mockResolvedValue([
      MOCK_ENTRY,
    ] as never);
    const request = new Request("http://localhost/api/financeiro/entries");
    const response = await entries.loader({ request, params: {} });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(1);
    expect(body[0].description).toBe("Receita teste");
  });

  it("retorna 404 para id inexistente via loader", async () => {
    vi.mocked(financialEntryRepo.findById).mockRejectedValue(
      Object.assign(new Error("FinancialEntry with id x not found"), {
        name: "NotFoundError",
      })
    );
    const request = new Request(
      "http://localhost/api/financeiro/entries?id=uuid-inexistente"
    );
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

  it("blocks manual creation of originated financial entry", async () => {
    const request = new Request("http://localhost/api/financeiro/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Entrada automatica falsa",
        amount: 500,
        type: "receita",
        date: "2026-07-01",
        categoryId: "00000000-0000-0000-0000-000000000001",
        userId: "00000000-0000-0000-0000-000000000002",
        notes:
          "[originType=accounts_receivable;originId=33333333-3333-3333-3333-333333333333]",
      }),
    });

    const response = await entries.action({ request, params: {} });

    expect(response.status).toBe(409);
    expect(financialEntryRepo.create).not.toHaveBeenCalled();
  });

  it("retorna 405 para método não suportado", async () => {
    const request = new Request("http://localhost/api/financeiro/entries", {
      method: "PATCH",
    });
    const response = await entries.action({ request, params: {} });
    expect(response.status).toBe(405);
  });

  it("blocks direct update of originated financial entry", async () => {
    vi.mocked(financialEntryRepo.findById).mockResolvedValue(
      MOCK_ORIGINATED_ENTRY as never
    );
    const request = new Request(
      "http://localhost/api/financeiro/entries/44444444-4444-4444-4444-444444444444",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Alteracao direta",
        }),
      }
    );

    const response = await entries.action({
      request,
      params: { id: "44444444-4444-4444-4444-444444444444" },
    });

    expect(response.status).toBe(409);
    expect(financialEntryRepo.update).not.toHaveBeenCalled();
  });

  it("blocks direct delete of originated financial entry", async () => {
    vi.mocked(financialEntryRepo.findById).mockResolvedValue(
      MOCK_ORIGINATED_ENTRY as never
    );
    const request = new Request(
      "http://localhost/api/financeiro/entries/44444444-4444-4444-4444-444444444444",
      {
        method: "DELETE",
      }
    );

    const response = await entries.action({
      request,
      params: { id: "44444444-4444-4444-4444-444444444444" },
    });

    expect(response.status).toBe(409);
    expect(financialEntryRepo.softDelete).not.toHaveBeenCalled();
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

describe("accounts payable route module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registra pagamento via serviço transacional", async () => {
    vi.mocked(payAccountPayable).mockResolvedValue({
      account: MOCK_PAYABLE,
      financialEntry: MOCK_ENTRY,
      message: "Pagamento registrado com sucesso.",
    } as never);
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable/22222222-2222-2222-2222-222222222222",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paymentDate: "2026-07-06",
          paidAmount: 300,
          paymentMethod: "pix",
          bankAccount: "Banco teste",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );
    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
    });

    expect(response.status).toBe(200);
    expect(payAccountPayable).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      expect.objectContaining({
        paidAmount: 300,
        paymentMethod: "pix",
        bankAccount: "Banco teste",
      })
    );
  });

  it("retorna 409 quando pagamento duplicado é rejeitado", async () => {
    vi.mocked(payAccountPayable).mockRejectedValue(
      Object.assign(
        new Error(
          "Esta conta já está paga e o lançamento financeiro já existe."
        ),
        {
          name: "ValidationError",
          status: 409,
        }
      )
    );
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable/22222222-2222-2222-2222-222222222222",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paymentDate: "2026-07-06",
          paidAmount: 300,
          paymentMethod: "pix",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );
    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "Esta conta já está paga e o lançamento financeiro já existe.",
    });
  });

  it("bloqueia edicao direta de conta ja paga", async () => {
    vi.mocked(accountPayableRepo.findById).mockResolvedValue(
      MOCK_PAYABLE as never
    );
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable/22222222-2222-2222-2222-222222222222",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Fornecedor alterado",
        }),
      }
    );

    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
    });

    expect(response.status).toBe(409);
    expect(accountPayableRepo.update).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error:
        "Conta paga nao pode ser editada diretamente. Defina uma rotina de estorno antes de alterar.",
    });
  });

  it("bloqueia exclusao de conta ja paga", async () => {
    vi.mocked(accountPayableRepo.findById).mockResolvedValue(
      MOCK_PAYABLE as never
    );
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable/22222222-2222-2222-2222-222222222222",
      {
        method: "DELETE",
      }
    );

    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
    });

    expect(response.status).toBe(409);
    expect(accountPayableRepo.softDelete).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error:
        "Conta paga nao pode ser excluida. Defina uma rotina de estorno antes de remover.",
    });
  });
});

describe("accounts receivable route module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("receives account via transactional service", async () => {
    vi.mocked(receiveAccountReceivable).mockResolvedValue({
      account: MOCK_RECEIVABLE,
      financialEntry: MOCK_ENTRY,
      message: "Recebimento registrado com sucesso.",
    } as never);
    const request = new Request(
      "http://localhost/api/financeiro/accounts-receivable/33333333-3333-3333-3333-333333333333",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "received",
          receivedDate: "2026-07-06",
          receivedAmount: 450,
          paymentMethod: "pix",
          bankAccount: "Banco teste",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );
    const response = await accountsReceivable.action({
      request,
      params: { id: "33333333-3333-3333-3333-333333333333" },
    });

    expect(response.status).toBe(200);
    expect(receiveAccountReceivable).toHaveBeenCalledWith(
      "33333333-3333-3333-3333-333333333333",
      expect.objectContaining({
        receivedAmount: 450,
        paymentMethod: "pix",
        bankAccount: "Banco teste",
      })
    );
  });

  it("returns 409 when duplicated receipt is rejected", async () => {
    vi.mocked(receiveAccountReceivable).mockRejectedValue(
      Object.assign(
        new Error(
          "Esta conta ja foi recebida e o lancamento financeiro ja existe."
        ),
        {
          name: "ValidationError",
          status: 409,
        }
      )
    );
    const request = new Request(
      "http://localhost/api/financeiro/accounts-receivable/33333333-3333-3333-3333-333333333333",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "received",
          receivedDate: "2026-07-06",
          receivedAmount: 450,
          paymentMethod: "pix",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );
    const response = await accountsReceivable.action({
      request,
      params: { id: "33333333-3333-3333-3333-333333333333" },
    });

    expect(response.status).toBe(409);
  });

  it("blocks direct update of received account", async () => {
    vi.mocked(accountReceivableRepo.findById).mockResolvedValue(
      MOCK_RECEIVABLE as never
    );
    const request = new Request(
      "http://localhost/api/financeiro/accounts-receivable/33333333-3333-3333-3333-333333333333",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Cliente alterado",
        }),
      }
    );

    const response = await accountsReceivable.action({
      request,
      params: { id: "33333333-3333-3333-3333-333333333333" },
    });

    expect(response.status).toBe(409);
    expect(accountReceivableRepo.update).not.toHaveBeenCalled();
  });

  it("blocks delete of received account", async () => {
    vi.mocked(accountReceivableRepo.findById).mockResolvedValue(
      MOCK_RECEIVABLE as never
    );
    const request = new Request(
      "http://localhost/api/financeiro/accounts-receivable/33333333-3333-3333-3333-333333333333",
      {
        method: "DELETE",
      }
    );

    const response = await accountsReceivable.action({
      request,
      params: { id: "33333333-3333-3333-3333-333333333333" },
    });

    expect(response.status).toBe(409);
    expect(accountReceivableRepo.softDelete).not.toHaveBeenCalled();
  });
});
