import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function toFiniteNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: unknown): string {
  return brlFormatter.format(toFiniteNumber(value));
}

export function parseMoneyInput(value: string): number {
  const input = value.trim();
  const normalized = input.includes(",") ? input.replace(/\./g, "").replace(",", ".") : input;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value + (value.includes("T") ? "" : "T00:00:00"));
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}
