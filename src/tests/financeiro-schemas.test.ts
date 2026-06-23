import { describe, expect, it } from "vitest";
import { accountPayableSchema, accountReceivableSchema, financialEntrySchema } from "@/domain/financeiro/schemas";

const categoryId = "00000000-0000-0000-0000-000000000001";

describe("financial Zod validation", () => {
  it("coerces date and Brazilian decimal strings for financial entries", () => {
    const parsed = financialEntrySchema.parse({
      description: "Receita teste",
      amount: "1.660,50",
      type: "receita",
      date: "2026-06-23",
      categoryId,
    });

    expect(parsed.amount).toBe(1660.5);
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.status).toBe("pending");
  });

  it("rejects negative and zero amounts", () => {
    expect(() =>
      financialEntrySchema.parse({
        description: "Valor zero",
        amount: 0,
        type: "receita",
        date: new Date(),
        categoryId,
      }),
    ).toThrow();

    expect(() =>
      financialEntrySchema.parse({
        description: "Valor negativo",
        amount: -1,
        type: "despesa",
        date: new Date(),
        categoryId,
      }),
    ).toThrow();
  });

  it("validates payable and receivable payloads", () => {
    expect(
      accountPayableSchema.parse({
        description: "Fornecedor",
        amount: "500,25",
        dueDate: "2026-07-01",
        categoryId,
      }).amount,
    ).toBe(500.25);

    expect(
      accountReceivableSchema.parse({
        description: "Cliente",
        amount: "1000",
        dueDate: "2026-07-01",
        categoryId,
      }).amount,
    ).toBe(1000);
  });
});
