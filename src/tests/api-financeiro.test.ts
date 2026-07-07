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
import * as beneficiaries from "@/routes/api/financeiro/beneficiaries";

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
  reverseAccountPayablePayment: vi.fn(),
}));

vi.mock("@/server/financeiro/accounts-receivable-service.js", () => ({
  receiveAccountReceivable: vi.fn(),
  reverseAccountReceivableReceipt: vi.fn(),
}));

vi.mock("@/server/financeiro/beneficiaries-service.js", () => ({
  searchBeneficiaries: vi.fn(),
}));

import {
  financialEntryRepo,
  categoryRepo,
  accountPayableRepo,
  accountReceivableRepo,
} from "@/server/financeiro/repositories.js";
import { payAccountPayable } from "@/server/financeiro/accounts-payable-service.js";
import {
  receiveAccountReceivable,
  reverseAccountReceivableReceipt,
} from "@/server/financeiro/accounts-receivable-service.js";
import { reverseAccountPayablePayment } from "@/server/financeiro/accounts-payable-service.js";
import { searchBeneficiaries } from "@/server/financeiro/beneficiaries-service.js";

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

const AUTHENTICATED_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const IMPERSONATED_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

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

describe("beneficiaries route module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna busca paginada de favorecidos", async () => {
    vi.mocked(searchBeneficiaries).mockResolvedValue({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000003",
          name: "Maria Teste",
          type: "collaborator",
        },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const request = new Request(
      "http://localhost/api/financeiro/beneficiaries?type=collaborator&q=maria&page=1&pageSize=20"
    );
    const response = await beneficiaries.loader({ request, params: {} });

    expect(response.status).toBe(200);
    expect(searchBeneficiaries).toHaveBeenCalledWith({
      type: "collaborator",
      q: "maria",
      page: 1,
      pageSize: 20,
    });
    await expect(response.json()).resolves.toMatchObject({
      items: [{ name: "Maria Teste", type: "collaborator" }],
      pagination: { total: 1 },
    });
  });
});

describe("accounts payable route module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa usuario autenticado na auditoria de criacao mesmo quando payload tenta outro userId", async () => {
    vi.mocked(accountPayableRepo.create).mockResolvedValue({
      ...MOCK_PAYABLE,
      status: "pending",
      paidDate: null,
    } as never);
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Conta fornecedor",
          amount: 300,
          dueDate: "2026-07-06",
          categoryId: "00000000-0000-0000-0000-000000000001",
          beneficiaryType: "supplier",
          supplier: "Fornecedor teste",
          userId: IMPERSONATED_USER_ID,
        }),
      }
    );

    const response = await accountsPayable.action({
      request,
      params: {},
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(201);
    expect(accountPayableRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: AUTHENTICATED_USER_ID })
    );
    expect(accountPayableRepo.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: IMPERSONATED_USER_ID })
    );
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(payAccountPayable).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      expect.objectContaining({
        paidAmount: 300,
        paymentMethod: "pix",
        bankAccount: "Banco teste",
        userId: AUTHENTICATED_USER_ID,
      })
    );
  });

  it("usa usuario autenticado na auditoria mesmo quando payload tenta outro userId", async () => {
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
          userId: IMPERSONATED_USER_ID,
        }),
      }
    );

    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(payAccountPayable).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      expect.objectContaining({
        userId: AUTHENTICATED_USER_ID,
      })
    );
    expect(payAccountPayable).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        userId: IMPERSONATED_USER_ID,
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountPayableRepo.update).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error:
        "Conta paga ou estornada nao pode ser editada diretamente.",
    });
  });

  it("bloqueia edicao direta de conta ja estornada", async () => {
    vi.mocked(accountPayableRepo.findById).mockResolvedValue(
      { ...MOCK_PAYABLE, status: "reversed" } as never
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountPayableRepo.update).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error:
        "Conta paga ou estornada nao pode ser editada diretamente.",
    });
  });

  it("retorna 422 quando colaborador favorecido nao existe", async () => {
    vi.mocked(accountPayableRepo.create).mockRejectedValue(
      Object.assign(
        new Error("Selecione um colaborador ativo para a conta a pagar."),
        {
          name: "ValidationError",
          status: 422,
        }
      )
    );
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Conta colaborador inexistente",
          amount: 300,
          dueDate: "2026-07-06",
          categoryId: "00000000-0000-0000-0000-000000000001",
          beneficiaryType: "collaborator",
          beneficiaryId: "00000000-0000-0000-0000-000000000999",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );

    const response = await accountsPayable.action({
      request,
      params: {},
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(422);
    expect(accountPayableRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: AUTHENTICATED_USER_ID })
    );
    await expect(response.json()).resolves.toMatchObject({
      error: "Selecione um colaborador ativo para a conta a pagar.",
    });
  });

  it("usa usuario autenticado na auditoria de update e troca de favorecido", async () => {
    vi.mocked(accountPayableRepo.findById).mockResolvedValue(
      { ...MOCK_PAYABLE, status: "pending", paidDate: null } as never
    );
    vi.mocked(accountPayableRepo.update).mockResolvedValue({
      ...MOCK_PAYABLE,
      status: "pending",
      paidDate: null,
      beneficiaryType: "collaborator",
      beneficiaryId: "00000000-0000-0000-0000-000000000003",
      beneficiaryName: "Maria Teste",
      supplier: null,
    } as never);
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable/22222222-2222-2222-2222-222222222222",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryType: "collaborator",
          beneficiaryId: "00000000-0000-0000-0000-000000000003",
          userId: IMPERSONATED_USER_ID,
        }),
      }
    );

    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(accountPayableRepo.update).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      expect.objectContaining({
        beneficiaryType: "collaborator",
        beneficiaryId: "00000000-0000-0000-0000-000000000003",
        userId: AUTHENTICATED_USER_ID,
      })
    );
    expect(accountPayableRepo.update).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ userId: IMPERSONATED_USER_ID })
    );
  });

  it("retorna 409 quando updatedAt esperado esta obsoleto", async () => {
    vi.mocked(accountPayableRepo.findById).mockResolvedValue(
      { ...MOCK_PAYABLE, status: "pending", paidDate: null } as never
    );
    vi.mocked(accountPayableRepo.update).mockRejectedValue(
      Object.assign(
        new Error(
          "Conta a pagar foi alterada por outro usuario. Recarregue os dados antes de salvar."
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
          description: "Conta concorrente",
          expectedUpdatedAt: "2026-07-05T00:00:00.000Z",
        }),
      }
    );

    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountPayableRepo.update).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      expect.objectContaining({
        expectedUpdatedAt: new Date("2026-07-05T00:00:00.000Z"),
        userId: AUTHENTICATED_USER_ID,
      })
    );
    await expect(response.json()).resolves.toMatchObject({
      error:
        "Conta a pagar foi alterada por outro usuario. Recarregue os dados antes de salvar.",
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountPayableRepo.softDelete).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: "Conta paga ou estornada nao pode ser excluida.",
    });
  });

  it("bloqueia exclusao de conta ja estornada", async () => {
    vi.mocked(accountPayableRepo.findById).mockResolvedValue(
      { ...MOCK_PAYABLE, status: "reversed" } as never
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountPayableRepo.softDelete).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: "Conta paga ou estornada nao pode ser excluida.",
    });
  });

  it("estorna pagamento via servico transacional", async () => {
    vi.mocked(reverseAccountPayablePayment).mockResolvedValue({
      account: { ...MOCK_PAYABLE, status: "reversed" },
      financialEntry: MOCK_ENTRY,
      reversalEntry: { ...MOCK_ENTRY, type: "receita" },
      message: "Pagamento estornado com sucesso.",
    } as never);
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable/22222222-2222-2222-2222-222222222222",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "reversed",
          reversalDate: "2026-07-07",
          reason: "Lancamento incorreto",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );
    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(reverseAccountPayablePayment).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      expect.objectContaining({
        reason: "Lancamento incorreto",
        userId: AUTHENTICATED_USER_ID,
      })
    );
  });

  it("usa usuario autenticado na auditoria de estorno mesmo quando payload tenta outro userId", async () => {
    vi.mocked(reverseAccountPayablePayment).mockResolvedValue({
      account: { ...MOCK_PAYABLE, status: "reversed" },
      financialEntry: MOCK_ENTRY,
      reversalEntry: { ...MOCK_ENTRY, type: "receita" },
      message: "Pagamento estornado com sucesso.",
    } as never);
    const request = new Request(
      "http://localhost/api/financeiro/accounts-payable/22222222-2222-2222-2222-222222222222",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "reversed",
          reversalDate: "2026-07-07",
          reason: "Lancamento incorreto",
          userId: IMPERSONATED_USER_ID,
        }),
      }
    );

    const response = await accountsPayable.action({
      request,
      params: { id: "22222222-2222-2222-2222-222222222222" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(reverseAccountPayablePayment).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      expect.objectContaining({ userId: AUTHENTICATED_USER_ID })
    );
    expect(reverseAccountPayablePayment).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ userId: IMPERSONATED_USER_ID })
    );
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(receiveAccountReceivable).toHaveBeenCalledWith(
      "33333333-3333-3333-3333-333333333333",
      expect.objectContaining({
        receivedAmount: 450,
        paymentMethod: "pix",
        bankAccount: "Banco teste",
        userId: AUTHENTICATED_USER_ID,
      })
    );
  });

  it("blocks creating received account outside the receipt routine", async () => {
    const request = new Request(
      "http://localhost/api/financeiro/accounts-receivable",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "Recebimento direto",
          amount: 450,
          dueDate: "2026-07-06",
          status: "received",
          receivedDate: "2026-07-06",
          categoryId: "00000000-0000-0000-0000-000000000001",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );

    const response = await accountsReceivable.action({
      request,
      params: {},
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountReceivableRepo.create).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error:
        "Conta a receber recebida ou estornada deve ser registrada por rotina transacional propria.",
    });
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountReceivableRepo.update).not.toHaveBeenCalled();
  });

  it("blocks direct update of reversed account", async () => {
    vi.mocked(accountReceivableRepo.findById).mockResolvedValue(
      { ...MOCK_RECEIVABLE, status: "reversed" } as never
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountReceivableRepo.update).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: "Conta recebida ou estornada nao pode ser editada diretamente.",
    });
  });

  it("keeps pending receivable account editable", async () => {
    vi.mocked(accountReceivableRepo.findById).mockResolvedValue(
      { ...MOCK_RECEIVABLE, status: "pending", receivedDate: null } as never
    );
    vi.mocked(accountReceivableRepo.update).mockResolvedValue({
      ...MOCK_RECEIVABLE,
      description: "Cliente alterado",
      status: "pending",
      receivedDate: null,
    } as never);
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(accountReceivableRepo.update).toHaveBeenCalledWith(
      "33333333-3333-3333-3333-333333333333",
      expect.objectContaining({ description: "Cliente alterado" })
    );
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountReceivableRepo.softDelete).not.toHaveBeenCalled();
  });

  it("blocks delete of reversed account", async () => {
    vi.mocked(accountReceivableRepo.findById).mockResolvedValue(
      { ...MOCK_RECEIVABLE, status: "reversed" } as never
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
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(409);
    expect(accountReceivableRepo.softDelete).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: "Conta recebida ou estornada nao pode ser excluida.",
    });
  });

  it("reverses receipt via transactional service", async () => {
    vi.mocked(reverseAccountReceivableReceipt).mockResolvedValue({
      account: { ...MOCK_RECEIVABLE, status: "reversed" },
      financialEntry: MOCK_ENTRY,
      reversalEntry: { ...MOCK_ENTRY, type: "despesa" },
      message: "Recebimento estornado com sucesso.",
    } as never);
    const request = new Request(
      "http://localhost/api/financeiro/accounts-receivable/33333333-3333-3333-3333-333333333333",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "reversed",
          reversalDate: "2026-07-07",
          reason: "Recebimento incorreto",
          userId: "00000000-0000-0000-0000-000000000002",
        }),
      }
    );
    const response = await accountsReceivable.action({
      request,
      params: { id: "33333333-3333-3333-3333-333333333333" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(200);
    expect(reverseAccountReceivableReceipt).toHaveBeenCalledWith(
      "33333333-3333-3333-3333-333333333333",
      expect.objectContaining({
        reason: "Recebimento incorreto",
        userId: AUTHENTICATED_USER_ID,
      })
    );
  });
});
