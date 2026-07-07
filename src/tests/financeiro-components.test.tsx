import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Component as Dashboard } from "@/routes/app/dashboard";
import { Component as Lancamentos } from "@/routes/app/financeiro/lancamentos/page";
import { Component as ContasPagar } from "@/routes/app/financeiro/contas-pagar/page";
import { Component as ContasReceber } from "@/routes/app/financeiro/contas-receber/page";
import { useAuthStore } from "@/lib/supabase/auth-store";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const entries = [
  {
    id: "entry-1",
    description: "Receita instalacao",
    amount: "1000",
    type: "receita",
    date: "2026-06-10T00:00:00.000Z",
    status: "confirmed",
    categoryId: "cat-r",
    category: { name: "Servicos", color: "#10B981" },
    costCenterId: null,
    costCenter: null,
    collaboratorId: null,
    collaborator: null,
    clientName: null,
    userId: "user-1",
    notes: null,
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
  },
  {
    id: "entry-2",
    description: "Compra material",
    amount: "660",
    type: "despesa",
    date: "2026-06-11T00:00:00.000Z",
    status: "pending",
    categoryId: "cat-d",
    category: { name: "Materiais", color: "#EF4444" },
    costCenterId: null,
    costCenter: null,
    collaboratorId: null,
    collaborator: null,
    clientName: null,
    userId: "user-1",
    notes: null,
    createdAt: "2026-06-11T00:00:00.000Z",
    updatedAt: "2026-06-11T00:00:00.000Z",
  },
];

const categories = [
  { id: "cat-r", name: "Servicos", type: "receita", color: "#10B981", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-d", name: "Materiais", type: "despesa", color: "#EF4444", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

const payableCollaborator = {
  id: "payable-collaborator",
  description: "Repasse colaborador",
  amount: "300",
  dueDate: "2026-07-15T00:00:00.000Z",
  paidDate: null,
  status: "pending",
  categoryId: "cat-d",
  category: { name: "Materiais", color: "#EF4444" },
  costCenterId: null,
  costCenter: null,
  supplier: null,
  beneficiaryType: "collaborator",
  beneficiaryId: "col-1",
  beneficiaryName: "Maria Teste",
  userId: "user-1",
  notes: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const payablePaid = {
  ...payableCollaborator,
  id: "payable-paid",
  description: "Paga bloqueada",
  status: "paid",
  paidDate: "2026-07-16T00:00:00.000Z",
};

const payableReversed = {
  ...payableCollaborator,
  id: "payable-reversed",
  description: "Pagar estornada bloqueada",
  status: "reversed",
};

const receivablePending = {
  id: "receivable-pending",
  description: "Receber editavel",
  amount: "500",
  dueDate: "2026-07-20T00:00:00.000Z",
  receivedDate: null,
  status: "pending",
  categoryId: "cat-r",
  category: { name: "Servicos", color: "#10B981" },
  costCenterId: null,
  costCenter: null,
  client: "Cliente aberto",
  userId: "user-1",
  notes: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const receivableReceived = {
  ...receivablePending,
  id: "receivable-received",
  description: "Recebida bloqueada",
  client: "Cliente recebido",
  status: "received",
  receivedDate: "2026-07-21T00:00:00.000Z",
};

const receivableReversed = {
  ...receivablePending,
  id: "receivable-reversed",
  description: "Estornada bloqueada",
  client: "Cliente estornado",
  status: "reversed",
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const moneyText = (value: string) => new RegExp(`R\\$\\s*${value.replace(".", "\\.")}`);

function mockAccountsPayableFetch(options: {
  beneficiaries?: "empty" | "error" | "results";
  accounts?: unknown[];
} = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/financeiro/beneficiaries")) {
        if (options.beneficiaries === "error") {
          return Promise.resolve(Response.json({ error: "Falha" }, { status: 500 }));
        }
        if (options.beneficiaries === "results") {
          return Promise.resolve(Response.json({
            items: [
              { id: "col-1", name: "Maria Teste", type: "collaborator" },
              { id: "col-2", name: "Marina Souza", type: "collaborator" },
            ],
            pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
          }));
        }
        return Promise.resolve(Response.json({
          items: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }));
      }
      if (url.includes("/api/financeiro/categories")) {
        return Promise.resolve(Response.json(categories));
      }
      if (url.includes("/api/financeiro/cost-centers")) {
        return Promise.resolve(Response.json([]));
      }
      if (url.includes("/api/financeiro/accounts-payable")) {
        return Promise.resolve(Response.json(options.accounts ?? []));
      }
      return Promise.resolve(Response.json([]));
    }),
  );
}

function mockAccountsReceivableFetch(accounts: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/financeiro/categories")) {
        return Promise.resolve(Response.json(categories));
      }
      if (url.includes("/api/financeiro/cost-centers")) {
        return Promise.resolve(Response.json([]));
      }
      if (url.includes("/api/financeiro/accounts-receivable")) {
        return Promise.resolve(Response.json(accounts));
      }
      return Promise.resolve(Response.json([]));
    }),
  );
}

async function findDesktopRow(description: string) {
  const table = await screen.findByRole("table");
  await waitFor(() =>
    expect(within(table).getByText(description)).toBeInTheDocument(),
  );
  const row = within(table).getByText(description).closest("tr");
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/financeiro/categories")) {
        return Promise.resolve(Response.json(categories));
      }
      if (url.includes("/api/financeiro/entries")) {
        return Promise.resolve(Response.json(entries));
      }
      if (url.includes("/api/financeiro/dashboard")) {
        return Promise.resolve(Response.json({
          totalReceitas: 1000,
          totalDespesas: 660,
          saldo: 340,
          contasAVencer: 1,
          contasVencidas: 0,
          contasPagasMes: 0,
          contasRecebidasMes: 2,
        }));
      }
      return Promise.resolve(Response.json([]));
    }),
  );
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  act(() => {
    useAuthStore.setState({ user: null });
  });
});

describe("financial components", () => {
  it("renders launch cards and table with calculated formatted values", async () => {
    renderWithClient(<Lancamentos />);

    expect((await screen.findAllByText("Receita instalacao")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Compra material").length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText("1.000,00")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText("660,00")).length).toBeGreaterThan(0);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders dashboard cards from the same calculated totals", async () => {
    renderWithClient(<MemoryRouter><Dashboard /></MemoryRouter>);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/financeiro/dashboard")));
    expect((await screen.findAllByText(moneyText("1.000,00"))).length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText("660,00")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(moneyText("340,00")).length).toBeGreaterThan(0);
  });

  it("shows dashboard skeletons while KPI data is loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    const { container } = renderWithClient(<MemoryRouter><Dashboard /></MemoryRouter>);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("keeps tables and modals inside responsive containers", async () => {
    renderWithClient(<Lancamentos />);

    const table = await screen.findByRole("table");
    expect(table.parentElement).toHaveClass("overflow-auto");

    fireEvent.click(screen.getAllByRole("button", { name: /novo lançamento/i })[0]!);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveClass("overflow-y-auto");
    expect(dialog).toHaveClass("max-h-[calc(100dvh-2rem)]");
  });

  it("keeps financial filters compact until more filters is requested", async () => {
    renderWithClient(<Lancamentos />);

    await screen.findByRole("table");
    expect(screen.getByLabelText(/filtrar por tipo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filtrar por status/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/filtrar por periodo/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mais filtros/i }));

    expect(screen.getByLabelText(/filtrar por periodo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filtrar por categoria/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aplicar/i })).toBeInTheDocument();
  });

  it("shows empty collaborator autocomplete state", async () => {
    mockAccountsPayableFetch({ beneficiaries: "empty" });
    renderWithClient(<ContasPagar />);

    fireEvent.click((await screen.findAllByRole("button", { name: /nova conta/i }))[0]!);
    fireEvent.change(screen.getByLabelText(/tipo do favorecido/i), {
      target: { value: "collaborator" },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite para buscar um colaborador/i), {
      target: { value: "sem resultado" },
    });

    expect(await screen.findByText("Nenhum colaborador ativo encontrado com esse nome.")).toBeInTheDocument();
  });

  it("shows collaborator autocomplete error state with retry action", async () => {
    mockAccountsPayableFetch({ beneficiaries: "error" });
    renderWithClient(<ContasPagar />);

    fireEvent.click((await screen.findAllByRole("button", { name: /nova conta/i }))[0]!);
    fireEvent.change(screen.getByLabelText(/tipo do favorecido/i), {
      target: { value: "collaborator" },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite para buscar um colaborador/i), {
      target: { value: "erro" },
    });

    expect(await screen.findByText("Não foi possível buscar colaboradores. Tente novamente.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it("switches beneficiary type and clears the previous visible field", async () => {
    mockAccountsPayableFetch();
    renderWithClient(<ContasPagar />);

    fireEvent.click((await screen.findAllByRole("button", { name: /nova conta/i }))[0]!);
    fireEvent.change(screen.getByLabelText(/fornecedor/i), {
      target: { value: "Fornecedor Alfa" },
    });
    fireEvent.change(screen.getByLabelText(/tipo do favorecido/i), {
      target: { value: "collaborator" },
    });

    expect(screen.queryByLabelText(/^fornecedor$/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/digite para buscar um colaborador/i)).toHaveValue("");

    fireEvent.change(screen.getByLabelText(/tipo do favorecido/i), {
      target: { value: "supplier" },
    });

    expect(screen.getByLabelText(/^fornecedor$/i)).toHaveValue("");
    expect(screen.queryByPlaceholderText(/digite para buscar um colaborador/i)).not.toBeInTheDocument();
  });

  it("supports keyboard selection and selected state in collaborator autocomplete", async () => {
    mockAccountsPayableFetch({ beneficiaries: "results" });
    renderWithClient(<ContasPagar />);

    fireEvent.click((await screen.findAllByRole("button", { name: /nova conta/i }))[0]!);
    fireEvent.change(screen.getByLabelText(/tipo do favorecido/i), {
      target: { value: "collaborator" },
    });
    const input = screen.getByPlaceholderText(/digite para buscar um colaborador/i);
    fireEvent.change(input, { target: { value: "mari" } });

    expect(await screen.findByRole("option", { name: "Maria Teste" })).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Marina Souza")).toBeInTheDocument();
    expect(screen.getByText("Colaborador selecionado")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByPlaceholderText(/digite para buscar um colaborador/i)).toHaveValue("");
  });

  it("loads saved collaborator beneficiary when editing an account", async () => {
    mockAccountsPayableFetch({ accounts: [payableCollaborator] });
    renderWithClient(<ContasPagar />);

    expect((await screen.findAllByText("Repasse colaborador")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: /ações/i })[0]!);
    fireEvent.click(await screen.findByRole("menuitem", { name: /editar/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: /editar conta a pagar/i })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/tipo do favorecido/i)).toHaveValue("collaborator");
    expect(within(dialog).getByPlaceholderText(/digite para buscar um colaborador/i)).toHaveValue("Maria Teste");
    expect(within(dialog).getByText("Colaborador selecionado")).toBeInTheDocument();
  });

  it("blocks submit with free text collaborator and associates validation with the field", async () => {
    mockAccountsPayableFetch({ beneficiaries: "empty" });
    useAuthStore.setState({ user: { id: "user-1" } as never });
    renderWithClient(<ContasPagar />);

    fireEvent.click((await screen.findAllByRole("button", { name: /nova conta/i }))[0]!);
    const dialog = await screen.findByRole("dialog");
    await act(async () => {
      fireEvent.change(within(dialog).getByLabelText(/descrição/i), {
        target: { value: "Conta colaborador" },
      });
    });
    await act(async () => {
      fireEvent.change(within(dialog).getByLabelText(/valor/i), {
        target: { value: "300" },
      });
      fireEvent.click(within(dialog).getByLabelText(/data de vencimento/i));
    });
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: "Hoje" }));
    });
    await act(async () => {
      fireEvent.change(within(dialog).getByLabelText(/categoria/i), {
        target: { value: "cat-d" },
      });
    });
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.change(within(dialog).getByLabelText(/tipo do favorecido/i), {
        target: { value: "collaborator" },
      });
      fireEvent.change(within(dialog).getByPlaceholderText(/digite para buscar um colaborador/i), {
        target: { value: "texto livre" },
      });
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: /^salvar$/i }));
    });

    const error = within(dialog).getByText("Selecione um colaborador ativo da lista antes de salvar.");
    const input = within(dialog).getByPlaceholderText(/digite para buscar um colaborador/i);
    expect(error).toHaveAttribute("id", "account-payable-beneficiary-error");
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("account-payable-beneficiary-error"),
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("renders beneficiary type aria labels in the payable listing", async () => {
    mockAccountsPayableFetch({ accounts: [payableCollaborator] });
    renderWithClient(<ContasPagar />);

    expect(
      await screen.findAllByLabelText("Tipo do favorecido: Colaborador"),
    ).not.toHaveLength(0);
  });

  it("hides common edit and delete actions for received receivable accounts", async () => {
    mockAccountsReceivableFetch([receivableReceived]);
    renderWithClient(<ContasReceber />);

    const row = await findDesktopRow("Recebida bloqueada");
    fireEvent.click(within(row).getByRole("button", { name: /acoes|ações/i }));

    expect(await screen.findByRole("menuitem", { name: /estornar recebimento/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /excluir/i })).not.toBeInTheDocument();
  });

  it("hides the action menu for reversed receivable accounts without common actions", async () => {
    mockAccountsReceivableFetch([receivableReversed]);
    renderWithClient(<ContasReceber />);

    const row = await findDesktopRow("Estornada bloqueada");
    expect(within(row).queryByRole("button", { name: /acoes|ações/i })).not.toBeInTheDocument();
  });

  it("keeps pending receivable accounts editable in the common flow", async () => {
    mockAccountsReceivableFetch([receivablePending]);
    renderWithClient(<ContasReceber />);

    const row = await findDesktopRow("Receber editavel");
    fireEvent.click(within(row).getByRole("button", { name: /acoes|ações/i }));

    expect(await screen.findByRole("menuitem", { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /excluir/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /marcar como recebida/i })).toBeInTheDocument();
  });

  it("hides common edit and delete actions for paid payable accounts", async () => {
    mockAccountsPayableFetch({ accounts: [payablePaid] });
    renderWithClient(<ContasPagar />);
    fireEvent.change(screen.getByLabelText(/filtrar por status/i), {
      target: { value: "pago" },
    });

    const row = await findDesktopRow("Paga bloqueada");
    fireEvent.click(within(row).getByRole("button", { name: /acoes|ações/i }));

    expect(await screen.findByRole("menuitem", { name: /estornar pagamento/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /excluir/i })).not.toBeInTheDocument();
  });

  it("hides the action menu for reversed payable accounts without common actions", async () => {
    mockAccountsPayableFetch({ accounts: [payableReversed] });
    renderWithClient(<ContasPagar />);

    const row = await findDesktopRow("Pagar estornada bloqueada");
    expect(within(row).queryByRole("button", { name: /acoes|ações/i })).not.toBeInTheDocument();
  });
});
