import { Document, Page, StyleSheet, Text, View, renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { createElement as h } from "react";
import type { ReactElement } from "react";
import { formatMoney } from "../../lib/utils.js";
import {
  formatGeneratedAt,
  toProjectionRows,
  type CashFlowExportPayload,
} from "./cash-flow-export.js";

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 28,
    paddingBottom: 42,
    paddingLeft: 28,
    fontSize: 9,
    color: "#0b1f3a",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#d8e2ef",
    paddingBottom: 12,
    marginBottom: 16,
  },
  company: { fontSize: 16, fontWeight: 700, color: "#061a38" },
  title: { marginTop: 8, fontSize: 13, fontWeight: 700, color: "#155eef" },
  subtitle: { marginTop: 3, color: "#53657d" },
  summary: { display: "flex", flexDirection: "row", gap: 8, marginBottom: 8 },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: "#d8e2ef",
    borderRadius: 8,
    padding: 10,
  },
  label: { color: "#53657d", fontSize: 8, textTransform: "uppercase", marginBottom: 6 },
  value: { fontSize: 13, fontWeight: 700 },
  revenue: { color: "#059669" },
  expense: { color: "#dc2626" },
  balance: { color: "#2563eb" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#061a38", marginTop: 10, marginBottom: 8 },
  table: { borderWidth: 1, borderColor: "#d8e2ef", borderRadius: 6, overflow: "hidden", marginBottom: 14 },
  row: { display: "flex", flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e8eef7", minHeight: 24 },
  headerRow: { backgroundColor: "#f2f6fb" },
  cell: { paddingTop: 6, paddingRight: 6, paddingBottom: 6, paddingLeft: 6, lineHeight: 1.25 },
  headCell: { fontSize: 7, fontWeight: 700, color: "#53657d", textTransform: "uppercase" },
  colPeriod: { width: "24%" },
  colMoney: { width: "19%", textAlign: "right" },
  colType: { width: "12%" },
  colDescription: { width: "34%" },
  colParty: { width: "24%" },
  colDue: { width: "12%" },
  colStatus: { width: "10%" },
  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#d8e2ef",
    paddingTop: 8,
    color: "#71829d",
    fontSize: 8,
  },
});

export async function renderCashFlowPdf(payload: CashFlowExportPayload): Promise<Buffer> {
  const stream = await renderToStream(createCashFlowPdfDocument(payload));
  return readableToBuffer(stream);
}

function createCashFlowPdfDocument(payload: CashFlowExportPayload): ReactElement<DocumentProps> {
  const projectionRows = toProjectionRows(payload);
  const transactions = payload.periods.flatMap((period) => period.transactions);

  return h(
    Document,
    {
      title: `${payload.title} ${payload.periodLabel}`,
      author: payload.companyName,
      subject: "Fluxo de Caixa",
    },
    h(
      Page,
      { size: "A4", style: styles.page, wrap: true },
      h(
        View,
        { style: styles.header },
        h(Text, { style: styles.company }, `Artec - ${payload.companyName}`),
        h(Text, { style: styles.title }, payload.title),
        h(Text, { style: styles.subtitle }, `${payload.periodLabel} - Banco: Todos (Consolidado)`),
      ),
      h(
        View,
        { style: styles.summary },
        summaryCard("Saldo atual", formatMoney(payload.summary.currentBalance), "balance"),
        summaryCard("Entradas previstas", formatMoney(payload.summary.predictedInflows), "revenue"),
        summaryCard("Saidas previstas", formatMoney(payload.summary.predictedOutflows), "expense"),
      ),
      h(
        View,
        { style: styles.summary },
        summaryCard("Saldo final projetado", formatMoney(payload.summary.finalProjectedBalance), payload.summary.finalProjectedBalance < 0 ? "expense" : "balance"),
        summaryCard("Menor saldo projetado", formatMoney(payload.summary.lowestProjectedBalance), payload.summary.lowestProjectedBalance < 0 ? "expense" : "balance"),
        summaryCard("Lançamentos", String(payload.summary.inflowCount + payload.summary.outflowCount), "balance"),
      ),
      h(Text, { style: styles.sectionTitle }, "Projeção detalhada"),
      h(
        View,
        { style: styles.table },
        h(
          View,
          { style: [styles.row, styles.headerRow], fixed: true },
          h(Text, { style: [styles.cell, styles.headCell, styles.colPeriod] }, "Período"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Entradas"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Saidas"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Mov. líquido"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Saldo"),
        ),
        ...projectionRows.map((row) =>
          h(
            View,
            { key: row.period, style: styles.row, wrap: false },
            h(Text, { style: [styles.cell, styles.colPeriod] }, row.period),
            h(Text, { style: [styles.cell, styles.colMoney, styles.revenue] }, row.inflows),
            h(Text, { style: [styles.cell, styles.colMoney, styles.expense] }, row.outflows),
            h(Text, { style: [styles.cell, styles.colMoney] }, row.netMovement),
            h(Text, { style: [styles.cell, styles.colMoney, styles.balance] }, row.projectedBalance),
          ),
        ),
      ),
      h(Text, { style: styles.sectionTitle }, "Lancamentos"),
      h(
        View,
        { style: styles.table },
        h(
          View,
          { style: [styles.row, styles.headerRow], fixed: true },
          h(Text, { style: [styles.cell, styles.headCell, styles.colType] }, "Tipo"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colDescription] }, "Descricao"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colParty] }, "Cliente / Fornecedor"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Valor"),
          h(Text, { style: [styles.cell, styles.headCell, styles.colDue] }, "Venc."),
          h(Text, { style: [styles.cell, styles.headCell, styles.colStatus] }, "Status"),
        ),
        ...transactions.map((transaction) =>
          h(
            View,
            { key: transaction.id, style: styles.row, wrap: false },
            h(Text, { style: [styles.cell, styles.colType, transaction.type === "inflow" ? styles.revenue : styles.expense] }, transaction.type === "inflow" ? "Entrada" : "Saida"),
            h(Text, { style: [styles.cell, styles.colDescription] }, transaction.description),
            h(Text, { style: [styles.cell, styles.colParty] }, transaction.party ?? "-"),
            h(Text, { style: [styles.cell, styles.colMoney, transaction.type === "inflow" ? styles.revenue : styles.expense] }, formatMoney(transaction.amount)),
            h(Text, { style: [styles.cell, styles.colDue] }, transaction.dueDate),
            h(Text, { style: [styles.cell, styles.colStatus] }, transaction.status),
          ),
        ),
      ),
      h(
        View,
        { style: styles.footer, fixed: true },
        h(Text, null, `Gerado em ${formatGeneratedAt(payload.generatedAt)}`),
        h(Text, { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Pagina ${pageNumber} de ${totalPages}` }),
      ),
    ),
  ) as ReactElement<DocumentProps>;
}

function summaryCard(label: string, value: string, tone: "revenue" | "expense" | "balance") {
  return h(
    View,
    { style: styles.summaryCard },
    h(Text, { style: styles.label }, label),
    h(Text, { style: [styles.value, tone === "revenue" ? styles.revenue : tone === "expense" ? styles.expense : styles.balance] }, value),
  );
}

function readableToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on("data", (chunk: Buffer | Uint8Array | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (error: Error) => reject(error));
  });
}
