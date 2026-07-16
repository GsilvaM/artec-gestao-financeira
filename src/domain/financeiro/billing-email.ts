import type { BillingEmailData, BillingEmailResult } from "./auvo-cobranca.js";

export const DEFAULT_BILLING_DOCUMENTS = [
  "Nota fiscal",
  "XML",
  "Boleto",
  "Relatorios",
  "Contrato",
  "ART",
  "PMOC",
  "Outro",
];

export const DEFAULT_BILLING_TEXTS = {
  opening:
    "Encaminhamos, em anexo, os documentos referentes aos servicos realizados no endereco informado. Para facilitar sua conferencia, tambem disponibilizamos abaixo o resumo da cobranca, o detalhamento dos servicos executados e os respectivos relatorios de atendimento.",
  payment:
    "O pagamento devera ser realizado por meio do boleto anexo. Apos a quitacao, pedimos a gentileza de encaminhar o comprovante para conferencia e baixa financeira.",
  closing:
    "Agradecemos pela confianca em nossos servicos. Em caso de duvida sobre a cobranca, a nota fiscal, o boleto ou os relatorios apresentados, basta responder a este e-mail.",
};

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value).replace(/\u00a0/g, " ");
}

function date(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function firstNameOrCompanyName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "tudo bem";
  if (trimmed.split(/\s+/).length <= 2) return trimmed;
  return trimmed.split(/\s+/)[0];
}

function tableRows(rows: Array<[string, string | null | undefined]>) {
  return rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<div><span style="font-weight:700;color:#173b5d;">${escapeHtml(label)}:</span> ${escapeHtml(value)}</div>`,
    )
    .join("");
}

function textLines(rows: Array<[string, string | null | undefined]>) {
  return rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join("\n");
}

function documentDescription(label: string, amount: number, dueDate: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("nota")) return "1 nota fiscal de servico em PDF";
  if (normalized.includes("xml")) return "1 arquivo XML correspondente a nota fiscal";
  if (normalized.includes("boleto")) return `1 boleto bancario - ${money(amount)}, vencimento em ${dueDate}`;
  if (normalized.includes("relatorio")) return "Relatorios dos atendimentos realizados";
  return label;
}

export function generateBillingEmail(data: BillingEmailData): BillingEmailResult {
  const dueDate = date(data.dueDate) ?? data.dueDate;
  const issueDate = date(data.issueDate);
  const subject = data.subject?.trim() || `Documentos financeiros - Fatura nº ${data.invoiceNumber ?? "sem numero"} - ${data.clientName}`;
  const greeting = data.greeting?.trim() || `Ola, ${firstNameOrCompanyName(data.clientName)}. Tudo bem?`;
  const selectedDocuments = data.documents.filter((item) => item.checked);
  const validReports = data.reports
    .map((report) => ({ ...report, url: safeHttpsUrl(report.url) }))
    .filter((report): report is typeof report & { url: string } => Boolean(report.url));
  const summaryRows: Array<[string, string | null | undefined]> = [
    ["Fatura", data.invoiceNumber],
    ["Cliente", data.clientName],
    ["CPF/CNPJ", data.clientDocument],
    ["Emissao", issueDate],
    ["Forma de pagamento", data.paymentMethod],
    ["Vencimento", dueDate],
  ];

  const serviceRows = data.services
    .filter((item) => item.description && Number.isFinite(item.total))
    .map((item) => {
      const quantity = item.quantity ? ` - ${item.quantity} unidade(s)` : "";
      return `<tr><td style="padding:12px 14px;border-bottom:1px solid #edf1f4;font-size:13px;line-height:19px;color:#44525f;">${escapeHtml(item.description)}${escapeHtml(quantity)}</td><td style="padding:12px 14px;border-bottom:1px solid #edf1f4;font-size:13px;line-height:19px;font-weight:700;color:#173b5d;text-align:right;white-space:nowrap;">${escapeHtml(money(item.total))}</td></tr>`;
    })
    .join("");

  const documentsBlock = selectedDocuments
    .map((item) => `<div>${escapeHtml(documentDescription(item.label, data.amount, dueDate))}</div>`)
    .join("");

  const reportsBlock = validReports
    .map((report) => {
      const reportDate = date(report.date) ?? report.date;
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-collapse:separate;border-spacing:0;"><tr><td style="width:74px;padding:12px 10px;background:#f2f6f9;border:1px solid #e3e9ee;border-right:0;border-radius:6px 0 0 6px;font-size:13px;font-weight:700;color:#173b5d;text-align:center;">${escapeHtml(reportDate)}</td><td style="background:#2d7fd3;border-radius:0 6px 6px 0;"><a href="${escapeHtml(report.url)}" style="display:block;padding:12px 16px;font-size:13px;line-height:18px;font-weight:700;color:#ffffff;text-decoration:none;text-align:center;">${escapeHtml(report.label || "Ver relatorio do servico")}</a></td></tr></table>`;
    })
    .join("");

  const serviceAddress = data.serviceAddress
    ? `<p style="margin:10px 0 0;font-size:13px;line-height:21px;color:#6f7c88;">Local do servico: ${escapeHtml(data.serviceAddress)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 640px) {
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .email-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .amount-value { font-size: 28px !important; line-height: 35px !important; }
      .due-pill { margin-top: 12px !important; display: inline-block !important; }
      .report-date { width: 62px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef1f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#eef1f4;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:24px 12px 36px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-card" style="width:600px;max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(23,59,93,0.08);border-collapse:separate;border-spacing:0;">
          <tr>
            <td class="email-pad" style="padding:25px 34px;background:#ffffff;border-bottom:1px solid #e7ebef;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="92"><img src="${escapeHtml(data.logoUrl)}" width="78" alt="Artec" style="display:block;width:78px;height:auto;border:0;"></td>
                <td style="padding-left:16px;"><div style="font-size:17px;line-height:23px;font-weight:700;color:#173b5d;">Artec Ambientes Climatizados</div><div style="margin-top:2px;font-size:12px;line-height:18px;color:#7d8b98;">Financeiro</div></td>
              </tr></table>
            </td>
          </tr>
          <tr><td class="email-pad" style="padding:30px 34px 12px;"><div style="font-size:11px;line-height:16px;font-weight:700;color:#2d7fd3;text-transform:uppercase;letter-spacing:0.8px;">Documentos financeiros</div><h1 style="margin:7px 0 0;font-size:24px;line-height:31px;font-weight:700;color:#173b5d;">Envio de nota fiscal, boleto e relatorios</h1><p style="margin:20px 0 0;font-size:15px;line-height:24px;color:#22303c;">${escapeHtml(greeting)}</p><p style="margin:10px 0 0;font-size:15px;line-height:24px;color:#22303c;">${escapeHtml(data.openingText)}</p>${serviceAddress}</td></tr>
          <tr><td class="email-pad" style="padding:18px 34px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#173b5d;border-radius:8px;"><tr><td style="padding:22px 24px;"><div style="font-size:12px;line-height:17px;font-weight:700;color:#b9d5ea;text-transform:uppercase;letter-spacing:0.7px;">VALOR TOTAL</div><div class="amount-value" style="margin-top:5px;font-size:32px;line-height:39px;font-weight:700;color:#ffffff;">${escapeHtml(money(data.amount))}</div></td><td align="right" style="padding:22px 24px;"><span class="due-pill" style="display:inline-block;padding:6px 12px;background:#ffb020;border-radius:14px;font-size:12px;line-height:16px;font-weight:700;color:#173b5d;">Vence em ${escapeHtml(dueDate)}</span></td></tr></table><p style="margin:8px 0 0;font-size:11.5px;line-height:17px;color:#8b97a3;">Para condicoes aplicaveis apos o vencimento, consulte as informacoes do boleto. Caso o pagamento ja tenha sido realizado, desconsidere este aviso.</p></td></tr>
          <tr><td class="email-pad" style="padding:22px 34px 4px;"><h2 style="margin:0;font-size:16px;line-height:22px;font-weight:700;color:#173b5d;">Resumo da cobranca</h2><div style="margin-top:10px;padding:14px 16px;background:#f7f9fb;border:1px solid #e7ebef;border-radius:7px;font-size:13.5px;line-height:23px;color:#44525f;">${tableRows(summaryRows)}</div></td></tr>
          ${serviceRows ? `<tr><td class="email-pad" style="padding:24px 34px 4px;"><h2 style="margin:0;font-size:16px;line-height:22px;font-weight:700;color:#173b5d;">Servicos executados</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;width:100%;border:1px solid #e7ebef;border-radius:7px;overflow:hidden;border-collapse:separate;border-spacing:0;">${serviceRows}</table></td></tr>` : ""}
          ${documentsBlock ? `<tr><td class="email-pad" style="padding:24px 34px 4px;"><h2 style="margin:0;font-size:16px;line-height:22px;font-weight:700;color:#173b5d;">Documentos anexados</h2><div style="margin-top:10px;padding:14px 16px;background:#f7f9fb;border:1px solid #e7ebef;border-radius:7px;font-size:13.5px;line-height:23px;color:#44525f;">${documentsBlock}</div></td></tr>` : ""}
          ${reportsBlock ? `<tr><td class="email-pad" style="padding:24px 34px 5px;"><h2 style="margin:0;font-size:16px;line-height:22px;font-weight:700;color:#173b5d;">Relatorios</h2><p style="margin:5px 0 0;font-size:13px;line-height:20px;color:#74818d;">Acesse os relatorios dos atendimentos realizados.</p>${reportsBlock}</td></tr>` : ""}
          <tr><td class="email-pad" style="padding:20px 34px 6px;"><h2 style="margin:0;font-size:16px;line-height:22px;font-weight:700;color:#173b5d;">Pagamento</h2><p style="margin:10px 0 0;font-size:15px;line-height:24px;color:#22303c;">${escapeHtml(data.paymentText)}</p></td></tr>
          <tr><td class="email-pad" style="padding:20px 34px 31px;"><p style="margin:0;font-size:15px;line-height:24px;color:#22303c;">${escapeHtml(data.closingText)}</p></td></tr>
          <tr><td class="email-pad" style="padding:22px 34px;background:#f7f9fb;border-top:1px solid #e7ebef;"><div style="font-size:12.5px;line-height:20px;color:#687785;"><div style="font-size:14px;font-weight:700;color:#173b5d;">${escapeHtml(data.sender.name)}</div><div>${escapeHtml(data.sender.role)} - ${escapeHtml(data.sender.company)}</div><div style="margin-top:14px;padding-top:13px;border-top:1px solid #e0e6eb;font-size:11.5px;line-height:18px;color:#8b97a3;">${escapeHtml(data.sender.email)} · ${escapeHtml(data.sender.phone)}<br>${escapeHtml(data.sender.city)} · CNPJ ${escapeHtml(data.sender.document)}</div></div></td></tr>
        </table>
        <div style="max-width:600px;margin-top:12px;font-size:10.5px;line-height:16px;color:#98a3ad;text-align:center;">Esta mensagem contem documentos financeiros destinados exclusivamente ao responsavel pela cobranca.</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    subject,
    "",
    greeting,
    data.openingText,
    data.serviceAddress ? `Local do servico: ${data.serviceAddress}` : null,
    "",
    `Valor total: ${money(data.amount)}`,
    `Vence em ${dueDate}`,
    "",
    textLines(summaryRows),
    data.services.length ? ["", "Servicos:", ...data.services.map((item) => `- ${item.description}: ${money(item.total)}`)].join("\n") : null,
    selectedDocuments.length ? ["", "Documentos anexados:", ...selectedDocuments.map((item) => `- ${documentDescription(item.label, data.amount, dueDate)}`)].join("\n") : null,
    validReports.length ? ["", "Relatorios:", ...validReports.map((report) => `- ${report.label}: ${report.url}`)].join("\n") : null,
    "",
    "Pagamento",
    data.paymentText,
    "",
    data.closingText,
    "",
    `${data.sender.name}\n${data.sender.role} - ${data.sender.company}\n${data.sender.email} · ${data.sender.phone}\n${data.sender.city} · CNPJ ${data.sender.document}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
