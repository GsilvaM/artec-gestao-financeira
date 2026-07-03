import { Document, Page, StyleSheet, Text, View, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement as h } from "react";
import type { ReactElement } from "react";
import { formatMoney } from "../../lib/utils.js";
import {
  formatGeneratedAt,
  toPdfTableRows,
  type DreExportPayload,
} from "./dre-export.js";

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
  company: {
    fontSize: 16,
    fontWeight: 700,
    color: "#061a38",
  },
  title: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#155eef",
  },
  subtitle: {
    marginTop: 3,
    color: "#53657d",
  },
  summary: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: "#d8e2ef",
    borderRadius: 8,
    padding: 10,
  },
  label: {
    color: "#53657d",
    fontSize: 8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  value: {
    fontSize: 13,
    fontWeight: 700,
  },
  revenue: {
    color: "#059669",
  },
  expense: {
    color: "#dc2626",
  },
  balance: {
    color: "#2563eb",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#061a38",
    marginTop: 8,
    marginBottom: 8,
  },
  noteGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  noteBox: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: "#d8e2ef",
    borderRadius: 8,
    padding: 9,
    backgroundColor: "#f8fbff",
  },
  noteText: {
    color: "#53657d",
    lineHeight: 1.35,
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: "#e8eef7",
    marginTop: 7,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 99,
    backgroundColor: "#059669",
  },
  table: {
    borderWidth: 1,
    borderColor: "#d8e2ef",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef7",
    minHeight: 24,
  },
  headerRow: {
    backgroundColor: "#f2f6fb",
  },
  emphasisRow: {
    backgroundColor: "#eff6ff",
  },
  cell: {
    paddingTop: 6,
    paddingRight: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    lineHeight: 1.25,
  },
  headCell: {
    fontSize: 7,
    fontWeight: 700,
    color: "#53657d",
    textTransform: "uppercase",
  },
  colGroup: {
    width: "18%",
  },
  colCategory: {
    width: "34%",
  },
  colMoney: {
    width: "18%",
    textAlign: "right",
  },
  colPercent: {
    width: "14%",
    textAlign: "right",
  },
  colVariation: {
    width: "16%",
    textAlign: "right",
  },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d8e2ef",
    borderRadius: 8,
    padding: 18,
    color: "#53657d",
    textAlign: "center",
    marginBottom: 14,
  },
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

export async function renderDrePdf(payload: DreExportPayload): Promise<Buffer> {
  return renderToBuffer(createDrePdfDocument(payload));
}

function createDrePdfDocument(payload: DreExportPayload): ReactElement<DocumentProps> {
  const rows = toPdfTableRows(payload.rows);
  const resultStyle = payload.summary.resultado < 0 ? styles.expense : styles.balance;

  return h(
    Document,
    {
      title: `DRE ${payload.companyName} ${payload.period.filenameToken}`,
      author: payload.companyName,
      subject: "Demonstracao de Resultado",
    },
    h(
      Page,
      { size: "A4", style: styles.page, wrap: true },
      h(
        View,
        { style: styles.header },
        // TODO: substituir placeholder pelo nome/logo real da empresa quando configuracoes da conta estiverem disponiveis.
        h(Text, { style: styles.company }, `DRE - ${payload.companyName}`),
        h(Text, { style: styles.title }, payload.title),
        h(Text, { style: styles.subtitle }, payload.period.label),
      ),
      h(
        View,
        { style: styles.summary },
        summaryCard("Receitas", formatMoney(payload.summary.receitas), "revenue"),
        summaryCard("Despesas", formatMoney(payload.summary.despesas), "expense"),
        h(
          View,
          { style: styles.summaryCard },
          h(Text, { style: styles.label }, "Resultado"),
          h(Text, { style: [styles.value, resultStyle] }, formatMoney(payload.summary.resultado)),
        ),
      ),
      h(
        View,
        { style: styles.summary },
        summaryCard("Margem liquida", formatOptionalPercent(payload.summary.margemLiquida), payload.summary.resultado < 0 ? "expense" : "revenue"),
        summaryCard("Cobertura despesas", formatOptionalPercent(payload.summary.coberturaDespesas), payload.summary.coberturaDespesas !== null && payload.summary.coberturaDespesas < 100 ? "expense" : "revenue"),
        summaryCard("Gap equilibrio", formatMoney(payload.summary.gapEquilibrio), payload.summary.gapEquilibrio > 0 ? "expense" : "revenue"),
      ),
      breakEvenSection(payload),
      insightsSection(payload),
      expenseCompositionSection(payload),
      payload.period.includesMultipleMonths ? monthlyComparison(payload) : null,
      h(Text, { style: styles.sectionTitle }, "Detalhamento por categoria"),
      payload.empty
        ? h(Text, { style: styles.empty }, "Nenhuma movimentacao neste periodo.")
        : h(
            View,
            { style: styles.table },
            h(
              View,
              { style: [styles.row, styles.headerRow], fixed: true },
              h(Text, { style: [styles.cell, styles.headCell, styles.colGroup] }, "Grupo"),
              h(Text, { style: [styles.cell, styles.headCell, styles.colCategory] }, "Categoria"),
              h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Realizado"),
              h(Text, { style: [styles.cell, styles.headCell, styles.colPercent] }, "% Receita"),
              h(Text, { style: [styles.cell, styles.headCell, styles.colVariation] }, "Variacao"),
            ),
            ...rows.map((row, index) => {
              const amountStyle = row.type === "receita" ? styles.revenue : row.type === "despesa" ? styles.expense : resultStyle;
              return h(
                View,
                {
                  key: `${row.group}-${row.category}-${index}`,
                  style: row.emphasis ? [styles.row, styles.emphasisRow] : styles.row,
                  wrap: false,
                },
                h(Text, { style: [styles.cell, styles.colGroup] }, row.group),
                h(Text, { style: [styles.cell, styles.colCategory] }, row.category),
                h(Text, { style: [styles.cell, styles.colMoney, amountStyle] }, row.amount),
                h(Text, { style: [styles.cell, styles.colPercent] }, row.revenueShare),
                h(Text, { style: [styles.cell, styles.colVariation] }, row.variation),
              );
            }),
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

function summaryCard(label: string, value: string, tone: "revenue" | "expense") {
  return h(
    View,
    { style: styles.summaryCard },
    h(Text, { style: styles.label }, label),
    h(Text, { style: [styles.value, tone === "revenue" ? styles.revenue : styles.expense] }, value),
  );
}

function monthlyComparison(payload: DreExportPayload) {
  return [
    h(Text, { key: "monthly-title", style: styles.sectionTitle }, "Comparativo mensal"),
    h(
      View,
      { key: "monthly-table", style: styles.table },
      h(
        View,
        { style: [styles.row, styles.headerRow], fixed: true },
        h(Text, { style: [styles.cell, styles.headCell, styles.colCategory] }, "Mes"),
        h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Receita"),
        h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Despesa"),
        h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Resultado"),
      ),
      ...payload.monthlyComparison.map((point) =>
        h(
          View,
          { key: point.mes, style: styles.row, wrap: false },
          h(Text, { style: [styles.cell, styles.colCategory] }, formatMonthLabel(point.mes)),
          h(Text, { style: [styles.cell, styles.colMoney, styles.revenue] }, formatMoney(point.receita)),
          h(Text, { style: [styles.cell, styles.colMoney, styles.expense] }, formatMoney(point.despesa)),
          h(Text, { style: [styles.cell, styles.colMoney, point.resultado < 0 ? styles.expense : styles.balance] }, formatMoney(point.resultado)),
        ),
      ),
    ),
  ];
}

function breakEvenSection(payload: DreExportPayload) {
  return [
    h(Text, { key: "breakeven-title", style: styles.sectionTitle }, "Ponto de equilibrio"),
    h(
      View,
      { key: "breakeven-card", style: styles.noteBox },
      h(Text, { style: [styles.value, payload.breakEven.tone === "negative" ? styles.expense : styles.balance] }, payload.breakEven.text),
      h(Text, { style: styles.noteText }, `A receita cobre ${formatPercentValue(payload.breakEven.coberturaPct)} das despesas.`),
      h(
        View,
        { style: styles.progressTrack },
        h(View, { style: [styles.progressFill, { width: `${payload.breakEven.receitaPct}%` }] }),
      ),
    ),
  ];
}

function insightsSection(payload: DreExportPayload) {
  return [
    h(Text, { key: "insights-title", style: styles.sectionTitle }, "Leitura rapida"),
    h(
      View,
      { key: "insights-grid", style: styles.noteGrid },
      ...payload.insights.slice(0, 2).map((insight) =>
        h(View, { key: insight.id, style: styles.noteBox }, h(Text, { style: styles.noteText }, insight.text)),
      ),
    ),
  ];
}

function expenseCompositionSection(payload: DreExportPayload) {
  if (!payload.expenseComposition.length) return null;
  return [
    h(Text, { key: "composition-title", style: styles.sectionTitle }, "Composicao de despesas"),
    h(
      View,
      { key: "composition-table", style: styles.table },
      h(
        View,
        { style: [styles.row, styles.headerRow], fixed: true },
        h(Text, { style: [styles.cell, styles.headCell, styles.colCategory] }, "Categoria"),
        h(Text, { style: [styles.cell, styles.headCell, styles.colMoney] }, "Valor"),
        h(Text, { style: [styles.cell, styles.headCell, styles.colPercent] }, "% desp."),
        h(Text, { style: [styles.cell, styles.headCell, styles.colPercent] }, "% receita"),
      ),
      ...payload.expenseComposition.map((item) =>
        h(
          View,
          { key: item.categoria, style: styles.row, wrap: false },
          h(Text, { style: [styles.cell, styles.colCategory] }, item.alerta ? `${item.categoria} *` : item.categoria),
          h(Text, { style: [styles.cell, styles.colMoney, styles.expense] }, formatMoney(item.valor)),
          h(Text, { style: [styles.cell, styles.colPercent] }, formatPercentValue(item.percentual)),
          h(Text, { style: [styles.cell, styles.colPercent] }, formatPercentValue(item.percentualReceita)),
        ),
      ),
    ),
  ];
}

function formatOptionalPercent(value: number | null) {
  return value === null || !Number.isFinite(value) ? "-" : formatPercentValue(value);
}

function formatPercentValue(value: number) {
  if (!Number.isFinite(value)) return "-";
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatMonthLabel(value: string) {
  const [yearValue, monthValue] = value.split("-").map(Number);
  const year = typeof yearValue === "number" && Number.isFinite(yearValue) ? yearValue : Number.NaN;
  const month = typeof monthValue === "number" && Number.isFinite(monthValue) ? monthValue : Number.NaN;
  if (!Number.isFinite(year) || !Number.isFinite(month)) return value;
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}
