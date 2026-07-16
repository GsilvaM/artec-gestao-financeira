import { useMutation } from "@tanstack/react-query";
import { clientApi } from "@/server/financeiro/client-api";
import type { AuvoImportPreview, BillingEmailData, BillingEmailResult } from "../auvo-cobranca.js";

export function useImportAuvoInvoice() {
  return useMutation({
    mutationFn: async (url: string) =>
      (await clientApi.auvoCobranca.importInvoice(url)) as AuvoImportPreview,
  });
}

export function useGenerateBillingEmail() {
  return useMutation({
    mutationFn: async (data: BillingEmailData) =>
      (await clientApi.auvoCobranca.generateEmail(data)) as BillingEmailResult,
  });
}
