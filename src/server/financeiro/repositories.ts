import { prisma } from "../../lib/prisma/client";
import type { Prisma } from "@prisma/client";

export class RepositoryError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
  }
}

export class NotFoundError extends RepositoryError {
  constructor(entity: string, id: string) {
    super("NOT_FOUND", `${entity} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function whereNotDeleted(): Prisma.FinancialEntryWhereInput {
  return { deletedAt: null };
}

function accountPayableWhereNotDeleted(): Prisma.AccountPayableWhereInput {
  return { deletedAt: null };
}

function accountReceivableWhereNotDeleted(): Prisma.AccountReceivableWhereInput {
  return { deletedAt: null };
}

function categoryWhereNotDeleted(): Prisma.CategoryWhereInput {
  return { deletedAt: null };
}

function costCenterWhereNotDeleted(): Prisma.CostCenterWhereInput {
  return { deletedAt: null };
}

// ---------------------------------------------------------------------------
// FinancialEntry
// ---------------------------------------------------------------------------

export interface CreateFinancialEntryData {
  description: string;
  amount: Prisma.Decimal | number;
  type: string;
  date: Date;
  status?: string;
  categoryId: string;
  costCenterId?: string | null;
  userId: string;
  notes?: string | null;
}

export interface UpdateFinancialEntryData {
  description?: string;
  amount?: Prisma.Decimal | number;
  type?: string;
  date?: Date;
  status?: string;
  categoryId?: string;
  costCenterId?: string | null;
  notes?: string | null;
}

export interface FinancialEntryFilters {
  type?: string;
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const financialEntryRepo = {
  async findAll(filters?: FinancialEntryFilters) {
    const where: Prisma.FinancialEntryWhereInput = {
      ...whereNotDeleted(),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.costCenterId ? { costCenterId: filters.costCenterId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            date: {
              ...(filters?.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters?.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    return prisma.financialEntry.findMany({
      where,
      include: { category: true, costCenter: true },
      orderBy: { date: "desc" },
    });
  },

  async findById(id: string) {
    const entry = await prisma.financialEntry.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, costCenter: true },
    });
    if (!entry) throw new NotFoundError("FinancialEntry", id);
    return entry;
  },

  async create(data: CreateFinancialEntryData) {
    return prisma.financialEntry.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        date: data.date,
        status: data.status ?? "pending",
        categoryId: data.categoryId,
        costCenterId: data.costCenterId ?? null,
        userId: data.userId,
        notes: data.notes ?? null,
      },
      include: { category: true, costCenter: true },
    });
  },

  async update(id: string, data: UpdateFinancialEntryData) {
    const existing = await prisma.financialEntry.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("FinancialEntry", id);

    return prisma.financialEntry.update({
      where: { id },
      data,
      include: { category: true, costCenter: true },
    });
  },

  async softDelete(id: string) {
    const existing = await prisma.financialEntry.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("FinancialEntry", id);

    return prisma.financialEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};

// ---------------------------------------------------------------------------
// AccountPayable
// ---------------------------------------------------------------------------

export interface CreateAccountPayableData {
  description: string;
  amount: Prisma.Decimal | number;
  dueDate: Date;
  status?: string;
  categoryId: string;
  costCenterId?: string | null;
  supplier?: string | null;
  userId: string;
  notes?: string | null;
}

export interface UpdateAccountPayableData {
  description?: string;
  amount?: Prisma.Decimal | number;
  dueDate?: Date;
  paidDate?: Date | null;
  status?: string;
  categoryId?: string;
  costCenterId?: string | null;
  supplier?: string | null;
  notes?: string | null;
}

export interface AccountPayableFilters {
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  supplier?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export const accountPayableRepo = {
  async findAll(filters?: AccountPayableFilters) {
    const where: Prisma.AccountPayableWhereInput = {
      ...accountPayableWhereNotDeleted(),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.costCenterId ? { costCenterId: filters.costCenterId } : {}),
      ...(filters?.supplier
        ? { supplier: { contains: filters.supplier, mode: "insensitive" } }
        : {}),
      ...(filters?.dueDateFrom || filters?.dueDateTo
        ? {
            dueDate: {
              ...(filters?.dueDateFrom ? { gte: filters.dueDateFrom } : {}),
              ...(filters?.dueDateTo ? { lte: filters.dueDateTo } : {}),
            },
          }
        : {}),
    };

    return prisma.accountPayable.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });
  },

  async findById(id: string) {
    const entry = await prisma.accountPayable.findFirst({
      where: { id, deletedAt: null },
    });
    if (!entry) throw new NotFoundError("AccountPayable", id);
    return entry;
  },

  async create(data: CreateAccountPayableData) {
    return prisma.accountPayable.create({
      data: {
        description: data.description,
        amount: data.amount,
        dueDate: data.dueDate,
        status: data.status ?? "pending",
        categoryId: data.categoryId,
        costCenterId: data.costCenterId ?? null,
        supplier: data.supplier ?? null,
        userId: data.userId,
        notes: data.notes ?? null,
      },
    });
  },

  async update(id: string, data: UpdateAccountPayableData) {
    const existing = await prisma.accountPayable.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("AccountPayable", id);

    return prisma.accountPayable.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string) {
    const existing = await prisma.accountPayable.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("AccountPayable", id);

    return prisma.accountPayable.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};

// ---------------------------------------------------------------------------
// AccountReceivable
// ---------------------------------------------------------------------------

export interface CreateAccountReceivableData {
  description: string;
  amount: Prisma.Decimal | number;
  dueDate: Date;
  status?: string;
  categoryId: string;
  costCenterId?: string | null;
  client?: string | null;
  userId: string;
  notes?: string | null;
}

export interface UpdateAccountReceivableData {
  description?: string;
  amount?: Prisma.Decimal | number;
  dueDate?: Date;
  receivedDate?: Date | null;
  status?: string;
  categoryId?: string;
  costCenterId?: string | null;
  client?: string | null;
  notes?: string | null;
}

export interface AccountReceivableFilters {
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  client?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export const accountReceivableRepo = {
  async findAll(filters?: AccountReceivableFilters) {
    const where: Prisma.AccountReceivableWhereInput = {
      ...accountReceivableWhereNotDeleted(),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.costCenterId ? { costCenterId: filters.costCenterId } : {}),
      ...(filters?.client
        ? { client: { contains: filters.client, mode: "insensitive" } }
        : {}),
      ...(filters?.dueDateFrom || filters?.dueDateTo
        ? {
            dueDate: {
              ...(filters?.dueDateFrom ? { gte: filters.dueDateFrom } : {}),
              ...(filters?.dueDateTo ? { lte: filters.dueDateTo } : {}),
            },
          }
        : {}),
    };

    return prisma.accountReceivable.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });
  },

  async findById(id: string) {
    const entry = await prisma.accountReceivable.findFirst({
      where: { id, deletedAt: null },
    });
    if (!entry) throw new NotFoundError("AccountReceivable", id);
    return entry;
  },

  async create(data: CreateAccountReceivableData) {
    return prisma.accountReceivable.create({
      data: {
        description: data.description,
        amount: data.amount,
        dueDate: data.dueDate,
        status: data.status ?? "pending",
        categoryId: data.categoryId,
        costCenterId: data.costCenterId ?? null,
        client: data.client ?? null,
        userId: data.userId,
        notes: data.notes ?? null,
      },
    });
  },

  async update(id: string, data: UpdateAccountReceivableData) {
    const existing = await prisma.accountReceivable.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("AccountReceivable", id);

    return prisma.accountReceivable.update({
      where: { id },
      data,
    });
  },

  async softDelete(id: string) {
    const existing = await prisma.accountReceivable.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("AccountReceivable", id);

    return prisma.accountReceivable.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export interface CreateCategoryData {
  name: string;
  type: string;
  color?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  type?: string;
  color?: string | null;
}

export interface CategoryFilters {
  type?: string;
}

export const categoryRepo = {
  async findAll(filters?: CategoryFilters) {
    const where: Prisma.CategoryWhereInput = {
      ...categoryWhereNotDeleted(),
      ...(filters?.type ? { type: filters.type } : {}),
    };

    return prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundError("Category", id);
    return category;
  },

  async create(data: CreateCategoryData) {
    return prisma.category.create({
      data: {
        name: data.name,
        type: data.type,
        color: data.color ?? null,
      },
    });
  },

  async update(id: string, data: UpdateCategoryData) {
    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Category", id);

    return prisma.category.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Category", id);

    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};

// ---------------------------------------------------------------------------
// CostCenter
// ---------------------------------------------------------------------------

export interface CreateCostCenterData {
  name: string;
  code?: string | null;
  active?: boolean;
}

export interface UpdateCostCenterData {
  name?: string;
  code?: string | null;
  active?: boolean;
}

export const costCenterRepo = {
  async findAll(includeInactive?: boolean) {
    const where: Prisma.CostCenterWhereInput = {
      ...costCenterWhereNotDeleted(),
      ...(includeInactive ? {} : { active: true }),
    };

    return prisma.costCenter.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    const costCenter = await prisma.costCenter.findFirst({
      where: { id, deletedAt: null },
    });
    if (!costCenter) throw new NotFoundError("CostCenter", id);
    return costCenter;
  },

  async create(data: CreateCostCenterData) {
    return prisma.costCenter.create({
      data: {
        name: data.name,
        code: data.code ?? null,
        active: data.active ?? true,
      },
    });
  },

  async update(id: string, data: UpdateCostCenterData) {
    const existing = await prisma.costCenter.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("CostCenter", id);

    return prisma.costCenter.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    const existing = await prisma.costCenter.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("CostCenter", id);

    return prisma.costCenter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
