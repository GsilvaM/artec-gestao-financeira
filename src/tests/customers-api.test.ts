import { beforeEach, describe, expect, it, vi } from "vitest";
import * as customersRoute from "@/routes/api/financeiro/customers";
import { customerRepo } from "@/server/financeiro/repositories.js";

vi.mock("@/server/financeiro/repositories.js", () => ({
  customerRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

const AUTHENTICATED_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("customers API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists customers with search filters", async () => {
    vi.mocked(customerRepo.findAll).mockResolvedValueOnce([
      {
        id: "customer-1",
        name: "Luiz Fernando Landeiro",
        document: "07578481762",
        email: "cliente@example.com",
        phone: "(27) 99293-8298",
        address: "Rua Chapot Presvot, 51",
        notes: null,
        active: true,
        userId: AUTHENTICATED_USER_ID,
        createdAt: new Date("2026-07-17T00:00:00Z"),
        updatedAt: new Date("2026-07-17T00:00:00Z"),
        deletedAt: null,
      },
    ]);

    const response = await customersRoute.loader({
      request: new Request("http://localhost/api/financeiro/customers?search=Luiz"),
      params: {},
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });
    const body = await response.json();

    expect(customerRepo.findAll).toHaveBeenCalledWith({
      includeInactive: false,
      search: "Luiz",
      document: undefined,
      email: undefined,
    });
    expect(body[0]).toMatchObject({ name: "Luiz Fernando Landeiro", document: "07578481762" });
  });

  it("creates a customer with the authenticated user id", async () => {
    vi.mocked(customerRepo.create).mockResolvedValueOnce({
      id: "customer-1",
      name: "Luiz Fernando Landeiro",
      document: "07578481762",
      email: null,
      phone: "(27) 99293-8298",
      address: "Rua Chapot Presvot, 51",
      notes: "Cliente criado a partir da importacao de fatura do Auvo.",
      active: true,
      userId: AUTHENTICATED_USER_ID,
      createdAt: new Date("2026-07-17T00:00:00Z"),
      updatedAt: new Date("2026-07-17T00:00:00Z"),
      deletedAt: null,
    });

    const response = await customersRoute.action({
      request: new Request("http://localhost/api/financeiro/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Luiz Fernando Landeiro",
          document: "075.784.817-62",
          phone: "(27) 99293-8298",
          address: "Rua Chapot Presvot, 51",
        }),
      }),
      params: {},
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(201);
    expect(customerRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: "Luiz Fernando Landeiro",
      document: "075.784.817-62",
      userId: AUTHENTICATED_USER_ID,
    }));
  });
});
