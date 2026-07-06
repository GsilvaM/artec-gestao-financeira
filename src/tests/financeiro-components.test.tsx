import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Component as Dashboard } from "@/routes/app/dashboard";
import { Component as Lancamentos } from "@/routes/app/financeiro/lancamentos/page";

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

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const moneyText = (value: string) => new RegExp(`R\\$\\s*${value.replace(".", "\\.")}`);

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
  vi.unstubAllGlobals();
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
});
