import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, parseMoneyInput, toFiniteNumber } from "@/lib/utils";

describe("financial utilities", () => {
  it("converts strings, null and undefined to finite numbers", () => {
    expect(toFiniteNumber("1000")).toBe(1000);
    expect(toFiniteNumber("660")).toBe(660);
    expect(toFiniteNumber(null)).toBe(0);
    expect(toFiniteNumber(undefined)).toBe(0);
    expect(toFiniteNumber(Number.NaN)).toBe(0);
  });

  it("parses Brazilian money input", () => {
    expect(parseMoneyInput("1.660,50")).toBe(1660.5);
    expect(parseMoneyInput("1660.50")).toBe(1660.5);
    expect(Number.isNaN(parseMoneyInput("abc"))).toBe(true);
  });

  it("formats BRL consistently", () => {
    expect(formatMoney(1660)).toBe("R$ 1.660,00");
    expect(formatMoney("1660")).toBe("R$ 1.660,00");
    expect(formatMoney(null)).toBe("R$ 0,00");
  });

  it("formats dates in pt-BR and handles invalid values", () => {
    expect(formatDate("2026-06-23")).toBe("23/06/2026");
    expect(formatDate(null)).toBe("-");
    expect(formatDate("data-invalida")).toBe("-");
  });
});
