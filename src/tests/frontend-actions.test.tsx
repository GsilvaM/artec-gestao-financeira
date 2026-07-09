import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { Component as Lancamentos } from "@/routes/app/financeiro/lancamentos/page";
import { Component as Clientes } from "@/routes/app/cadastros/clientes/page";
import { Component as Relatorios } from "@/routes/app/relatorios/page";
import { Component as RelatorioFinanceiro } from "@/routes/app/relatorios/financeiros/page";
import { Component as Configuracoes } from "@/routes/app/configuracoes/page";

function renderWithQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("frontend actions", () => {
  it("opens the new financial entry dialog", () => {
    renderWithQueryClient(<MemoryRouter><Lancamentos /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: /novo lançamento/i })[0]!);
    expect(screen.getByRole("heading", { name: /novo lançamento/i })).toBeInTheDocument();
  });

  it("opens the new client dialog", () => {
    render(<Clientes />);
    fireEvent.click(screen.getAllByRole("button", { name: /novo cliente/i })[0]!);
    expect(screen.getByRole("heading", { name: /novo cliente/i })).toBeInTheDocument();
  });

  it("navigates from reports to a concrete report", () => {
    renderWithQueryClient(
      <MemoryRouter initialEntries={["/app/relatorios"]}>
        <Routes>
          <Route path="/app/relatorios" element={<Relatorios />} />
          <Route path="/app/relatorios/financeiros" element={<RelatorioFinanceiro />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /abrir relat/i })[0]!);
    expect(screen.getByRole("heading", { name: /relat/i })).toBeInTheDocument();
  });

  it("opens the settings dialog", () => {
    render(<Configuracoes />);
    fireEvent.click(screen.getAllByRole("button", { name: /configurar/i })[0]!);
    expect(screen.getByRole("heading", { name: /configurar empresa/i })).toBeInTheDocument();
  });
});
