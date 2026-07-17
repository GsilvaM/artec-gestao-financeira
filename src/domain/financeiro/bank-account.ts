export const DEFAULT_BANK_ACCOUNT = "Sicredi";

export const BANK_OPENING_BALANCE_MARKER = "[bankOpeningBalance=true]";
export const MANUAL_REVENUE_SPLIT_MARKER = "[manualRevenueSplit=true]";

export function hasBankOpeningBalanceMarker(notes: string | null | undefined) {
  return notes?.includes(BANK_OPENING_BALANCE_MARKER) ?? false;
}

export function hasManualRevenueSplitMarker(notes: string | null | undefined) {
  return notes?.includes(MANUAL_REVENUE_SPLIT_MARKER) ?? false;
}
