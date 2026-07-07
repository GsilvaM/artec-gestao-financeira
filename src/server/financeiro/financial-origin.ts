export const FINANCIAL_ORIGINS = {
  MANUAL: "manual",
  ACCOUNTS_PAYABLE: "accounts_payable",
  ACCOUNTS_RECEIVABLE: "accounts_receivable",
  SYSTEM: "system",
  IMPORT: "import",
  REVERSAL: "reversal",
} as const;

export type FinancialOrigin =
  (typeof FINANCIAL_ORIGINS)[keyof typeof FINANCIAL_ORIGINS];

export function originMarker(originType: FinancialOrigin, originId: string) {
  return `[originType=${originType};originId=${originId}]`;
}

export function hasOriginMarker(notes: string | null | undefined) {
  return /\[originType=[^;\]]+;originId=[^\]]+\]/.test(notes ?? "");
}

export function isAccountOriginatedEntry(notes: string | null | undefined) {
  return (
    notes?.includes(`[originType=${FINANCIAL_ORIGINS.ACCOUNTS_PAYABLE};`) ||
    notes?.includes(`[originType=${FINANCIAL_ORIGINS.ACCOUNTS_RECEIVABLE};`) ||
    notes?.includes(`[originType=${FINANCIAL_ORIGINS.REVERSAL};`)
  );
}

export function reversalOriginMarker(originType: FinancialOrigin, originId: string) {
  return originMarker(FINANCIAL_ORIGINS.REVERSAL, `${originType}:${originId}`);
}

export function appendMetadata(
  notes: string | null | undefined,
  lines: Array<string | null | undefined>
) {
  return [notes?.trim() || null, ...lines.map((line) => line?.trim() || null)]
    .filter(Boolean)
    .join("\n");
}
