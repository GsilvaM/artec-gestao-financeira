import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma/client.js";

export type BeneficiaryType = "supplier" | "collaborator";

export interface BeneficiarySearchInput {
  type: BeneficiaryType;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface BeneficiarySearchItem {
  id: string;
  name: string;
  type: BeneficiaryType;
}

export interface BeneficiarySearchResult {
  items: BeneficiarySearchItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const ALLOWED_PAGE_SIZES = [10, 20, 50, 100, 200] as const;

function normalizePage(value: number | undefined) {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

function normalizePageSize(value: number | undefined) {
  return ALLOWED_PAGE_SIZES.includes(value as (typeof ALLOWED_PAGE_SIZES)[number])
    ? value!
    : 20;
}

function searchTerm(value: string | undefined) {
  const term = value?.trim();
  return term ? term : undefined;
}

function supplierWhere(q: string | undefined): Prisma.AccountPayableWhereInput {
  return {
    deletedAt: null,
    beneficiaryType: "supplier",
    beneficiaryName: { not: null, ...(q ? { contains: q, mode: "insensitive" } : {}) },
  };
}

async function searchCollaborators(
  q: string | undefined,
  page: number,
  pageSize: number
): Promise<BeneficiarySearchResult> {
  const where: Prisma.CollaboratorWhereInput = {
    deletedAt: null,
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { role: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.collaborator.count({ where }),
    prisma.collaborator.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((row) => ({ id: row.id, name: row.name, type: "collaborator" })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function searchSuppliers(
  q: string | undefined,
  page: number,
  pageSize: number
): Promise<BeneficiarySearchResult> {
  const where = supplierWhere(q);
  const grouped = await prisma.accountPayable.groupBy({
    by: ["beneficiaryName"],
    where,
    orderBy: { beneficiaryName: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const allGroups = await prisma.accountPayable.groupBy({
    by: ["beneficiaryName"],
    where,
  });

  return {
    items: grouped
      .map((row) => row.beneficiaryName)
      .filter((name): name is string => Boolean(name))
      .map((name) => ({ id: name, name, type: "supplier" })),
    pagination: {
      page,
      pageSize,
      total: allGroups.length,
      totalPages: Math.max(1, Math.ceil(allGroups.length / pageSize)),
    },
  };
}

export async function searchBeneficiaries(
  input: BeneficiarySearchInput
): Promise<BeneficiarySearchResult> {
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const q = searchTerm(input.q);

  if (input.type === "collaborator") {
    return searchCollaborators(q, page, pageSize);
  }

  return searchSuppliers(q, page, pageSize);
}
