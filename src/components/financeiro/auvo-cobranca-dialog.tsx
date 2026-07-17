import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, ExternalLink, FileInput, Link2, Mail, Plus, RefreshCcw, UserPlus } from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_BILLING_DOCUMENTS,
  DEFAULT_BILLING_TEXTS,
  generateBillingEmail,
} from "@/domain/financeiro/billing-email";
import {
  appendAuvoMetadata,
  readAuvoMetadata,
  stripAuvoMetadata,
} from "@/domain/financeiro/auvo-cobranca";
import type { AccountReceivableRow } from "@/domain/financeiro/types";
import type {
  AuvoInvoiceData,
  AuvoImportPreview,
  BillingDocumentItem,
  BillingEmailData,
  BillingReportItem,
} from "@/domain/financeiro/auvo-cobranca";
import { useImportAuvoInvoice } from "@/domain/financeiro/hooks/use-auvo-cobranca";
import { useCreateAccountReceivable } from "@/domain/financeiro/hooks/use-accounts";
import { useCategories } from "@/domain/financeiro/hooks/use-categories";
import { useCostCenters } from "@/domain/financeiro/hooks/use-cost-centers";
import { useCreateCustomer, useCustomers } from "@/domain/financeiro/hooks/use-customers";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { formatDate, formatMoney, parseMoneyInput } from "@/lib/utils";
import type { CustomerRow } from "@/domain/financeiro/types";

const TITAN_URL = "https://web.titan.email/";

export type EmailSource =
  | { kind: "auvo"; invoice: AuvoInvoiceData; accountId?: string }
  | { kind: "account"; account: AccountReceivableRow };

interface AuvoCobrancaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailSource: EmailSource | null;
  onEmailSourceChange: (source: EmailSource | null) => void;
}

interface ReviewState {
  invoiceNumber: string;
  subject: string;
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  clientPhone: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  paymentMethod: string;
  serviceAddress: string;
  billingAddress: string;
  description: string;
  notes: string;
  serviceCategoryId: string;
  productCategoryId: string;
  serviceAmount: string;
  productAmount: string;
  costCenterId: string;
}

type ReviewFieldStatus = "found" | "missing" | "reviewed";

function toDateInput(value: string | null | undefined) {
  return value?.slice(0, 10) ?? "";
}

function suggestedDescription(invoice: AuvoInvoiceData) {
  const client = invoice.client.name ?? "Cliente";
  return invoice.invoiceNumber ? `Fatura nº ${invoice.invoiceNumber} - ${client}` : `Cobranca - ${client}`;
}

function moneyInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function getInvoiceItemTotal(invoice: AuvoInvoiceData, type: "service" | "product") {
  return roundMoney(invoice.items.filter((item) => item.type === type).reduce((total, item) => total + item.total, 0));
}

function getDefaultRevenueAmounts(invoice: AuvoInvoiceData) {
  const invoiceAmount = invoice.remainingAmount ?? invoice.total ?? 0;
  const serviceAmount = getInvoiceItemTotal(invoice, "service");
  const productAmountFromItems = getInvoiceItemTotal(invoice, "product");
  const productAmount = productAmountFromItems > 0
    ? productAmountFromItems
    : serviceAmount > 0 && invoiceAmount > serviceAmount
      ? roundMoney(invoiceAmount - serviceAmount)
      : 0;

  return {
    serviceAmount: serviceAmount > 0 ? serviceAmount : invoiceAmount,
    productAmount,
  };
}

function buildReviewState(invoice: AuvoInvoiceData): ReviewState {
  const revenueAmounts = getDefaultRevenueAmounts(invoice);
  return {
    invoiceNumber: invoice.invoiceNumber ?? "",
    subject: invoice.subject ?? "",
    clientName: invoice.client.name ?? "",
    clientDocument: invoice.client.document ?? "",
    clientEmail: invoice.client.email ?? "",
    clientPhone: invoice.client.phone ?? "",
    issueDate: toDateInput(invoice.issueDate),
    dueDate: toDateInput(invoice.dueDate),
    amount: moneyInput(invoice.remainingAmount ?? invoice.total),
    paymentMethod: invoice.paymentMethod ?? "",
    serviceAddress: invoice.serviceAddress ?? "",
    billingAddress: invoice.billingAddress ?? "",
    description: suggestedDescription(invoice),
    notes: invoice.notes ?? "Servicos referentes a fatura importada do Auvo.",
    serviceCategoryId: "",
    productCategoryId: "",
    serviceAmount: moneyInput(revenueAmounts.serviceAmount),
    productAmount: revenueAmounts.productAmount > 0 ? moneyInput(revenueAmounts.productAmount) : "",
    costCenterId: "",
  };
}

function buildInvoiceFromReview(base: AuvoInvoiceData, review: ReviewState): AuvoInvoiceData {
  const amount = parseMoneyInput(review.amount);
  return {
    ...base,
    invoiceNumber: review.invoiceNumber.trim() || null,
    subject: review.subject.trim() || null,
    client: {
      name: review.clientName.trim() || null,
      document: review.clientDocument.trim() || null,
      email: review.clientEmail.trim() || null,
      phone: review.clientPhone.trim() || null,
    },
    issueDate: review.issueDate || null,
    dueDate: review.dueDate || null,
    total: Number.isFinite(amount) ? amount : base.total,
    remainingAmount: Number.isFinite(amount) ? amount : base.remainingAmount,
    paymentMethod: review.paymentMethod.trim() || null,
    serviceAddress: review.serviceAddress.trim() || null,
    billingAddress: review.billingAddress.trim() || null,
    notes: review.notes.trim() || null,
  };
}

function getLogoUrl() {
  if (typeof window === "undefined") return "https://artecclimatizados.com.br/artec-logo-email.svg";
  const origin = window.location.origin;
  return origin.startsWith("https://")
    ? `${origin}/artec-logo-email.svg`
    : "https://artecclimatizados.com.br/artec-logo-email.svg";
}

function defaultDocuments(): BillingDocumentItem[] {
  return DEFAULT_BILLING_DOCUMENTS.map((label) => ({
    label,
    checked: ["Nota fiscal", "XML", "Boleto"].includes(label),
  }));
}

function buildEmailData(source: EmailSource, documents: BillingDocumentItem[], reports: BillingReportItem[], overrides: {
  recipientEmail: string;
  ccEmail: string;
  subject: string;
  greeting: string;
  openingText: string;
  paymentText: string;
  closingText: string;
  senderName: string;
}): BillingEmailData {
  if (source.kind === "auvo") {
    const invoice = source.invoice;
    const amount = invoice.remainingAmount ?? invoice.total ?? 0;
    const clientName = invoice.client.name ?? "Cliente";
    return {
      recipientEmail: overrides.recipientEmail.trim() || invoice.client.email,
      ccEmail: overrides.ccEmail.trim() || null,
      clientName,
      clientDocument: invoice.client.document,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate ?? new Date().toISOString().slice(0, 10),
      amount,
      paymentMethod: invoice.paymentMethod,
      serviceAddress: invoice.serviceAddress,
      billingAddress: invoice.billingAddress,
      subject: overrides.subject.trim() || null,
      greeting: overrides.greeting.trim() || null,
      openingText: overrides.openingText,
      paymentText: overrides.paymentText,
      closingText: overrides.closingText,
      services: invoice.items,
      documents,
      reports,
      logoUrl: getLogoUrl(),
      sender: {
        name: overrides.senderName.trim() || "Gabriel",
        role: "Financeiro",
        company: "Artec Ambientes Climatizados",
        email: "contato@artecclimatizados.com.br",
        phone: "(27) 99844-1989",
        city: "Vila Velha - ES",
        document: "27.859.657/0001-65",
      },
    };
  }

  const account = source.account;
  const metadata = readAuvoMetadata(account.notes);
  const humanNotes = stripAuvoMetadata(account.notes);
  return {
    recipientEmail: overrides.recipientEmail.trim() || null,
    ccEmail: overrides.ccEmail.trim() || null,
    clientName: account.client ?? "Cliente",
    clientDocument: metadata.document || null,
    invoiceNumber: metadata.invoiceNumber || null,
    issueDate: metadata.issueDate || null,
    dueDate: account.dueDate.slice(0, 10),
    amount: account.amount,
    paymentMethod: null,
    serviceAddress: null,
    billingAddress: null,
    subject: overrides.subject.trim() || null,
    greeting: overrides.greeting.trim() || null,
    openingText: humanNotes || overrides.openingText,
    paymentText: overrides.paymentText,
    closingText: overrides.closingText,
    services: [],
    documents,
    reports,
    logoUrl: getLogoUrl(),
    sender: {
      name: overrides.senderName.trim() || "Gabriel",
      role: "Financeiro",
      company: "Artec Ambientes Climatizados",
      email: "contato@artecclimatizados.com.br",
      phone: "(27) 99844-1989",
      city: "Vila Velha - ES",
      document: "27.859.657/0001-65",
    },
  };
}

async function copyRichEmail(html: string, text: string) {
  if ("ClipboardItem" in window && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]);
    return;
  }

  const element = document.createElement("textarea");
  element.value = text;
  element.style.position = "fixed";
  element.style.left = "-9999px";
  document.body.appendChild(element);
  element.focus();
  element.select();
  document.execCommand("copy");
  document.body.removeChild(element);
}

async function copyText(value: string, message: string) {
  await navigator.clipboard.writeText(value);
  toast.success(message);
}

function normalizeReviewValue(value: string | null | undefined) {
  return (value ?? "").trim();
}

function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function mergeCustomerIntoReview(review: ReviewState, customer: CustomerRow): ReviewState {
  return {
    ...review,
    clientName: review.clientName.trim() || customer.name,
    clientDocument: review.clientDocument.trim() || (customer.document ?? ""),
    clientEmail: review.clientEmail.trim() || (customer.email ?? ""),
    clientPhone: review.clientPhone.trim() || (customer.phone ?? ""),
    serviceAddress: review.serviceAddress.trim() || (customer.address ?? ""),
    billingAddress: review.billingAddress.trim() || (customer.address ?? ""),
  };
}

function fieldStatus(extracted: string | number | null | undefined, current: string): ReviewFieldStatus {
  const currentValue = normalizeReviewValue(current);
  const extractedValue = extracted === null || extracted === undefined ? "" : String(extracted).trim();
  if (!extractedValue) return currentValue ? "reviewed" : "missing";
  return currentValue && currentValue !== extractedValue ? "reviewed" : "found";
}

function amountStatus(invoice: AuvoInvoiceData, current: string): ReviewFieldStatus {
  const extracted = invoice.remainingAmount ?? invoice.total;
  const parsed = parseMoneyInput(current);
  if (extracted === null || extracted === undefined) return Number.isFinite(parsed) ? "reviewed" : "missing";
  return Number.isFinite(parsed) && Math.abs(parsed - extracted) > 0.01 ? "reviewed" : "found";
}

function buildRevenueAllocations(review: ReviewState) {
  const serviceAmount = parseMoneyInput(review.serviceAmount);
  const productAmount = parseMoneyInput(review.productAmount);
  return [
    Number.isFinite(serviceAmount) && serviceAmount > 0
      ? { type: "service" as const, categoryId: review.serviceCategoryId, amount: serviceAmount }
      : null,
    Number.isFinite(productAmount) && productAmount > 0
      ? { type: "product" as const, categoryId: review.productCategoryId, amount: productAmount }
      : null,
  ].filter((allocation): allocation is { type: "service" | "product"; categoryId: string; amount: number } => Boolean(allocation));
}

function FieldStatus({ status }: { status: ReviewFieldStatus }) {
  if (status === "reviewed") return <Badge variant="default">Revisado</Badge>;
  if (status === "found") return <Badge variant="success">Encontrado</Badge>;
  return <Badge variant="warning">Nao encontrado</Badge>;
}

export function AuvoCobrancaDialog({
  open,
  onOpenChange,
  emailSource,
  onEmailSourceChange,
}: AuvoCobrancaDialogProps) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<AuvoImportPreview | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [documents, setDocuments] = useState(defaultDocuments);
  const [reports, setReports] = useState<BillingReportItem[]>([]);
  const [reportUrl, setReportUrl] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [greeting, setGreeting] = useState("");
  const [openingText, setOpeningText] = useState(DEFAULT_BILLING_TEXTS.opening);
  const [paymentText, setPaymentText] = useState(DEFAULT_BILLING_TEXTS.payment);
  const [closingText, setClosingText] = useState(DEFAULT_BILLING_TEXTS.closing);
  const [senderName, setSenderName] = useState("Gabriel");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [createMissingCustomer, setCreateMissingCustomer] = useState(true);
  const [appliedCustomerId, setAppliedCustomerId] = useState("");

  const user = useAuthStore((state) => state.user);
  const { data: categories } = useCategories({ type: "receita" });
  const { data: costCenters } = useCostCenters();
  const customerFilters = useMemo(() => {
    if (!review) return undefined;
    const document = onlyDigits(review.clientDocument);
    if (document) return { document };
    const search = review.clientName.trim();
    return search ? { search } : undefined;
  }, [review]);
  const { data: customers } = useCustomers(customerFilters);
  const importMutation = useImportAuvoInvoice();
  const createMutation = useCreateAccountReceivable();
  const createCustomerMutation = useCreateCustomer();
  const matchingCustomer = useMemo(() => {
    if (!review || !customers?.length) return null;
    const document = onlyDigits(review.clientDocument);
    if (document) {
      const byDocument = customers.find((customer) => onlyDigits(customer.document) === document);
      if (byDocument) return byDocument;
    }
    const name = review.clientName.trim().toLowerCase();
    return name ? customers.find((customer) => customer.name.trim().toLowerCase() === name) ?? null : null;
  }, [customers, review]);

  const currentEmailSource = useMemo(
    () =>
      emailSource ??
      (preview && review
        ? { kind: "auvo" as const, invoice: buildInvoiceFromReview(preview.invoice, review) }
        : null),
    [emailSource, preview, review],
  );
  const emailData = useMemo(
    () =>
      currentEmailSource
        ? buildEmailData(currentEmailSource, documents, reports, {
            recipientEmail,
            ccEmail,
            subject: emailSubject,
            greeting,
            openingText,
            paymentText,
            closingText,
            senderName,
          })
        : null,
    [ccEmail, closingText, currentEmailSource, documents, emailSubject, greeting, openingText, paymentText, recipientEmail, reports, senderName],
  );
  const generatedEmail = emailData ? generateBillingEmail(emailData) : null;

  useEffect(() => {
    if (!matchingCustomer || !review || appliedCustomerId === matchingCustomer.id) return;
    setSelectedCustomerId(matchingCustomer.id);
    setCreateMissingCustomer(false);
    setAppliedCustomerId(matchingCustomer.id);
    setReview(mergeCustomerIntoReview(review, matchingCustomer));
  }, [appliedCustomerId, matchingCustomer, review]);

  function resetAll() {
    setUrl("");
    setPreview(null);
    setReview(null);
    setDocuments(defaultDocuments());
    setReports([]);
    setReportUrl("");
    setReportDate("");
    setRecipientEmail("");
    setCcEmail("");
    setEmailSubject("");
    setGreeting("");
    setOpeningText(DEFAULT_BILLING_TEXTS.opening);
    setPaymentText(DEFAULT_BILLING_TEXTS.payment);
    setClosingText(DEFAULT_BILLING_TEXTS.closing);
    setSenderName("Gabriel");
    setSelectedCustomerId("");
    setCreateMissingCustomer(true);
    setAppliedCustomerId("");
    onEmailSourceChange(null);
  }

  async function handleImport() {
    try {
      const data = await importMutation.mutateAsync(url);
      setPreview(data);
      setReview(buildReviewState(data.invoice));
      setRecipientEmail(data.invoice.client.email ?? "");
      setEmailSubject(`Documentos financeiros - Fatura nº ${data.invoice.invoiceNumber ?? "sem numero"} - ${data.invoice.client.name ?? "Cliente"}`);
      setSelectedCustomerId("");
      setCreateMissingCustomer(true);
      setAppliedCustomerId("");
      toast.success(data.invoice.warnings.length ? "Dados encontrados parcialmente. Revise antes de criar." : "Dados do Auvo encontrados.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar dados do Auvo.");
    }
  }

  async function handleCreateAccount() {
    if (!review || !preview) return;
    const amount = parseMoneyInput(review.amount);
    if (!review.description.trim()) {
      toast.error("Informe a descricao da conta.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor valido.");
      return;
    }
    if (!review.dueDate) {
      toast.error("Informe o vencimento.");
      return;
    }
    const revenueAllocations = buildRevenueAllocations(review);
    const allocationTotal = roundMoney(revenueAllocations.reduce((total, allocation) => total + allocation.amount, 0));
    if (!revenueAllocations.length) {
      toast.error("Informe ao menos um valor de receita.");
      return;
    }
    if (Math.abs(allocationTotal - amount) > 0.01) {
      toast.error("A soma de produtos e servicos precisa fechar com o valor da fatura.");
      return;
    }
    const missingCategory = revenueAllocations.find((allocation) => !allocation.categoryId);
    if (missingCategory) {
      toast.error(missingCategory.type === "product" ? "Selecione a categoria de receita de produtos." : "Selecione a categoria de receita de servicos.");
      return;
    }
    const primaryAllocation = revenueAllocations[0];
    if (!primaryAllocation) {
      toast.error("Informe a composicao da receita.");
      return;
    }
    if (!user) {
      toast.error("Usuario nao autenticado.");
      return;
    }

    const invoice = buildInvoiceFromReview(preview.invoice, review);
    try {
      let customerId = selectedCustomerId;
      if (!customerId && createMissingCustomer && review.clientName.trim()) {
        const createdCustomer = await createCustomerMutation.mutateAsync({
          name: review.clientName.trim(),
          document: review.clientDocument.trim() || null,
          email: review.clientEmail.trim() || null,
          phone: review.clientPhone.trim() || null,
          address: review.serviceAddress.trim() || review.billingAddress.trim() || null,
          notes: "Cliente criado a partir da importacao de fatura do Auvo.",
          active: true,
        }) as { id?: string };
        customerId = createdCustomer.id ?? "";
        setSelectedCustomerId(customerId);
      }
      const created = await createMutation.mutateAsync({
        description: review.description.trim(),
        amount,
        dueDate: new Date(`${review.dueDate}T00:00:00`),
        status: "pending",
        categoryId: primaryAllocation.categoryId,
        costCenterId: review.costCenterId || undefined,
        client: review.clientName.trim() || undefined,
        notes: appendAuvoMetadata(review.notes, invoice, revenueAllocations),
        userId: user.id,
      });
      onEmailSourceChange({ kind: "auvo", invoice, accountId: (created as { id?: string }).id });
      toast.success(customerId ? "Cliente vinculado e conta a receber criada. Agora revise o e-mail." : "Conta a receber criada. Agora revise e prepare o e-mail de cobranca.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta a receber.");
    }
  }

  async function handleCopyBody() {
    if (!generatedEmail) return;
    await copyRichEmail(generatedEmail.html, generatedEmail.text);
    toast.success("Corpo do e-mail copiado. Cole no Titan e anexe os documentos.");
  }

  async function handleOpenTitan() {
    if (!emailData || !generatedEmail) return;
    if (!emailData.recipientEmail) {
      toast.error("Informe o destinatario antes de abrir o Titan.");
      return;
    }
    if (!generatedEmail.subject.trim()) {
      toast.error("Informe o assunto antes de abrir o Titan.");
      return;
    }
    if (!documents.some((item) => item.checked)) {
      toast.error("Marque ao menos um documento para anexar.");
      return;
    }
    const tab = window.open("about:blank", "_blank", "noopener,noreferrer");
    await copyRichEmail(generatedEmail.html, generatedEmail.text);
    if (tab) tab.location.href = TITAN_URL;
    else window.open(TITAN_URL, "_blank", "noopener,noreferrer");
    toast.success("O corpo do e-mail foi copiado. No Titan, crie uma nova mensagem, informe o destinatario, cole o conteudo e anexe os documentos.");
  }

  function addReport() {
    if (!reportUrl.trim() || !reportDate) {
      toast.error("Informe data e link HTTPS do relatorio.");
      return;
    }
    try {
      const parsed = new URL(reportUrl);
      if (parsed.protocol !== "https:") throw new Error("invalid");
      setReports((items) => [...items, { date: reportDate, url: parsed.toString(), label: "Ver relatorio do servico" }]);
      setReportUrl("");
      setReportDate("");
    } catch {
      toast.error("Use um link HTTPS valido para o relatorio.");
    }
  }

  const showingEmail = Boolean(emailSource);
  const showingReview = Boolean(preview && review && !emailSource);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAll();
        onOpenChange(next);
      }}
    >
      <DialogContent className="relative max-w-4xl">
        <DialogCloseButton
          onClick={() => {
            resetAll();
            onOpenChange(false);
          }}
        />
        <DialogHeader>
          <DialogTitle>{showingEmail ? "Preparar e-mail de cobranca" : "Importar cobranca do Auvo"}</DialogTitle>
          <DialogDescription>
            {showingEmail
              ? "Revise o corpo do e-mail, copie o conteudo e envie manualmente pelo Titan."
              : "Cole o link publico da fatura para buscar os dados e preparar a conta a receber."}
          </DialogDescription>
        </DialogHeader>

        {!showingReview && !showingEmail ? (
          <div className="grid gap-4">
            <Field label="Link da fatura do Auvo">
              <Input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://app.auvo.com.br/informacoes/ObtenhaFaturaHTML/..."
              />
            </Field>
          </div>
        ) : null}

        {showingReview && review && preview ? (
          <div className="grid gap-5">
            {preview.duplicates.length ? (
              <div className="rounded-[var(--radius-field)] border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
                Possivel duplicidade encontrada: {preview.duplicates.map((item) => item.description).join(", ")}.
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Fatura">
                <Input value={review.invoiceNumber} onChange={(e) => setReview({ ...review, invoiceNumber: e.target.value })} />
              </Field>
              <Field label="Emissao">
                <Input type="date" value={review.issueDate} onChange={(e) => setReview({ ...review, issueDate: e.target.value })} />
              </Field>
              <Field label="Vencimento">
                <Input type="date" value={review.dueDate} onChange={(e) => setReview({ ...review, dueDate: e.target.value })} />
              </Field>
              <Field label="Cliente">
                <Input value={review.clientName} onChange={(e) => setReview({ ...review, clientName: e.target.value })} />
              </Field>
              <Field label="CPF/CNPJ">
                <Input value={review.clientDocument} onChange={(e) => setReview({ ...review, clientDocument: e.target.value })} />
              </Field>
              <Field label="E-mail">
                <Input value={review.clientEmail} onChange={(e) => setReview({ ...review, clientEmail: e.target.value })} />
              </Field>
              <Field label="Telefone">
                <Input value={review.clientPhone} onChange={(e) => setReview({ ...review, clientPhone: e.target.value })} />
              </Field>
              <Field label="Valor">
                <Input value={review.amount} inputMode="decimal" onChange={(e) => setReview({ ...review, amount: e.target.value })} />
              </Field>
              <Field label="Pagamento">
                <Input value={review.paymentMethod} onChange={(e) => setReview({ ...review, paymentMethod: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface-muted p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Cliente no sistema</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Use um cadastro existente para preencher contato ou crie um novo junto com a conta.
                  </p>
                </div>
                {matchingCustomer || selectedCustomerId ? (
                  <Badge variant="success"><CheckCircle2 className="size-3.5" />Cliente encontrado</Badge>
                ) : (
                  <Badge variant="warning"><UserPlus className="size-3.5" />Novo cliente</Badge>
                )}
              </div>
              {customers?.length ? (
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <Field label="Selecionar cliente existente">
                    <Select
                      value={selectedCustomerId}
                      onChange={(event) => {
                        const customer = customers.find((item) => item.id === event.target.value);
                        setSelectedCustomerId(event.target.value);
                        setCreateMissingCustomer(false);
                        if (customer) {
                          setAppliedCustomerId(customer.id);
                          setReview(mergeCustomerIntoReview(review, customer));
                        }
                      }}
                      options={customers.slice(0, 8).map((customer) => ({
                        value: customer.id,
                        label: [customer.name, customer.document, customer.email].filter(Boolean).join(" - "),
                      }))}
                      placeholder="Nenhum cliente selecionado"
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSelectedCustomerId("");
                      setCreateMissingCustomer(true);
                      setAppliedCustomerId("");
                    }}
                  >
                    <UserPlus className="size-4" />
                    Criar novo
                  </Button>
                </div>
              ) : null}
              {!selectedCustomerId ? (
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={createMissingCustomer}
                    onChange={(event) => setCreateMissingCustomer(event.target.checked)}
                  />
                  Criar cliente com os dados revisados da fatura
                </label>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Assunto">
                <Input value={review.subject} onChange={(e) => setReview({ ...review, subject: e.target.value })} />
              </Field>
              <Field label="Descricao da conta">
                <Input value={review.description} onChange={(e) => setReview({ ...review, description: e.target.value })} />
              </Field>
              <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface-muted p-4 md:col-span-2">
                <div>
                  <p className="text-sm font-bold text-foreground">Composicao da receita</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    A fatura fica em uma conta unica; no recebimento, o sistema separa os lancamentos por categoria.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Receita de servicos">
                    <Select
                      value={review.serviceCategoryId}
                      onChange={(e) => setReview({ ...review, serviceCategoryId: e.target.value })}
                      options={(categories ?? []).map((category) => ({ value: category.id, label: category.name }))}
                      placeholder="Categoria de servicos"
                    />
                  </Field>
                  <Field label="Valor de servicos">
                    <Input
                      value={review.serviceAmount}
                      inputMode="decimal"
                      onChange={(e) => setReview({ ...review, serviceAmount: e.target.value })}
                    />
                  </Field>
                  <Field label="Receita de produtos">
                    <Select
                      value={review.productCategoryId}
                      onChange={(e) => setReview({ ...review, productCategoryId: e.target.value })}
                      options={(categories ?? []).map((category) => ({ value: category.id, label: category.name }))}
                      placeholder="Categoria de produtos"
                    />
                  </Field>
                  <Field label="Valor de produtos">
                    <Input
                      value={review.productAmount}
                      inputMode="decimal"
                      onChange={(e) => setReview({ ...review, productAmount: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="rounded-[var(--radius-field)] border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Total informado: {formatMoney(roundMoney(buildRevenueAllocations(review).reduce((total, allocation) => total + allocation.amount, 0)))} de {formatMoney(parseMoneyInput(review.amount) || 0)}
                </div>
              </div>
              <Field label="Centro de custo">
                <Select
                  value={review.costCenterId}
                  onChange={(e) => setReview({ ...review, costCenterId: e.target.value })}
                  options={(costCenters ?? []).map((center) => ({ value: center.id, label: center.code ? `${center.code} - ${center.name}` : center.name }))}
                  placeholder="Sem centro"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Endereco de servico">
                  <Input value={review.serviceAddress} onChange={(e) => setReview({ ...review, serviceAddress: e.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Observacoes internas">
                  <Textarea value={review.notes} onChange={(e) => setReview({ ...review, notes: e.target.value })} />
                </Field>
              </div>
            </div>
            <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface-muted p-4">
              <p className="text-sm font-bold text-foreground">Conferencia da importacao</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Fatura", fieldStatus(preview.invoice.invoiceNumber, review.invoiceNumber)],
                  ["Cliente", fieldStatus(preview.invoice.client.name, review.clientName)],
                  ["CPF/CNPJ", fieldStatus(preview.invoice.client.document, review.clientDocument)],
                  ["Emissao", fieldStatus(toDateInput(preview.invoice.issueDate), review.issueDate)],
                  ["Vencimento", fieldStatus(toDateInput(preview.invoice.dueDate), review.dueDate)],
                  ["Valor", amountStatus(preview.invoice, review.amount)],
                  ["Pagamento", fieldStatus(preview.invoice.paymentMethod, review.paymentMethod)],
                  ["E-mail", fieldStatus(preview.invoice.client.email, review.clientEmail)],
                  ["Telefone", fieldStatus(preview.invoice.client.phone, review.clientPhone)],
                  ["Endereco", fieldStatus(preview.invoice.serviceAddress, review.serviceAddress)],
                ].map(([label, status]) => (
                  <div key={label} className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-field)] border border-border bg-surface px-3 py-2 text-sm">
                    <span className="min-w-0 font-semibold text-foreground">{label}</span>
                    <FieldStatus status={status as ReviewFieldStatus} />
                  </div>
                ))}
              </div>
              {preview.invoice.items.length ? (
                <div className="grid gap-2 text-sm">
                  <p className="mt-2 text-sm font-bold text-foreground">Itens encontrados</p>
                  {preview.invoice.items.slice(0, 6).map((item) => (
                    <div key={`${item.description}-${item.total}`} className="grid gap-1 rounded-[var(--radius-field)] border border-border bg-surface px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <span className="min-w-0 text-muted-foreground">
                        <Badge variant="outline" className="mr-2 align-middle">{item.type === "product" ? "Produto" : "Servico"}</Badge>
                        {item.description}
                      </span>
                      <strong>{formatMoney(item.total)}</strong>
                      <span className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                        {[item.quantity !== null ? `Qtd. ${item.quantity}` : null, item.unitPrice !== null ? `Unit. ${formatMoney(item.unitPrice)}` : null]
                          .filter(Boolean)
                          .join(" - ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Servicos nao encontrados automaticamente.</p>
              )}
              {preview.invoice.warnings.length ? (
                <div className="rounded-[var(--radius-field)] border border-warning/20 bg-warning-soft px-3 py-2 text-xs font-semibold text-warning-foreground">
                  {preview.invoice.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showingEmail && emailData && generatedEmail ? (
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Destinatario">
                <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="cliente@email.com" />
              </Field>
              <Field label="CC">
                <Input value={ccEmail} onChange={(e) => setCcEmail(e.target.value)} placeholder="opcional" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Assunto">
                  <Input value={emailSubject || generatedEmail.subject} onChange={(e) => setEmailSubject(e.target.value)} />
                </Field>
              </div>
              <Field label="Saudacao">
                <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="Ola, cliente. Tudo bem?" />
              </Field>
              <Field label="Responsavel">
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4">
              <Field label="Texto de abertura">
                <Textarea value={openingText} onChange={(e) => setOpeningText(e.target.value)} />
              </Field>
              <Field label="Orientacao de pagamento">
                <Textarea value={paymentText} onChange={(e) => setPaymentText(e.target.value)} />
              </Field>
              <Field label="Encerramento">
                <Textarea value={closingText} onChange={(e) => setClosingText(e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface-muted p-4">
              <p className="text-sm font-bold text-foreground">Documentos que serao anexados manualmente</p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                {documents.map((document) => (
                  <label key={document.label} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={document.checked}
                      onChange={(event) =>
                        setDocuments((items) =>
                          items.map((item) => (item.label === document.label ? { ...item, checked: event.target.checked } : item)),
                        )
                      }
                    />
                    {document.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface-muted p-4">
              <p className="text-sm font-bold text-foreground">Relatorios</p>
              <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
                <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} aria-label="Data do relatorio" />
                <Input value={reportUrl} onChange={(e) => setReportUrl(e.target.value)} placeholder="https://..." aria-label="Link do relatorio" />
                <Button variant="secondary" onClick={addReport}>
                  <Plus className="size-4" />
                  Adicionar
                </Button>
              </div>
              {reports.map((report) => (
                <div key={report.url} className="flex items-center justify-between gap-3 text-sm">
                  <span>{formatDate(report.date)} - {report.url}</span>
                  <Button variant="ghost" size="sm" onClick={() => setReports((items) => items.filter((item) => item.url !== report.url))}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>
            <div className="max-h-80 overflow-auto rounded-[var(--radius-card)] border border-border bg-white p-4 text-sm text-slate-800">
              <p className="font-bold">{generatedEmail.subject}</p>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-5">{generatedEmail.text}</pre>
            </div>
            <div className="rounded-[var(--radius-field)] border border-amber-300/70 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
              Confirme que os documentos marcados estao disponiveis para anexar. O Titan nao envia automaticamente e os anexos permanecem manuais.
            </div>
          </div>
        ) : null}

        <DialogFooter className="sm:flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              resetAll();
              onOpenChange(false);
            }}
          >
            {showingEmail ? "Concluir depois" : "Cancelar"}
          </Button>
          {!showingReview && !showingEmail ? (
            <Button onClick={handleImport} loading={importMutation.isPending} disabled={!url.trim()}>
              <Link2 className="size-4" />
              {importMutation.isPending ? "Buscando dados..." : "Buscar dados"}
            </Button>
          ) : null}
          {showingReview ? (
            <>
              <Button variant="secondary" onClick={() => setPreview(null)}>
                <RefreshCcw className="size-4" />
                Trocar link
              </Button>
              <Button onClick={handleCreateAccount} loading={createMutation.isPending || createCustomerMutation.isPending}>
                <FileInput className="size-4" />
                Criar conta pendente
              </Button>
            </>
          ) : null}
          {showingEmail && generatedEmail && emailData ? (
            <>
              <Button variant="secondary" onClick={() => copyText(emailData.recipientEmail ?? "", "Destinatario copiado.")} disabled={!emailData.recipientEmail}>
                <Copy className="size-4" />
                Copiar destinatario
              </Button>
              <Button variant="secondary" onClick={() => copyText(generatedEmail.subject, "Assunto copiado.")}>
                <Copy className="size-4" />
                Copiar assunto
              </Button>
              <Button variant="secondary" onClick={() => copyText(generatedEmail.html, "Codigo HTML copiado.")}>
                <Copy className="size-4" />
                Copiar HTML
              </Button>
              <Button variant="secondary" onClick={handleCopyBody}>
                <Mail className="size-4" />
                Copiar corpo
              </Button>
              <Button onClick={handleOpenTitan}>
                <ExternalLink className="size-4" />
                Abrir no Titan
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
