import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateBillingEmail, DEFAULT_BILLING_TEXTS } from "@/domain/financeiro/billing-email";
import { appendAuvoMetadata } from "@/domain/financeiro/auvo-cobranca";
import { parseAuvoInvoiceHtml, parseBrazilianDate, parseBrazilianMoney } from "@/server/financeiro/auvo-invoice-parser";
import { importAuvoInvoice, validateAuvoInvoiceUrl } from "@/server/financeiro/auvo-cobranca-service";
import * as auvoRoute from "@/routes/api/financeiro/auvo-cobranca";
import * as accountsReceivable from "@/routes/api/financeiro/accounts-receivable";
import { accountReceivableRepo, financialEntryRepo } from "@/server/financeiro/repositories.js";

vi.mock("@/server/financeiro/repositories.js", () => ({
  accountReceivableRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  financialEntryRepo: {
    create: vi.fn(),
  },
}));

const AUTHENTICATED_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CATEGORY_ID = "00000000-0000-0000-0000-000000000001";

const AUVO_URL =
  "https://app.auvo.com.br/informacoes/ObtenhaFaturaHTML/b2dbe5ac-4d19-4266-93fd-4e4c30844b81$token";

const AUVO_HTML = `
  <html>
    <body>
      <section>
        <h2>Prestador</h2>
        <p>Artec Ambientes Climatizados</p>
        <p>CNPJ: 27.859.657/0001-65</p>
        <p>E-mail: contato@artecclimatizados.com.br</p>
        <p>Telefone: 27998441989</p>
      </section>
      <table>
        <tr><td>Fatura</td><td>289</td></tr>
        <tr><td>Assunto</td><td>Servicos prestados a Tarefa #76966433</td></tr>
        <tr><td>Cliente</td><td>Luiz Fernando Landeiro</td></tr>
        <tr><td>CPF/CNPJ</td><td>075.784.817-62</td></tr>
        <tr><td>Data de emissao</td><td>16/07/2026</td></tr>
        <tr><td>Vencimento</td><td>17/07/2026</td></tr>
        <tr><td>Forma de pagamento</td><td>Boleto</td></tr>
        <tr><td>Endereco de servico</td><td>Rua Teste, 123</td></tr>
        <tr><td>Total</td><td>R$ 950,00</td></tr>
      </table>
      <section>
        <h2>Cliente</h2>
        <p>Nome</p>
        <p>Luiz Fernando Landeiro</p>
        <p>CPF/CNPJ</p>
        <p>075.784.817-62</p>
      </section>
      <section>
        <h2>Endereco de servico</h2>
        <p>Rua Chapot Presvot, 51, Praia do Canto, Vitoria - ES, 29055-410, Ap. 403, Ed. Costa Victoria Residences</p>
      </section>
      <section>
        <h2>Servicos</h2>
        <table>
          <tr><th>Servico</th><th>Quantidade</th><th>Valor unitario</th><th>Subtotal</th></tr>
          <tr><td>Acrescimo de fluido refrigerante</td><td>1</td><td>R$ 300,00</td><td>R$ 300,00</td></tr>
          <tr><td>Descobrir e vedar vazamento com nitrogenio pressurizado</td><td>1</td><td>R$ 250,00</td><td>R$ 250,00</td></tr>
          <tr><td>Instalacao de ar-condicionado split hi-wall</td><td>1</td><td>R$ 250,00</td><td>R$ 250,00</td></tr>
          <tr><td>Desinstalacao de ar-condicionado split hi-wall</td><td>1</td><td>R$ 150,00</td><td>R$ 150,00</td></tr>
        </table>
      </section>
      <p>Acréscimo de fluido refrigerante R$ 300,00</p>
      <p>Higienizacao R$ 650,00</p>
    </body>
  </html>
`;

const AUVO_HTML_DUE_FROM_INSTALLMENT = `
  <html>
    <body>
      <table>
        <tr><td>Fatura</td><td>290</td></tr>
        <tr><td>Cliente</td><td>Cliente Parcela</td></tr>
        <tr><td>Total</td><td>R$ 100,00</td></tr>
      </table>
      <section>
        <h2>Recebimentos</h2>
        <table>
          <tr><th>Parcela</th><th>Data</th><th>Valor</th></tr>
          <tr><td>1</td><td>18/07/2026</td><td>R$ 100,00</td></tr>
        </table>
      </section>
    </body>
  </html>
`;

const AUVO_HTML_REORDERED_SERVICE_COLUMNS = `
  <html>
    <body>
      <table>
        <tr><td>Fatura</td><td>291</td></tr>
        <tr><td>Cliente</td><td>Cliente Ordem</td></tr>
        <tr><td>Total</td><td>R$ 950,00</td></tr>
      </table>
      <section>
        <h2>Servicos</h2>
        <table>
          <tr><th>Subtotal</th><th>Descricao</th><th>Valor unitario</th><th>Quantidade</th></tr>
          <tr><td>R$ 300,00</td><td>Acrescimo de fluido refrigerante</td><td>R$ 300,00</td><td>1</td></tr>
          <tr><td>R$ 250,00</td><td>Descobrir e vedar vazamento com nitrogenio pressurizado</td><td>R$ 250,00</td><td>1</td></tr>
          <tr><td>R$ 250,00</td><td>Instalacao de ar-condicionado split hi-wall</td><td>R$ 250,00</td><td>1</td></tr>
          <tr><td>R$ 150,00</td><td>Desinstalacao de ar-condicionado split hi-wall</td><td>R$ 150,00</td><td>1</td></tr>
        </table>
      </section>
    </body>
  </html>
`;

const AUVO_HTML_INLINE_FIELDS = `
  <html>
    <body>
      <section>
        <h2>Prestador</h2>
        <p>Artec Ambientes Climatizados</p>
        <p>CNPJ: 27.859.657/0001-65</p>
        <p>E-mail: contato@artecclimatizados.com.br</p>
        <p>Telefone: 27998441989</p>
      </section>
      <section>
        <h1>Fatura Nº 289</h1>
        <p>Assunto Servicos prestados a Tarefa #76966433</p>
      </section>
      <section>
        <h2>Dados do cliente</h2>
        <p>Luiz Fernando Landeiro</p>
        <p>CPF/CNPJ 075.784.817-62</p>
        <p>E-mail cliente@example.com</p>
        <p>Telefone (27) 99999-0000</p>
      </section>
      <section>
        <h2>Dados da cobranca</h2>
        <p>Emissao 16/07/2026</p>
        <p>Vencimento 17/07/2026</p>
        <p>Valor R$ 950,00</p>
        <p>Pagamento A vista no Boleto</p>
      </section>
      <section>
        <h2>Endereco de servico</h2>
        <p>Rua Chapot Presvot, 51, Praia do Canto, Vitoria - ES, 29055-410, Ap. 403, Ed Costa Victoria</p>
      </section>
      <section>
        <h2>Servicos</h2>
        <table>
          <tr><th>Servico</th><th>Quantidade</th><th>Valor unitario</th><th>Subtotal</th></tr>
          <tr><td>Acrescimo de fluido refrigerante</td><td>1</td><td>R$ 300,00</td><td>R$ 300,00</td></tr>
          <tr><td>Descobrir e vedar vazamento com nitrogenio pressurizado</td><td>1</td><td>R$ 250,00</td><td>R$ 250,00</td></tr>
          <tr><td>Instalacao de ar-condicionado split hi wall</td><td>1</td><td>R$ 250,00</td><td>R$ 250,00</td></tr>
          <tr><td>Desinstalacao de ar condicionado split hi wall</td><td>1</td><td>R$ 150,00</td><td>R$ 150,00</td></tr>
        </table>
      </section>
    </body>
  </html>
`;

function htmlResponse(html = AUVO_HTML, init?: ResponseInit) {
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
    ...init,
  });
}

describe("Auvo invoice URL validation", () => {
  it("accepts only the public Auvo invoice URL shape", () => {
    expect(validateAuvoInvoiceUrl(AUVO_URL).hostname).toBe("app.auvo.com.br");
  });

  it("blocks protocol, domain, credentials, ports and invalid paths", () => {
    expect(() => validateAuvoInvoiceUrl(AUVO_URL.replace("https:", "http:"))).toThrow("HTTPS");
    expect(() => validateAuvoInvoiceUrl("https://evil.example/informacoes/ObtenhaFaturaHTML/x")).toThrow("app.auvo.com.br");
    expect(() => validateAuvoInvoiceUrl("https://user:pass@app.auvo.com.br/informacoes/ObtenhaFaturaHTML/x")).toThrow("credenciais");
    expect(() => validateAuvoInvoiceUrl("https://app.auvo.com.br:444/informacoes/ObtenhaFaturaHTML/x")).toThrow("porta");
    expect(() => validateAuvoInvoiceUrl("https://app.auvo.com.br/outra-rota/x")).toThrow("fatura publica");
  });
});

describe("Auvo invoice parser", () => {
  it("normalizes money, dates and key invoice fields from sanitized HTML for invoice 289", () => {
    const invoice = parseAuvoInvoiceHtml(AUVO_HTML, AUVO_URL);

    expect(invoice.invoiceNumber).toBe("289");
    expect(invoice.taskNumber).toBe("76966433");
    expect(invoice.client.name).toBe("Luiz Fernando Landeiro");
    expect(invoice.client.document).toBe("075.784.817-62");
    expect(invoice.client.email).toBeNull();
    expect(invoice.client.phone).toBeNull();
    expect(invoice.issueDate).toBe("2026-07-16");
    expect(invoice.dueDate).toBe("2026-07-17");
    expect(invoice.paymentMethod).toBe("Boleto");
    expect(invoice.total).toBe(950);
    expect(invoice.serviceAddress).toBe("Rua Chapot Presvot, 51, Praia do Canto, Vitoria - ES, 29055-410, Ap. 403, Ed. Costa Victoria Residences");
    expect(invoice.items).toHaveLength(4);
    expect(invoice.items).toEqual([
      expect.objectContaining({ description: "Acrescimo de fluido refrigerante", quantity: 1, unitPrice: 300, total: 300 }),
      expect.objectContaining({ description: "Descobrir e vedar vazamento com nitrogenio pressurizado", quantity: 1, unitPrice: 250, total: 250 }),
      expect.objectContaining({ description: "Instalacao de ar-condicionado split hi-wall", quantity: 1, unitPrice: 250, total: 250 }),
      expect.objectContaining({ description: "Desinstalacao de ar-condicionado split hi-wall", quantity: 1, unitPrice: 150, total: 150 }),
    ]);
    expect(invoice.items.reduce((total, item) => total + item.total, 0)).toBe(950);
    expect(invoice.serviceAddress).not.toContain("Quantidade");
    expect(invoice.items.some((item) => item.description === "1,00" || item.total === 1)).toBe(false);
  });

  it("does not invent missing data and reports warnings", () => {
    const invoice = parseAuvoInvoiceHtml("<html><body>Sem dados financeiros</body></html>", AUVO_URL);

    expect(invoice.invoiceNumber).toBeNull();
    expect(invoice.total).toBeNull();
    expect(invoice.items).toHaveLength(0);
    expect(invoice.warnings.length).toBeGreaterThan(0);
  });

  it("keeps provider data out of client fields", () => {
    const invoice = parseAuvoInvoiceHtml(AUVO_HTML, AUVO_URL);

    expect(invoice.client.name).toBe("Luiz Fernando Landeiro");
    expect(invoice.client.document).toBe("075.784.817-62");
    expect(invoice.client.document).not.toBe("27998441989");
    expect(invoice.client.phone).not.toBe("075.784.817-62");
    expect(invoice.client.email).toBeNull();
  });

  it("uses the first installment due date when there is no explicit vencimento", () => {
    const invoice = parseAuvoInvoiceHtml(AUVO_HTML_DUE_FROM_INSTALLMENT, AUVO_URL);

    expect(invoice.dueDate).toBe("2026-07-18");
    expect(invoice.installments).toEqual([expect.objectContaining({ number: 1, amount: 100, dueDate: "2026-07-18" })]);
  });

  it("maps service table columns by header even when their order changes", () => {
    const invoice = parseAuvoInvoiceHtml(AUVO_HTML_REORDERED_SERVICE_COLUMNS, AUVO_URL);

    expect(invoice.items).toHaveLength(4);
    expect(invoice.items[0]).toMatchObject({
      description: "Acrescimo de fluido refrigerante",
      quantity: 1,
      unitPrice: 300,
      total: 300,
    });
    expect(invoice.items.reduce((total, item) => total + item.total, 0)).toBe(950);
  });

  it("extracts inline Auvo fields needed by the billing email", () => {
    const invoice = parseAuvoInvoiceHtml(AUVO_HTML_INLINE_FIELDS, AUVO_URL);

    expect(invoice.invoiceNumber).toBe("289");
    expect(invoice.taskNumber).toBe("76966433");
    expect(invoice.subject).toBe("Servicos prestados a Tarefa #76966433");
    expect(invoice.client.name).toBe("Luiz Fernando Landeiro");
    expect(invoice.client.document).toBe("075.784.817-62");
    expect(invoice.client.email).toBe("cliente@example.com");
    expect(invoice.client.phone).toBe("(27) 99999-0000");
    expect(invoice.issueDate).toBe("2026-07-16");
    expect(invoice.dueDate).toBe("2026-07-17");
    expect(invoice.total).toBe(950);
    expect(invoice.paymentMethod).toBe("A vista no Boleto");
    expect(invoice.serviceAddress).toBe("Rua Chapot Presvot, 51, Praia do Canto, Vitoria - ES, 29055-410, Ap. 403, Ed Costa Victoria");
    expect(invoice.items).toHaveLength(4);
    expect(invoice.warnings).not.toContain("Numero da fatura nao encontrado.");
    expect(invoice.warnings).not.toContain("Cliente nao encontrado.");
  });

  it("handles spacing changes and keeps absent fields null", () => {
    const invoice = parseAuvoInvoiceHtml(`
      <html><body>
        <section>
          <h2> Cliente </h2>
          <div> CPF / CNPJ : 075.784.817-62 </div>
        </section>
        <table>
          <tr><td> Fatura </td><td> 292 </td></tr>
          <tr><td> Data de emissao </td><td> 16/07/2026 09:30:00 </td></tr>
          <tr><td> Total </td><td> R$ 100,00 </td></tr>
        </table>
      </body></html>
    `, AUVO_URL);

    expect(invoice.invoiceNumber).toBe("292");
    expect(invoice.issueDate).toBe("2026-07-16");
    expect(invoice.client.document).toBe("075.784.817-62");
    expect(invoice.client.email).toBeNull();
    expect(invoice.client.phone).toBeNull();
  });

  it("normalizes Brazilian formats", () => {
    expect(parseBrazilianMoney("R$ 1.234,56")).toBe(1234.56);
    expect(parseBrazilianDate("5/8/2026")).toBe("2026-08-05");
    expect(parseBrazilianDate("2026-07-17")).toBe("2026-07-17");
  });
});

describe("Auvo import service and route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(htmlResponse()));
    vi.mocked(accountReceivableRepo.findAll).mockResolvedValue([]);
  });

  it("fetches server-side, parses data and returns duplicate candidates", async () => {
    vi.mocked(accountReceivableRepo.findAll)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "rec-1",
          description: "Fatura nº 289 - Luiz",
          amount: 950,
          dueDate: new Date("2026-07-17T00:00:00"),
          status: "pending",
          categoryId: CATEGORY_ID,
          costCenterId: null,
          client: "Luiz Fernando Landeiro",
          receivedDate: null,
          userId: AUTHENTICATED_USER_ID,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          category: { id: CATEGORY_ID, name: "Servicos", type: "receita", color: null },
          costCenter: null,
        },
      ] as never);

    const result = await importAuvoInvoice(AUVO_URL);

    expect(result.invoice.invoiceNumber).toBe("289");
    expect(result.duplicates[0]).toMatchObject({
      id: "rec-1",
      reason: "Mesmo cliente, valor e vencimento.",
    });
  });

  it("blocks redirects to unauthorized hosts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { location: "https://evil.example/fatura" },
        }),
      ),
    );

    await expect(importAuvoInvoice(AUVO_URL)).rejects.toThrow("app.auvo.com.br");
  });

  it("returns normalized invoice data from the API route", async () => {
    const request = new Request("http://localhost/api/financeiro/auvo-cobranca/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: AUVO_URL }),
    });

    const response = await auvoRoute.action({
      request,
      params: { id: "import" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.invoice.invoiceNumber).toBe("289");
  });
});

describe("Billing email generation", () => {
  it("generates subject, HTML, plain text, selected documents and hides empty sections", () => {
    const email = generateBillingEmail({
      recipientEmail: "cliente@example.com",
      clientName: "Luiz Fernando Landeiro",
      clientDocument: "075.784.817-62",
      invoiceNumber: "289",
      issueDate: "2026-07-16",
      dueDate: "2026-07-17",
      amount: 950,
      paymentMethod: "Boleto",
      serviceAddress: "Rua Teste, 123",
      subject: null,
      openingText: DEFAULT_BILLING_TEXTS.opening,
      paymentText: DEFAULT_BILLING_TEXTS.payment,
      closingText: DEFAULT_BILLING_TEXTS.closing,
      services: [],
      documents: [
        { label: "Nota fiscal", checked: true },
        { label: "XML", checked: false },
        { label: "Boleto", checked: true },
      ],
      reports: [{ date: "2026-07-16", url: "javascript:alert(1)", label: "Relatorio perigoso" }],
      logoUrl: "https://app.example.com/artec-logo-email.svg",
      sender: {
        name: "Gabriel",
        role: "Financeiro",
        company: "Artec Ambientes Climatizados",
        email: "contato@artecclimatizados.com.br",
        phone: "(27) 99844-1989",
        city: "Vila Velha - ES",
        document: "27.859.657/0001-65",
      },
    });

    expect(email.subject).toContain("Fatura nº 289");
    expect(email.html).toContain("<!doctype html>");
    expect(email.html).toContain("1 nota fiscal de servico em PDF");
    expect(email.html).not.toContain("arquivo XML");
    expect(email.html).not.toContain("javascript:");
    expect(email.html).not.toContain("Servicos executados");
    expect(email.text).toContain("Valor total: R$ 950,00");
  });

  it("generates email through the API route", async () => {
    const request = new Request("http://localhost/api/financeiro/auvo-cobranca/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail: "cliente@example.com",
        clientName: "Cliente",
        dueDate: "2026-07-17",
        amount: 100,
        openingText: DEFAULT_BILLING_TEXTS.opening,
        paymentText: DEFAULT_BILLING_TEXTS.payment,
        closingText: DEFAULT_BILLING_TEXTS.closing,
        services: [],
        documents: [],
        reports: [],
        logoUrl: "https://app.example.com/artec-logo-email.svg",
        sender: {
          name: "Gabriel",
          role: "Financeiro",
          company: "Artec Ambientes Climatizados",
          email: "contato@artecclimatizados.com.br",
          phone: "(27) 99844-1989",
          city: "Vila Velha - ES",
          document: "27.859.657/0001-65",
        },
      }),
    });

    const response = await auvoRoute.action({
      request,
      params: { id: "email" },
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.html).toContain("Resumo da cobranca");
  });
});

describe("Imported receivable creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates only a pending receivable with Auvo metadata and no FinancialEntry", async () => {
    const parsed = parseAuvoInvoiceHtml(AUVO_HTML, AUVO_URL);
    const notes = appendAuvoMetadata("Servicos referentes a fatura importada do Auvo.", parsed);
    vi.mocked(accountReceivableRepo.create).mockResolvedValue({
      id: "rec-2",
      description: "Fatura nº 289 - Luiz Fernando Landeiro",
      amount: 950,
      dueDate: new Date("2026-07-17T00:00:00"),
      receivedDate: null,
      status: "pending",
      categoryId: CATEGORY_ID,
      costCenterId: null,
      client: "Luiz Fernando Landeiro",
      userId: AUTHENTICATED_USER_ID,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      category: { id: CATEGORY_ID, name: "Servicos", type: "receita", color: null },
      costCenter: null,
    } as never);

    const request = new Request("http://localhost/api/financeiro/accounts-receivable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Fatura nº 289 - Luiz Fernando Landeiro",
        amount: 950,
        dueDate: "2026-07-17",
        status: "pending",
        categoryId: CATEGORY_ID,
        client: "Luiz Fernando Landeiro",
        notes,
        userId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      }),
    });

    const response = await accountsReceivable.action({
      request,
      params: {},
      authenticatedUserId: AUTHENTICATED_USER_ID,
    });

    expect(response.status).toBe(201);
    expect(accountReceivableRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        userId: AUTHENTICATED_USER_ID,
        notes: expect.stringContaining("[auvoImport]"),
      }),
    );
    expect(financialEntryRepo.create).not.toHaveBeenCalled();
  });
});
