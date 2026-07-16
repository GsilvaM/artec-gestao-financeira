import type { AuvoInvoiceData, AuvoInvoiceInstallment, AuvoInvoiceItem } from "../../domain/financeiro/auvo-cobranca.js";

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(value: string) {
  return normalizeText(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function normalizeText(value: string | null | undefined) {
  return decodeEntities(value ?? "")
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function normalizeKey(value: string) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseBrazilianMoney(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/-?(?:R\$\s*)?[\d.]+,\d{2}|-?\d+(?:[.,]\d{1,2})?/i);
  if (!match) return null;
  const raw = match[0].replace(/R\$\s*/i, "").trim();
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

export function parseBrazilianDate(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseNumber(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/\d+(?:[,.]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDocument(text: string) {
  const match = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  return match?.[0] ?? null;
}

function parseEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function parsePhone(text: string) {
  return text.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/)?.[0] ?? null;
}

function extractTablePairs(html: string) {
  const pairs = new Map<string, string>();
  const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
  for (const rowMatch of html.matchAll(rowRegex)) {
    const cells = [...rowMatch[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1] ?? ""));
    if (cells.length >= 2) {
      const label = (cells[0] ?? "").replace(/:$/, "").trim();
      const value = cells.slice(1).join(" ").trim();
      if (label && value) pairs.set(normalizeKey(label), value);
    }
  }
  return pairs;
}

function extractInlinePairs(text: string) {
  const pairs = new Map<string, string>();
  const labels = [
    "numero da fatura",
    "nº da fatura",
    "número",
    "fatura",
    "assunto",
    "cliente",
    "cpf/cnpj",
    "cpf",
    "cnpj",
    "data de emissao",
    "emissao",
    "vencimento",
    "endereco de servico",
    "endereco do servico",
    "endereco de cobranca",
    "forma de pagamento",
    "condicao de pagamento",
    "subtotal",
    "desconto",
    "acrescimos",
    "total",
    "valor restante",
    "observacao",
    "status",
  ];
  const lines = text.split(/\n+/).map((line) => normalizeText(line)).filter(Boolean);
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon > 0) {
      const label = normalizeKey(line.slice(0, colon));
      const value = line.slice(colon + 1).trim();
      if (label && value) pairs.set(label, value);
      continue;
    }
    for (const label of labels) {
      const normalizedLine = normalizeKey(line);
      if (normalizedLine.startsWith(label + " ")) {
        pairs.set(label, line.slice(label.length).trim());
      }
    }
  }
  return pairs;
}

function getPair(pairs: Map<string, string>, keys: string[]) {
  for (const key of keys.map(normalizeKey)) {
    const exact = pairs.get(key);
    if (exact) return exact;
    for (const [candidate, value] of pairs) {
      if (candidate.includes(key) || key.includes(candidate)) return value;
    }
  }
  return null;
}

function parseExternalId(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    return url.pathname.split("/").filter(Boolean).at(-1)?.split("$")[0] ?? null;
  } catch {
    return null;
  }
}

function parseItems(text: string): AuvoInvoiceItem[] {
  const items: AuvoInvoiceItem[] = [];
  const serviceSection = text.split(/\n/).filter((line) => {
    const normalized = normalizeKey(line);
    return normalized.includes("r$") || /\d+,\d{2}/.test(line);
  });
  for (const line of serviceSection) {
    const total = parseBrazilianMoney(line);
    if (total === null) continue;
    const description = normalizeText(line.replace(/R\$\s*[\d.]+,\d{2}/gi, "").replace(/\s+\d+(?:[,.]\d+)?\s*$/g, ""));
    if (!description || normalizeKey(description).match(/^(subtotal|total|desconto|valor restante|vencimento)$/)) continue;
    items.push({
      type: normalizeKey(line).includes("produto") ? "product" : "service",
      description,
      quantity: parseNumber(line.match(/\bquantidade[:\s]+([\d,.]+)/i)?.[1] ?? null),
      unitPrice: null,
      discount: null,
      total,
    });
  }
  return items.slice(0, 20);
}

function parseInstallments(text: string): AuvoInvoiceInstallment[] {
  const installments: AuvoInvoiceInstallment[] = [];
  for (const match of text.matchAll(/(?:parcela\s*)?(\d{1,2})[^\n]{0,80}?(\d{1,2}\/\d{1,2}\/\d{2,4})[^\n]{0,80}?((?:R\$\s*)?[\d.]+,\d{2})/gi)) {
    const amount = parseBrazilianMoney(match[3]);
    if (amount === null) continue;
    installments.push({
      number: Number(match[1]),
      amount,
      dueDate: parseBrazilianDate(match[2]),
      remainingAmount: amount,
    });
  }
  return installments;
}

export function parseAuvoInvoiceHtml(html: string, sourceUrl = ""): AuvoInvoiceData {
  const pairs = new Map([...extractTablePairs(html), ...extractInlinePairs(stripTags(html))]);
  const text = stripTags(html);
  const invoiceNumber = getPair(pairs, ["numero da fatura", "nº da fatura", "fatura", "numero"])?.match(/\d+/)?.[0] ?? null;
  const taskNumber = text.match(/tarefa\s*#?\s*(\d+)/i)?.[1] ?? getPair(pairs, ["tarefa"])?.match(/\d+/)?.[0] ?? null;
  const clientValue = getPair(pairs, ["cliente", "razao social", "nome"]);
  const document = getPair(pairs, ["cpf/cnpj", "cpf", "cnpj"]) ?? parseDocument(text);
  const dueDate = parseBrazilianDate(getPair(pairs, ["vencimento", "data de vencimento"])) ?? parseBrazilianDate(text.match(/vencimento[^\d]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)?.[1]);
  const issueDate = parseBrazilianDate(getPair(pairs, ["data de emissao", "emissao"]));
  const total = parseBrazilianMoney(getPair(pairs, ["total", "valor total"])) ?? parseBrazilianMoney(text.match(/total[^\d]*(R\$\s*[\d.]+,\d{2})/i)?.[1]);
  const remainingAmount = parseBrazilianMoney(getPair(pairs, ["valor restante", "restante"])) ?? total;
  const items = parseItems(text);
  const installments = parseInstallments(text);
  const warnings: string[] = [];
  if (!invoiceNumber) warnings.push("Numero da fatura nao encontrado.");
  if (!clientValue) warnings.push("Cliente nao encontrado.");
  if (!dueDate) warnings.push("Vencimento nao encontrado.");
  if (total === null) warnings.push("Valor total nao encontrado.");

  return {
    source: "auvo",
    sourceUrl,
    externalId: parseExternalId(sourceUrl),
    invoiceNumber,
    taskNumber,
    subject: getPair(pairs, ["assunto"]) ?? (taskNumber ? `Servicos prestados a Tarefa #${taskNumber}` : null),
    status: getPair(pairs, ["status"]),
    client: {
      name: clientValue,
      document,
      email: parseEmail(text),
      phone: parsePhone(text),
    },
    issueDate,
    dueDate,
    serviceAddress: getPair(pairs, ["endereco de servico", "endereco do servico"]),
    billingAddress: getPair(pairs, ["endereco de cobranca"]),
    paymentMethod: getPair(pairs, ["forma de pagamento", "condicao de pagamento", "pagamento"]),
    installments,
    items,
    subtotal: parseBrazilianMoney(getPair(pairs, ["subtotal"])),
    discount: parseBrazilianMoney(getPair(pairs, ["desconto"])),
    additionalCosts: parseBrazilianMoney(getPair(pairs, ["acrescimos", "custos adicionais"])),
    total,
    remainingAmount,
    notes: getPair(pairs, ["observacao", "observacoes"]),
    documents: [],
    warnings,
  };
}
