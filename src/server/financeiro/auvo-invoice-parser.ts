import type { AuvoInvoiceData, AuvoInvoiceInstallment, AuvoInvoiceItem } from "../../domain/financeiro/auvo-cobranca.js";

type TableRow = string[];

const SECTION_TITLES = [
  "identificacao da fatura",
  "dados da fatura",
  "dados do cliente",
  "cliente",
  "tomador",
  "emitida para",
  "dados da cobranca",
  "cobranca",
  "forma de pagamento",
  "endereco",
  "endereco de servico",
  "endereco de cobranca",
  "produtos",
  "servicos",
  "itens",
  "resumo",
  "pagamento",
  "recebimentos",
  "nota fiscal",
  "anexos",
  "prestador",
  "emitente",
  "fornecedor",
];

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
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
    .replace(/[º°]/g, "o")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/n[Âº°]\b/g, "numero")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return normalizeText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:td|th|tr|p|div|li|h[1-6]|section|article|table)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function textLines(value: string) {
  return stripTags(value).split(/\n+/).map((line) => normalizeText(line)).filter(Boolean);
}

function isSectionTitle(line: string) {
  const key = normalizeKey(line);
  if (/^(telefone|cpf cnpj|cpf|cnpj|email|e mail|data de emissao)(\s|$)/.test(key)) return false;
  if (/^endereco(?:$|\s+(?!de servico|do servico|de cobranca))/.test(key)) return false;
  return SECTION_TITLES.some((title) => key === title || key.startsWith(`${title} `));
}

function findSection(lines: string[], titles: string[]) {
  const titleKeys = titles.map(normalizeKey);
  let start = -1;
  lines.forEach((line, index) => {
    const key = normalizeKey(line);
    if (titleKeys.some((title) => key === title)) start = index;
  });
  if (start < 0) return "";

  const end = lines.findIndex((line, index) => index > start && isSectionTitle(line));
  return lines.slice(start + 1, end > start ? end : undefined).join("\n");
}

function normalizeLabel(value: string) {
  return normalizeKey(value.replace(/:$/, ""));
}

function extractTableRows(html: string): TableRow[] {
  const rows: TableRow[] = [];
  for (const rowMatch of html.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const cells = [...rowMatch[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => stripTags(cell[1] ?? ""))
      .filter(Boolean);
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function extractTables(html: string) {
  return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((match) => ({
    html: match[0],
    text: stripTags(match[0]),
    rows: extractTableRows(match[0]),
  }));
}

function findValueInRows(rows: TableRow[], labels: string[]) {
  const labelKeys = labels.map(normalizeLabel);
  for (const row of rows) {
    if (row.length < 2) continue;
    const label = normalizeLabel(row[0] ?? "");
    if (!labelKeys.includes(label)) continue;
    const value = normalizeText(row.slice(1).join(" "));
    if (value && normalizeLabel(value) !== label) return value;
  }
  return null;
}

function findValueByLabel(text: string, labels: string[]) {
  const lines = text.split(/\n+/).map((line) => normalizeText(line)).filter(Boolean);
  const labelKeys = labels.map(normalizeLabel);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const colon = line.indexOf(":");
    if (colon > 0) {
      const label = normalizeLabel(line.slice(0, colon));
      const value = normalizeText(line.slice(colon + 1));
      if (labelKeys.includes(label) && value) return value;
    }

    const lineKey = normalizeLabel(line);
    const inlineLabel = labelKeys.find((label) => lineKey.startsWith(`${label} `));
    if (inlineLabel) {
      const inlineValue = normalizeText(line.split(/\s+/).slice(inlineLabel.split(/\s+/).length).join(" "));
      if (inlineValue && normalizeLabel(inlineValue) !== inlineLabel) return inlineValue.replace(/^[:#-]\s*/, "");
    }

    if (!labelKeys.includes(lineKey)) continue;
    for (const next of lines.slice(index + 1, index + 4)) {
      if (isSectionTitle(next)) break;
      if (normalizeLabel(next) && !labelKeys.includes(normalizeLabel(next))) return next;
    }
  }

  return null;
}

function findAnyValue(rows: TableRow[], fullText: string, labels: string[]) {
  return findValueInRows(rows, labels) ?? findValueByLabel(fullText, labels);
}

function firstParsedMoney(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const parsed = parseBrazilianMoney(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function firstSectionValue(text: string) {
  return text.split(/\n+/).map((line) => normalizeText(line)).find((line) => line && !isSectionTitle(line)) ?? null;
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
  const iso = value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    if (!Number.isNaN(date.getTime())) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

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

function parseDocument(text: string | null | undefined) {
  if (!text) return null;
  const match = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
  return match?.[0] ?? null;
}

function parseEmail(text: string | null | undefined) {
  if (!text) return null;
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  if (!email) return null;
  return /artec|climatizado/i.test(email) ? null : email;
}

function parsePhone(text: string | null | undefined) {
  if (!text) return null;
  return text.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/)?.[0] ?? null;
}

function parseExternalId(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    return url.pathname.split("/").filter(Boolean).at(-1)?.split("$")[0] ?? null;
  } catch {
    return null;
  }
}

function isProviderText(value: string | null | undefined) {
  return Boolean(value && /artec|ambientes climatizados|prestador|emitente|fornecedor/i.test(value));
}

function looksLikeClientName(value: string | null | undefined) {
  if (!value || isProviderText(value)) return false;
  const key = normalizeKey(value);
  if (!key || SECTION_TITLES.includes(key)) return false;
  if (/^(nome|cliente|razao social|cpf|cnpj|cpf cnpj|documento|email|e mail|telefone|celular)$/.test(key)) return false;
  if (parseDocument(value) || parseEmail(value) || parsePhone(value)) return false;
  if (parseBrazilianDate(value) || parseBrazilianMoney(value) !== null) return false;
  return /[a-z]{3}/i.test(value) && value.trim().split(/\s+/).length >= 2;
}

function extractClientName(clientSection: string, rows: TableRow[], fullText: string) {
  const labeled =
    findValueByLabel(clientSection, ["nome", "cliente", "razao social", "tomador"]) ??
    findValueInRows(rows, ["cliente", "nome do cliente", "razao social", "tomador"]);
  if (looksLikeClientName(labeled)) return labeled;

  const sectionCandidate = clientSection
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .find(looksLikeClientName);
  if (sectionCandidate) return sectionCandidate;

  const globalClient = findValueByLabel(fullText, ["cliente", "nome do cliente", "razao social"]);
  return looksLikeClientName(globalClient) ? globalClient : null;
}

function parseInvoiceNumber(rows: TableRow[], fullText: string) {
  const labeled = findAnyValue(rows, fullText, ["numero da fatura", "nº da fatura", "no da fatura", "fatura", "numero"])?.match(/\d+/)?.[0];
  if (labeled) return labeled;

  for (const line of fullText.split(/\n+/)) {
    const key = normalizeKey(line);
    if (!key.includes("fatura") || key.includes("referente")) continue;
    const match = key.match(/\bfatura\s+(?:n\s*o\s+|no\s+|numero\s+|num\s+)?(\d{1,10})\b/);
    if (match?.[1]) return match[1];
  }

  return null;
}

function parseTaskNumber(rows: TableRow[], fullText: string) {
  const labeled = findAnyValue(rows, fullText, ["tarefa", "numero da tarefa", "no da tarefa"])?.match(/\d+/)?.[0];
  if (labeled) return labeled;
  return normalizeKey(fullText).match(/\btarefa\s+(?:n\s*o\s+|no\s+|numero\s+|#\s*)?(\d{4,})\b/)?.[1] ?? null;
}

function isInvalidAddress(value: string | null | undefined) {
  if (!value) return true;
  const key = normalizeKey(value);
  if (/^(quantidade|valor unitario|subtotal|subtotals|produtos|servicos|resumo)(\s|$)/.test(key)) return true;
  if (!/[a-z]{3}/i.test(value)) return true;
  return !/(rua|avenida|av\b|rodovia|travessa|alameda|bairro|cep|\d{5}-?\d{3}|vitoria|vila velha|es\b)/i.test(value);
}

function headerIndex(headers: string[], labels: string[]) {
  const labelKeys = labels.map(normalizeKey);
  return headers.findIndex((header) => {
    const key = normalizeKey(header);
    return labelKeys.some((label) => key === label || key.includes(label));
  });
}

function isInvalidItemDescription(value: string | null | undefined) {
  if (!value) return true;
  const key = normalizeKey(value);
  if (/^(quantidade|valor unitario|subtotal|subtotals|total|desconto|valor total)$/.test(key)) return true;
  if (/^(?:r\$\s*)?\d+(?:[,.]\d{1,2})?$/.test(value.trim())) return true;
  return !/[a-z]{3}/i.test(value);
}

function parseItemsFromTables(tables: ReturnType<typeof extractTables>): AuvoInvoiceItem[] {
  const items: AuvoInvoiceItem[] = [];

  for (const table of tables) {
    const tableKey = normalizeKey(table.text);
    const looksLikeServiceTable = tableKey.includes("servico") || tableKey.includes("descricao");
    if (!looksLikeServiceTable) continue;

    const headerRowIndex = table.rows.findIndex((row) => {
      const headers = row.map(normalizeKey);
      return headers.some((cell) => cell.includes("quantidade")) && headers.some((cell) => cell.includes("valor"));
    });
    if (headerRowIndex < 0) continue;

    const headers = table.rows[headerRowIndex] ?? [];
    const descriptionIndex = headerIndex(headers, ["servico", "descricao"]);
    const quantityIndex = headerIndex(headers, ["quantidade", "qtd"]);
    const unitPriceIndex = headerIndex(headers, ["valor unitario", "valor unit", "unitario"]);
    const discountIndex = headerIndex(headers, ["desconto"]);
    const totalIndex = headerIndex(headers, ["valor total", "subtotal", "subtotals", "total"]);

    for (const row of table.rows.slice(headerRowIndex + 1)) {
      const rowText = normalizeText(row.join(" "));
      const rowKey = normalizeKey(rowText);
      if (!rowText || rowKey.includes("nenhum servico") || /^(subtotal|total|resumo)/.test(rowKey)) continue;

      const description =
        descriptionIndex >= 0
          ? normalizeText(row[descriptionIndex])
          : normalizeText(row.find((cell) => !parseBrazilianMoney(cell) && !parseNumber(cell)) ?? "");
      const total = totalIndex >= 0 ? parseBrazilianMoney(row[totalIndex]) : parseBrazilianMoney(rowText);
      if (isInvalidItemDescription(description) || total === null) continue;

      items.push({
        type: "service",
        description,
        quantity: quantityIndex >= 0 ? parseNumber(row[quantityIndex]) : null,
        unitPrice: unitPriceIndex >= 0 ? parseBrazilianMoney(row[unitPriceIndex]) : null,
        discount: discountIndex >= 0 ? parseBrazilianMoney(row[discountIndex]) : null,
        total,
      });
    }
  }

  return items;
}

function parseItemsFromServiceText(serviceText: string): AuvoInvoiceItem[] {
  const items: AuvoInvoiceItem[] = [];
  for (const line of serviceText.split(/\n+/).map((item) => normalizeText(item)).filter(Boolean)) {
    const total = parseBrazilianMoney(line);
    if (total === null) continue;
    const description = normalizeText(line.replace(/R\$\s*[\d.]+,\d{2}/gi, "").replace(/\s+[\d.]+,\d{2}\s*$/g, ""));
    if (isInvalidItemDescription(description)) continue;
    items.push({
      type: "service",
      description,
      quantity: null,
      unitPrice: null,
      discount: null,
      total,
    });
  }
  return items;
}

function parseItems(tables: ReturnType<typeof extractTables>, lines: string[]) {
  const tableItems = parseItemsFromTables(tables);
  if (tableItems.length) return tableItems.slice(0, 20);

  const serviceText = findSection(lines, ["servicos"]);
  return parseItemsFromServiceText(serviceText || lines.join("\n")).slice(0, 20);
}

function parseInstallments(rows: TableRow[], text: string): AuvoInvoiceInstallment[] {
  const installments: AuvoInvoiceInstallment[] = [];

  for (const row of rows) {
    const rowText = row.join(" ");
    const dueDate = parseBrazilianDate(rowText);
    const moneyCells = row.filter((cell) => /R\$|,\d{2}/i.test(cell));
    const amount = parseBrazilianMoney(moneyCells.at(-1) ?? null);
    if (!dueDate || amount === null) continue;
    const number = parseNumber(row[0]) ?? installments.length + 1;
    installments.push({ number, amount, dueDate, remainingAmount: amount });
  }

  for (const match of text.matchAll(/(?:parcela\s*)?(\d{1,2})[^\n]{0,80}?(\d{1,2}\/\d{1,2}\/\d{2,4})[^\n]{0,80}?((?:R\$\s*)?[\d.]+,\d{2})/gi)) {
    const amount = parseBrazilianMoney(match[3]);
    const dueDate = parseBrazilianDate(match[2]);
    if (amount === null || !dueDate || installments.some((item) => item.dueDate === dueDate && item.amount === amount)) continue;
    installments.push({ number: Number(match[1]), amount, dueDate, remainingAmount: amount });
  }

  return installments.slice(0, 20);
}

export function parseAuvoInvoiceHtml(html: string, sourceUrl = ""): AuvoInvoiceData {
  const rows = extractTableRows(html);
  const tables = extractTables(html);
  const lines = textLines(html);
  const text = lines.join("\n");
  const clientSection = findSection(lines, ["dados do cliente", "cliente", "tomador", "emitida para"]);
  const billingSection = findSection(lines, ["dados da cobranca", "cobranca", "pagamento", "forma de pagamento"]);
  const receiptSection = findSection(lines, ["recebimentos"]);
  const addressSection = findSection(lines, ["endereco", "endereco de servico", "endereco de cobranca"]);

  const invoiceNumber = findAnyValue(rows, text, ["numero da fatura", "nº da fatura", "fatura", "numero"])?.match(/\d+/)?.[0] ?? null;
  const taskNumber = text.match(/tarefa\s*#?\s*(\d+)/i)?.[1] ?? findAnyValue(rows, text, ["tarefa"])?.match(/\d+/)?.[0] ?? null;
  const clientName = findValueByLabel(clientSection, ["nome", "cliente", "razao social"]) ?? findValueInRows(rows, ["cliente", "razao social", "nome"]);
  const clientDocument = parseDocument(findValueByLabel(clientSection, ["cpf/cnpj", "cpf / cnpj", "cpf ou cnpj", "documento", "cpf", "cnpj"]) ?? findValueInRows(rows, ["cpf/cnpj", "cpf / cnpj", "cpf ou cnpj", "documento", "cpf", "cnpj"]));
  const clientEmail = parseEmail(findValueByLabel(clientSection, ["e-mail", "email"]));
  const clientPhone = parsePhone(findValueByLabel(clientSection, ["telefone", "celular"]));
  const resolvedInvoiceNumber = parseInvoiceNumber(rows, text) ?? invoiceNumber;
  const resolvedTaskNumber = parseTaskNumber(rows, text) ?? taskNumber;
  const resolvedClientName = extractClientName(clientSection, rows, text) ?? clientName;
  const resolvedClientDocument = parseDocument(
    findValueByLabel(clientSection, ["cpf/cnpj", "cpf / cnpj", "cpf ou cnpj", "documento", "cpf", "cnpj"]) ??
      findValueInRows(rows, ["cpf/cnpj", "cpf / cnpj", "cpf ou cnpj", "documento", "cpf", "cnpj"]) ??
      clientSection,
  );
  const resolvedClientEmail = parseEmail(findValueByLabel(clientSection, ["e-mail", "email"]) ?? clientSection) ?? clientEmail;
  const resolvedClientPhone = parsePhone(findValueByLabel(clientSection, ["telefone", "celular"]) ?? clientSection) ?? clientPhone;
  const issueDate = parseBrazilianDate(findAnyValue(rows, text, ["data de emissao", "emissao"]));
  const installments = parseInstallments(rows, receiptSection || text);
  const dueDate =
    parseBrazilianDate(findValueByLabel(billingSection, ["vencimento", "data de vencimento"]) ?? findAnyValue(rows, text, ["vencimento", "data de vencimento"])) ??
    installments.find((item) => item.dueDate)?.dueDate ??
    null;
  const total = firstParsedMoney(
    findValueByLabel(billingSection, ["valor total", "total", "valor"]),
    findAnyValue(rows, text, ["valor total", "total"]),
    findAnyValue(rows, text, ["valor"]),
  );
  const remainingAmount = parseBrazilianMoney(findAnyValue(rows, text, ["valor restante", "restante"]));
  const serviceAddress =
    findValueByLabel(addressSection, ["endereco de servico", "endereco do servico", "endereco"]) ??
    findValueByLabel(clientSection, ["endereco de servico", "endereco do servico", "endereco"]) ??
    firstSectionValue(addressSection) ??
    findAnyValue(rows, text, ["endereco de servico", "endereco do servico"]);
  const billingAddress =
    findValueByLabel(addressSection, ["endereco de cobranca"]) ??
    findValueByLabel(clientSection, ["endereco de cobranca", "endereco"]) ??
    findAnyValue(rows, text, ["endereco de cobranca"]);
  const items = parseItems(tables, lines);
  const warnings: string[] = [];

  if (!resolvedInvoiceNumber) warnings.push("Numero da fatura nao encontrado.");
  if (!resolvedClientName || isProviderText(resolvedClientName)) warnings.push("Cliente nao encontrado.");
  if (!dueDate) warnings.push("Vencimento nao encontrado.");
  if (total === null) warnings.push("Valor total nao encontrado.");
  if (items.length && total !== null) {
    const sum = Math.round(items.reduce((amount, item) => amount + item.total, 0) * 100) / 100;
    if (Math.abs(sum - total) > 0.01) warnings.push("Soma dos servicos diferente do total da fatura. Confira os valores antes de criar a conta.");
  }

  return {
    source: "auvo",
    sourceUrl,
    externalId: parseExternalId(sourceUrl),
    invoiceNumber: resolvedInvoiceNumber,
    taskNumber: resolvedTaskNumber,
    subject: findAnyValue(rows, text, ["assunto"]) ?? (resolvedTaskNumber ? `Servicos prestados a Tarefa #${resolvedTaskNumber}` : null),
    status: findAnyValue(rows, text, ["status"]),
    client: {
      name: resolvedClientName && !isProviderText(resolvedClientName) ? resolvedClientName : null,
      document: resolvedClientDocument ?? clientDocument,
      email: resolvedClientEmail,
      phone: resolvedClientPhone,
    },
    issueDate,
    dueDate,
    serviceAddress: isInvalidAddress(serviceAddress) ? null : serviceAddress,
    billingAddress: isInvalidAddress(billingAddress) ? null : billingAddress,
    paymentMethod: findValueByLabel(billingSection, ["forma de pagamento", "condicao de pagamento", "pagamento"]) ?? findAnyValue(rows, text, ["forma de pagamento", "condicao de pagamento", "pagamento"]),
    installments,
    items,
    subtotal: parseBrazilianMoney(findAnyValue(rows, text, ["subtotal"])),
    discount: parseBrazilianMoney(findAnyValue(rows, text, ["desconto"])),
    additionalCosts: parseBrazilianMoney(findAnyValue(rows, text, ["acrescimos", "custos adicionais"])),
    total,
    remainingAmount,
    notes: findAnyValue(rows, text, ["observacao", "observacoes"]),
    documents: [],
    warnings,
  };
}
