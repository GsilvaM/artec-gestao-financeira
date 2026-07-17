export interface AuvoInvoiceItem {
  type: "service" | "product";
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  discount: number | null;
  total: number;
}

export interface AuvoInvoiceInstallment {
  number: number;
  amount: number;
  dueDate: string | null;
  remainingAmount: number | null;
}

export interface AuvoInvoiceData {
  source: "auvo";
  sourceUrl: string;
  externalId: string | null;
  invoiceNumber: string | null;
  taskNumber: string | null;
  subject: string | null;
  status: string | null;
  client: {
    name: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
  };
  issueDate: string | null;
  dueDate: string | null;
  serviceAddress: string | null;
  billingAddress: string | null;
  paymentMethod: string | null;
  installments: AuvoInvoiceInstallment[];
  items: AuvoInvoiceItem[];
  subtotal: number | null;
  discount: number | null;
  additionalCosts: number | null;
  total: number | null;
  remainingAmount: number | null;
  notes: string | null;
  documents: string[];
  warnings: string[];
}

export interface AuvoRevenueAllocation {
  type: "service" | "product";
  categoryId: string;
  amount: number;
}

export interface AuvoDuplicateCandidate {
  id: string;
  description: string;
  client: string | null;
  amount: number;
  dueDate: string;
  status: string;
  reason: string;
}

export interface AuvoImportPreview {
  invoice: AuvoInvoiceData;
  duplicates: AuvoDuplicateCandidate[];
}

export interface BillingDocumentItem {
  label: string;
  checked: boolean;
}

export interface BillingReportItem {
  date: string;
  url: string;
  label: string;
}

export interface BillingEmailData {
  recipientEmail: string | null;
  ccEmail?: string | null;
  clientName: string;
  clientDocument?: string | null;
  invoiceNumber?: string | null;
  issueDate?: string | null;
  dueDate: string;
  amount: number;
  paymentMethod?: string | null;
  serviceAddress?: string | null;
  billingAddress?: string | null;
  subject?: string | null;
  greeting?: string | null;
  openingText: string;
  paymentText: string;
  closingText: string;
  services: AuvoInvoiceItem[];
  documents: BillingDocumentItem[];
  reports: BillingReportItem[];
  sender: {
    name: string;
    role: string;
    company: string;
    email: string;
    phone: string;
    city: string;
    document: string;
  };
  logoUrl: string;
}

export interface BillingEmailResult {
  subject: string;
  html: string;
  text: string;
}

export const AUVO_METADATA_START = "[auvoImport]";
export const AUVO_METADATA_END = "[/auvoImport]";
export const AUVO_REVENUE_ALLOCATIONS_START = "[auvoRevenueAllocations]";
export const AUVO_REVENUE_ALLOCATIONS_END = "[/auvoRevenueAllocations]";

export function buildAuvoMetadataBlock(data: AuvoInvoiceData) {
  const lines = [
    AUVO_METADATA_START,
    `invoiceNumber=${data.invoiceNumber ?? ""}`,
    `externalId=${data.externalId ?? ""}`,
    `sourceUrl=${data.sourceUrl}`,
    `issueDate=${data.issueDate ?? ""}`,
    `dueDate=${data.dueDate ?? ""}`,
    `document=${data.client.document ?? ""}`,
    AUVO_METADATA_END,
  ];
  return lines.join("\n");
}

export function buildAuvoRevenueAllocationsBlock(allocations: AuvoRevenueAllocation[]) {
  const payload = allocations
    .filter((allocation) => allocation.categoryId && allocation.amount > 0)
    .map((allocation) => ({
      type: allocation.type,
      categoryId: allocation.categoryId,
      amount: Math.round(allocation.amount * 100) / 100,
    }));

  if (!payload.length) return "";
  return [
    AUVO_REVENUE_ALLOCATIONS_START,
    JSON.stringify(payload),
    AUVO_REVENUE_ALLOCATIONS_END,
  ].join("\n");
}

export function appendAuvoMetadata(
  humanNotes: string | null | undefined,
  data: AuvoInvoiceData,
  allocations: AuvoRevenueAllocation[] = [],
) {
  const text = humanNotes?.trim();
  return [text || null, buildAuvoMetadataBlock(data), buildAuvoRevenueAllocationsBlock(allocations) || null]
    .filter(Boolean)
    .join("\n\n");
}

export function stripAuvoMetadata(notes: string | null | undefined) {
  if (!notes) return "";
  const start = notes.indexOf(AUVO_METADATA_START);
  const end = notes.indexOf(AUVO_METADATA_END);
  if (start < 0 || end < start) return notes.trim();
  return `${notes.slice(0, start)}${notes.slice(end + AUVO_METADATA_END.length)}`.trim();
}

export function readAuvoMetadata(notes: string | null | undefined) {
  if (!notes) return {};
  const start = notes.indexOf(AUVO_METADATA_START);
  const end = notes.indexOf(AUVO_METADATA_END);
  if (start < 0 || end < start) return {};
  const block = notes.slice(start + AUVO_METADATA_START.length, end);
  return block.split(/\r?\n/).reduce<Record<string, string>>((metadata, rawLine) => {
    const line = rawLine.trim();
    if (!line) return metadata;
    const separator = line.indexOf("=");
    if (separator < 0) return metadata;
    metadata[line.slice(0, separator)] = line.slice(separator + 1);
    return metadata;
  }, {});
}

export function readAuvoRevenueAllocations(notes: string | null | undefined): AuvoRevenueAllocation[] {
  if (!notes) return [];
  const start = notes.indexOf(AUVO_REVENUE_ALLOCATIONS_START);
  const end = notes.indexOf(AUVO_REVENUE_ALLOCATIONS_END);
  if (start < 0 || end < start) return [];
  const block = notes.slice(start + AUVO_REVENUE_ALLOCATIONS_START.length, end).trim();
  if (!block) return [];

  try {
    const parsed: unknown = JSON.parse(block);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<AuvoRevenueAllocation[]>((allocations, item) => {
      if (!item || typeof item !== "object") return allocations;
      const current = item as Record<string, unknown>;
      const type = current.type === "product" ? "product" : current.type === "service" ? "service" : null;
      const categoryId = typeof current.categoryId === "string" ? current.categoryId : "";
      const amount = typeof current.amount === "number" ? current.amount : Number(current.amount);
      if (!type || !categoryId || !Number.isFinite(amount) || amount <= 0) return allocations;
      allocations.push({ type, categoryId, amount: Math.round(amount * 100) / 100 });
      return allocations;
    }, []);
  } catch {
    return [];
  }
}
