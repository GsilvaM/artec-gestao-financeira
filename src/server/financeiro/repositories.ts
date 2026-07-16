import { prisma } from "../../lib/prisma/client.js";
import type { Prisma } from "@prisma/client";
import {
  FINANCIAL_ORIGINS,
  appendMetadata,
  hasOriginMarker,
  originMarker,
} from "./financial-origin.js";

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

export class ValidationError extends RepositoryError {
  public readonly status: number;
  constructor(message: string, status = 400) {
    super("VALIDATION_ERROR", message);
    this.name = "ValidationError";
    this.status = status;
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

function collaboratorWhereNotDeleted(): Prisma.CollaboratorWhereInput {
  return { deletedAt: null };
}

// ---------------------------------------------------------------------------
// FinancialEntry
// ---------------------------------------------------------------------------

export interface CreateFinancialEntryData {
  description: string;
  amount: Prisma.Decimal | number;
  grossAmount?: Prisma.Decimal | number | null;
  discountAmount?: Prisma.Decimal | number;
  interestAmount?: Prisma.Decimal | number;
  penaltyAmount?: Prisma.Decimal | number;
  type: string;
  date: Date;
  status?: string;
  categoryId: string;
  costCenterId?: string | null;
  collaboratorId?: string | null;
  clientName?: string | null;
  paymentMethod?: string | null;
  bankAccount?: string | null;
  originType?: (typeof FINANCIAL_ORIGINS)[keyof typeof FINANCIAL_ORIGINS] | null;
  originId?: string | null;
  reversalOfFinancialEntryId?: string | null;
  userId: string;
  notes?: string | null;
}

export interface UpdateFinancialEntryData {
  description?: string;
  amount?: Prisma.Decimal | number;
  grossAmount?: Prisma.Decimal | number | null;
  discountAmount?: Prisma.Decimal | number;
  interestAmount?: Prisma.Decimal | number;
  penaltyAmount?: Prisma.Decimal | number;
  type?: string;
  date?: Date;
  status?: string;
  categoryId?: string;
  costCenterId?: string | null;
  collaboratorId?: string | null;
  clientName?: string | null;
  paymentMethod?: string | null;
  bankAccount?: string | null;
  originType?: string | null;
  originId?: string | null;
  reversalOfFinancialEntryId?: string | null;
  notes?: string | null;
}

export interface FinancialEntryFilters {
  type?: string;
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  collaboratorId?: string;
  paymentMethod?: string;
  bankAccount?: string;
  origin?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export const financialEntryRepo = {
  async findPage(filters?: FinancialEntryFilters, page = 1, pageSize = 20) {
    const andFilters: Prisma.FinancialEntryWhereInput[] = [];
    if (filters?.paymentMethod) {
      andFilters.push({
        OR: [
          { paymentMethod: { contains: filters.paymentMethod, mode: "insensitive" } },
          { notes: { contains: filters.paymentMethod, mode: "insensitive" } },
        ],
      });
    }
    if (filters?.bankAccount) {
      andFilters.push({
        OR: [
          { bankAccount: { contains: filters.bankAccount, mode: "insensitive" } },
          { notes: { contains: filters.bankAccount, mode: "insensitive" } },
        ],
      });
    }
    if (filters?.origin && filters.origin !== "manual") {
      andFilters.push({
        OR: [
          { originType: filters.origin },
          { notes: { contains: `[originType=${filters.origin};` } },
        ],
      });
    }
    if (filters?.origin === "manual") {
      andFilters.push({
        OR: [
          { originType: FINANCIAL_ORIGINS.MANUAL },
          { notes: { contains: `[originType=${FINANCIAL_ORIGINS.MANUAL};` } },
        ],
      });
    }

    const where: Prisma.FinancialEntryWhereInput = {
      ...whereNotDeleted(),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.costCenterId ? { costCenterId: filters.costCenterId } : {}),
      ...(filters?.collaboratorId ? { collaboratorId: filters.collaboratorId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            date: {
              ...(filters?.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters?.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { description: { contains: filters.search, mode: "insensitive" } },
              { notes: { contains: filters.search, mode: "insensitive" } },
              { clientName: { contains: filters.search, mode: "insensitive" } },
              { category: { name: { contains: filters.search, mode: "insensitive" } } },
              { collaborator: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const summaryWhere: Prisma.FinancialEntryWhereInput = filters?.status
      ? where
      : { ...where, status: "confirmed" };

    const [items, total, summary] = await Promise.all([
      prisma.financialEntry.findMany({
        where,
        include: { category: true, costCenter: true, collaborator: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.financialEntry.count({ where }),
      prisma.financialEntry.groupBy({
        by: ["type"],
        where: summaryWhere,
        _sum: { amount: true },
      }),
    ]);

    const receitas = summary.find((item) => item.type === "receita")?._sum.amount ?? 0;
    const despesas = summary.find((item) => item.type === "despesa")?._sum.amount ?? 0;

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary: {
        receitas: Number(receitas ?? 0),
        despesas: Number(despesas ?? 0),
        saldo: Number(receitas ?? 0) - Number(despesas ?? 0),
        count: total,
      },
    };
  },

  async findAll(filters?: FinancialEntryFilters) {
    const andFilters: Prisma.FinancialEntryWhereInput[] = [];
    if (filters?.paymentMethod) {
      andFilters.push({
        OR: [
          { paymentMethod: { contains: filters.paymentMethod, mode: "insensitive" } },
          { notes: { contains: filters.paymentMethod, mode: "insensitive" } },
        ],
      });
    }
    if (filters?.bankAccount) {
      andFilters.push({
        OR: [
          { bankAccount: { contains: filters.bankAccount, mode: "insensitive" } },
          { notes: { contains: filters.bankAccount, mode: "insensitive" } },
        ],
      });
    }
    if (filters?.origin && filters.origin !== "manual") {
      andFilters.push({
        OR: [
          { originType: filters.origin },
          { notes: { contains: `[originType=${filters.origin};` } },
        ],
      });
    }
    if (filters?.origin === "manual") {
      andFilters.push({
        OR: [
          { originType: FINANCIAL_ORIGINS.MANUAL },
          { notes: { contains: `[originType=${FINANCIAL_ORIGINS.MANUAL};` } },
        ],
      });
    }

    const where: Prisma.FinancialEntryWhereInput = {
      ...whereNotDeleted(),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.costCenterId ? { costCenterId: filters.costCenterId } : {}),
      ...(filters?.collaboratorId ? { collaboratorId: filters.collaboratorId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            date: {
              ...(filters?.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters?.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { description: { contains: filters.search, mode: "insensitive" } },
              { notes: { contains: filters.search, mode: "insensitive" } },
              { clientName: { contains: filters.search, mode: "insensitive" } },
              { category: { name: { contains: filters.search, mode: "insensitive" } } },
              { collaborator: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    return prisma.financialEntry.findMany({
      where,
      include: { category: true, costCenter: true, collaborator: true },
      orderBy: { date: "desc" },
    });
  },

  async findById(id: string) {
    const entry = await prisma.financialEntry.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, costCenter: true, collaborator: true },
    });
    if (!entry) throw new NotFoundError("FinancialEntry", id);
    return entry;
  },

  async create(data: CreateFinancialEntryData) {
    const originType = data.originType ?? FINANCIAL_ORIGINS.MANUAL;
    const originId = data.originId ?? "manual";
    return prisma.financialEntry.create({
      data: {
        description: data.description,
        amount: data.amount,
        grossAmount: data.grossAmount ?? null,
        discountAmount: data.discountAmount ?? 0,
        interestAmount: data.interestAmount ?? 0,
        penaltyAmount: data.penaltyAmount ?? 0,
        type: data.type,
        date: data.date,
        status: data.status ?? "pending",
        categoryId: data.categoryId,
        costCenterId: data.costCenterId ?? null,
        collaboratorId: data.collaboratorId ?? null,
        clientName: data.clientName ?? null,
        paymentMethod: data.paymentMethod ?? null,
        bankAccount: data.bankAccount ?? null,
        originType,
        originId,
        reversalOfFinancialEntryId: data.reversalOfFinancialEntryId ?? null,
        userId: data.userId,
        notes: hasOriginMarker(data.notes)
          ? (data.notes ?? null)
          : appendMetadata(data.notes, [
              originMarker(originType, originId),
            ]),
      },
      include: { category: true, costCenter: true, collaborator: true },
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
      include: { category: true, costCenter: true, collaborator: true },
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
// Collaborator
// ---------------------------------------------------------------------------

export interface CreateCollaboratorData {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  active?: boolean;
}

export interface UpdateCollaboratorData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  active?: boolean;
}

export interface CollaboratorFilters {
  includeInactive?: boolean;
  search?: string;
}

export const collaboratorRepo = {
  async findAll(filters?: CollaboratorFilters) {
    const where: Prisma.CollaboratorWhereInput = {
      ...collaboratorWhereNotDeleted(),
      ...(filters?.includeInactive ? {} : { active: true }),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { phone: { contains: filters.search, mode: "insensitive" } },
              { role: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return prisma.collaborator.findMany({
      where,
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    const collaborator = await prisma.collaborator.findFirst({
      where: { id, deletedAt: null },
    });
    if (!collaborator) throw new NotFoundError("Collaborator", id);
    return collaborator;
  },

  async create(data: CreateCollaboratorData) {
    return prisma.collaborator.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        role: data.role || null,
        active: data.active ?? true,
      },
    });
  },

  async update(id: string, data: UpdateCollaboratorData) {
    const existing = await prisma.collaborator.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Collaborator", id);

    return prisma.collaborator.update({
      where: { id },
      data: {
        ...data,
        email: data.email === "" ? null : data.email,
        phone: data.phone === "" ? null : data.phone,
        role: data.role === "" ? null : data.role,
      },
    });
  },

  async softDelete(id: string) {
    const existing = await prisma.collaborator.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundError("Collaborator", id);

    return prisma.collaborator.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
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
  beneficiaryType?: "supplier" | "collaborator";
  beneficiaryId?: string | null;
  beneficiaryName?: string | null;
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
  beneficiaryType?: "supplier" | "collaborator";
  beneficiaryId?: string | null;
  beneficiaryName?: string | null;
  supplier?: string | null;
  /** Audit-only; not persisted to the model. */
  userId?: string;
  /** Optimistic lock token. Must match current updatedAt when provided. */
  expectedUpdatedAt?: Date | string;
  notes?: string | null;
}

export interface AccountPayableFilters {
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  beneficiaryType?: "supplier" | "collaborator";
  beneficiaryId?: string;
  supplier?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function hasBeneficiaryChange(data: UpdateAccountPayableData) {
  return (
    "beneficiaryType" in data ||
    "beneficiaryId" in data ||
    "beneficiaryName" in data ||
    "supplier" in data
  );
}

type AuditJsonValue = Prisma.InputJsonValue | null;

function toAuditValue(value: unknown): AuditJsonValue {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return String(value);
}

function changedField(
  from: unknown,
  to: unknown
): { from: AuditJsonValue; to: AuditJsonValue } {
  return { from: toAuditValue(from), to: toAuditValue(to) };
}

function sameTimestamp(left: Date, right: Date | string) {
  const parsed = right instanceof Date ? right : new Date(right);
  return Number.isFinite(parsed.getTime()) && left.getTime() === parsed.getTime();
}

async function resolveAccountPayableBeneficiary(
  data: Pick<
    CreateAccountPayableData,
    "beneficiaryType" | "beneficiaryId" | "beneficiaryName" | "supplier"
  >,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const type =
    data.beneficiaryType ?? (data.beneficiaryId ? "collaborator" : "supplier");
  const supplier = cleanOptionalText(data.supplier);
  const beneficiaryName = cleanOptionalText(data.beneficiaryName);

  if (type === "supplier") {
    if (data.beneficiaryId) {
      throw new ValidationError(
        "Conta a pagar deve ter apenas um favorecido: fornecedor ou colaborador."
      );
    }

    const name = supplier ?? beneficiaryName;
    if (!name) {
      throw new ValidationError("Informe o fornecedor da conta a pagar.");
    }

    return {
      beneficiaryType: "supplier",
      beneficiaryId: null,
      beneficiaryName: name,
      supplier: name,
    } satisfies Pick<
      Prisma.AccountPayableCreateInput,
      "beneficiaryType" | "beneficiaryId" | "beneficiaryName" | "supplier"
    >;
  }

  if (supplier) {
    throw new ValidationError(
      "Conta a pagar deve ter apenas um favorecido: fornecedor ou colaborador."
    );
  }

  if (!data.beneficiaryId) {
    throw new ValidationError("Selecione um colaborador ativo para a conta a pagar.", 422);
  }

  const collaborator = await db.collaborator.findFirst({
    where: {
      id: data.beneficiaryId,
      active: true,
      deletedAt: null,
    },
  });

  if (!collaborator) {
    throw new ValidationError("Selecione um colaborador ativo para a conta a pagar.", 422);
  }

  return {
    beneficiaryType: "collaborator",
    beneficiaryId: collaborator.id,
    beneficiaryName: collaborator.name,
    supplier: null,
  } satisfies Pick<
    Prisma.AccountPayableCreateInput,
    "beneficiaryType" | "beneficiaryId" | "beneficiaryName" | "supplier"
  >;
}

export const accountPayableRepo = {
  async findAll(filters?: AccountPayableFilters) {
    const andFilters: Prisma.AccountPayableWhereInput[] = [];
    if (filters?.supplier) {
      andFilters.push({
        OR: [
          { supplier: { contains: filters.supplier, mode: "insensitive" } },
          {
            beneficiaryName: {
              contains: filters.supplier,
              mode: "insensitive",
            },
          },
        ],
      });
    }
    if (filters?.search) {
      andFilters.push({
        OR: [
          { description: { contains: filters.search, mode: "insensitive" } },
          { supplier: { contains: filters.search, mode: "insensitive" } },
          {
            beneficiaryName: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          { notes: { contains: filters.search, mode: "insensitive" } },
          { category: { name: { contains: filters.search, mode: "insensitive" } } },
        ],
      });
    }

    const where: Prisma.AccountPayableWhereInput = {
      ...accountPayableWhereNotDeleted(),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.costCenterId ? { costCenterId: filters.costCenterId } : {}),
      ...(filters?.beneficiaryType
        ? { beneficiaryType: filters.beneficiaryType }
        : {}),
      ...(filters?.beneficiaryId ? { beneficiaryId: filters.beneficiaryId } : {}),
      ...(filters?.dueDateFrom || filters?.dueDateTo
        ? {
            dueDate: {
              ...(filters?.dueDateFrom ? { gte: filters.dueDateFrom } : {}),
              ...(filters?.dueDateTo ? { lte: filters.dueDateTo } : {}),
            },
          }
        : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
    };

    return prisma.accountPayable.findMany({
      where,
      include: { category: true, costCenter: true },
      orderBy: { dueDate: "asc" },
    });
  },

  async findById(id: string) {
    const entry = await prisma.accountPayable.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, costCenter: true },
    });
    if (!entry) throw new NotFoundError("AccountPayable", id);
    return entry;
  },

  async create(data: CreateAccountPayableData) {
    return prisma.$transaction(async (tx) => {
      const beneficiary = await resolveAccountPayableBeneficiary(data, tx);
      const account = await tx.accountPayable.create({
        data: {
          description: data.description,
          amount: data.amount,
          dueDate: data.dueDate,
          status: data.status ?? "pending",
          categoryId: data.categoryId,
          costCenterId: data.costCenterId ?? null,
          ...beneficiary,
          userId: data.userId,
          notes: data.notes ?? null,
        },
        include: { category: true, costCenter: true },
      });

      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: "CREATED",
          entity: "AccountPayable",
          entityId: account.id,
          metadata: {
            entity_type: "AccountPayable",
            entity_id: account.id,
            action: "CREATED",
            changed_fields: {
              description: changedField(null, data.description),
              amount: changedField(null, data.amount),
              dueDate: changedField(null, data.dueDate),
              categoryId: changedField(null, data.categoryId),
              costCenterId: changedField(null, data.costCenterId ?? null),
              beneficiaryType: changedField(null, beneficiary.beneficiaryType),
              beneficiaryId: changedField(null, beneficiary.beneficiaryId),
              beneficiaryName: changedField(null, beneficiary.beneficiaryName),
            },
            timestamp: new Date().toISOString(),
            amount: Number(data.amount),
            dueDate: data.dueDate.toISOString(),
            categoryId: data.categoryId,
            costCenterId: data.costCenterId ?? null,
            beneficiary,
          },
        },
      });

      return account;
    });
  },

  async update(id: string, data: UpdateAccountPayableData) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.accountPayable.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) throw new NotFoundError("AccountPayable", id);
      if (data.expectedUpdatedAt && !sameTimestamp(existing.updatedAt, data.expectedUpdatedAt)) {
        throw new ValidationError(
          "Conta a pagar foi alterada por outro usuario. Recarregue os dados antes de salvar.",
          409
        );
      }

      const currentBeneficiaryType = (existing.beneficiaryType ?? "supplier") as
        | "supplier"
        | "collaborator";
      const nextBeneficiaryType = data.beneficiaryType ?? currentBeneficiaryType;
      const beneficiary = hasBeneficiaryChange(data)
        ? await resolveAccountPayableBeneficiary(
            {
              beneficiaryType: nextBeneficiaryType,
              beneficiaryId:
                "beneficiaryId" in data
                  ? data.beneficiaryId
                  : nextBeneficiaryType === "supplier"
                    ? null
                    : existing.beneficiaryId,
              beneficiaryName:
                "beneficiaryName" in data
                  ? data.beneficiaryName
                  : existing.beneficiaryName,
              supplier:
                "supplier" in data
                  ? data.supplier
                  : nextBeneficiaryType === "collaborator"
                    ? null
                    : existing.supplier,
            },
            tx
          )
        : {};
      const { userId, expectedUpdatedAt, ...accountData } = data;
      void expectedUpdatedAt;
      const account = await tx.accountPayable.update({
        where: { id },
        data: {
          ...accountData,
          ...beneficiary,
        },
        include: { category: true, costCenter: true },
      });

      if (userId) {
        const changedFields = Object.entries(accountData).reduce<
          Record<string, ReturnType<typeof changedField>>
        >((fields, [field, nextValue]) => {
          const previousValue = existing[field as keyof typeof existing];
          if (toAuditValue(previousValue) !== toAuditValue(nextValue)) {
            fields[field] = changedField(previousValue, nextValue);
          }
          return fields;
        }, {});

        await tx.auditLog.create({
          data: {
            userId,
            action: "UPDATED",
            entity: "AccountPayable",
            entityId: id,
            metadata: {
              entity_type: "AccountPayable",
              entity_id: id,
              action: "UPDATED",
              changed_fields: changedFields,
              timestamp: new Date().toISOString(),
              fields: Object.keys(accountData),
              previousBeneficiary: {
                beneficiaryType: existing.beneficiaryType,
                beneficiaryId: existing.beneficiaryId,
                beneficiaryName: existing.beneficiaryName ?? existing.supplier,
              },
              beneficiary: hasBeneficiaryChange(data)
                ? beneficiary
                : {
                    beneficiaryType: existing.beneficiaryType,
                    beneficiaryId: existing.beneficiaryId,
                    beneficiaryName: existing.beneficiaryName ?? existing.supplier,
                    supplier: existing.supplier,
                  },
            },
          },
        });

        if (
          hasBeneficiaryChange(data) &&
          (existing.beneficiaryType !== account.beneficiaryType ||
            existing.beneficiaryId !== account.beneficiaryId ||
            (existing.beneficiaryName ?? existing.supplier) !==
              account.beneficiaryName)
        ) {
          await tx.auditLog.create({
            data: {
              userId,
              action: "BENEFICIARY_CHANGED",
              entity: "AccountPayable",
              entityId: id,
              metadata: {
                entity_type: "AccountPayable",
                entity_id: id,
                action: "BENEFICIARY_CHANGED",
                changed_fields: {
                  beneficiaryType: changedField(existing.beneficiaryType, account.beneficiaryType),
                  beneficiaryId: changedField(existing.beneficiaryId, account.beneficiaryId),
                  beneficiaryName: changedField(
                    existing.beneficiaryName ?? existing.supplier,
                    account.beneficiaryName
                  ),
                },
                timestamp: new Date().toISOString(),
                previous: {
                  beneficiaryType: existing.beneficiaryType,
                  beneficiaryId: existing.beneficiaryId,
                  beneficiaryName: existing.beneficiaryName ?? existing.supplier,
                },
                current: {
                  beneficiaryType: account.beneficiaryType,
                  beneficiaryId: account.beneficiaryId,
                  beneficiaryName: account.beneficiaryName,
                },
              },
            },
          });
        }
      }

      return account;
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
  /** Audit-only; not persisted to the model. */
  userId?: string;
}

export interface AccountReceivableFilters {
  status?: string;
  categoryId?: string;
  costCenterId?: string;
  client?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
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
      ...(filters?.search
        ? {
            OR: [
              { description: { contains: filters.search, mode: "insensitive" } },
              { client: { contains: filters.search, mode: "insensitive" } },
              { notes: { contains: filters.search, mode: "insensitive" } },
              { category: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    return prisma.accountReceivable.findMany({
      where,
      include: { category: true, costCenter: true },
      orderBy: { dueDate: "asc" },
    });
  },

  async findById(id: string) {
    const entry = await prisma.accountReceivable.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, costCenter: true },
    });
    if (!entry) throw new NotFoundError("AccountReceivable", id);
    return entry;
  },

  async create(data: CreateAccountReceivableData) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.accountReceivable.create({
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
        include: { category: true, costCenter: true },
      });

      await tx.auditLog.create({
        data: {
          userId: data.userId,
          action: "CREATED",
          entity: "AccountReceivable",
          entityId: account.id,
          metadata: {
            entity_type: "AccountReceivable",
            entity_id: account.id,
            action: "CREATED",
            changed_fields: {
              description: changedField(null, data.description),
              amount: changedField(null, data.amount),
              dueDate: changedField(null, data.dueDate),
              categoryId: changedField(null, data.categoryId),
              costCenterId: changedField(null, data.costCenterId ?? null),
              client: changedField(null, data.client ?? null),
            },
            timestamp: new Date().toISOString(),
            amount: Number(data.amount),
            dueDate: data.dueDate.toISOString(),
            categoryId: data.categoryId,
            costCenterId: data.costCenterId ?? null,
            client: data.client ?? null,
          },
        },
      });

      return account;
    });
  },

  async update(id: string, data: UpdateAccountReceivableData) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.accountReceivable.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) throw new NotFoundError("AccountReceivable", id);

      const { userId, ...accountData } = data;
      const account = await tx.accountReceivable.update({
        where: { id },
        data: accountData,
        include: { category: true, costCenter: true },
      });

      if (userId) {
        const changedFields = Object.entries(accountData).reduce<
          Record<string, ReturnType<typeof changedField>>
        >((fields, [field, nextValue]) => {
          const previousValue = existing[field as keyof typeof existing];
          if (toAuditValue(previousValue) !== toAuditValue(nextValue)) {
            fields[field] = changedField(previousValue, nextValue);
          }
          return fields;
        }, {});

        await tx.auditLog.create({
          data: {
            userId,
            action: "UPDATED",
            entity: "AccountReceivable",
            entityId: id,
            metadata: {
              entity_type: "AccountReceivable",
              entity_id: id,
              action: "UPDATED",
              changed_fields: changedFields,
              timestamp: new Date().toISOString(),
              fields: Object.keys(accountData),
            },
          },
        });
      }

      return account;
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
  search?: string;
}

export const categoryRepo = {
  async findAll(filters?: CategoryFilters) {
    const where: Prisma.CategoryWhereInput = {
      ...categoryWhereNotDeleted(),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.search
        ? { name: { contains: filters.search, mode: "insensitive" } }
        : {}),
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

export interface CostCenterFilters {
  includeInactive?: boolean;
  search?: string;
}

export const costCenterRepo = {
  async findAll(filters?: CostCenterFilters) {
    const where: Prisma.CostCenterWhereInput = {
      ...costCenterWhereNotDeleted(),
      ...(filters?.includeInactive ? {} : { active: true }),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { code: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
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
