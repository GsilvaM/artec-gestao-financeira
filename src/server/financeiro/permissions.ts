import { prisma } from "@/lib/prisma/client";

// ---------------------------------------------------------------------------
// Module & action constants
// ---------------------------------------------------------------------------

export const Modules = {
  ENTRIES: "entries",
  ACCOUNTS_PAYABLE: "accounts_payable",
  ACCOUNTS_RECEIVABLE: "accounts_receivable",
  CATEGORIES: "categories",
  COST_CENTERS: "cost_centers",
  DRE: "dre",
  CASH_FLOW: "cash_flow",
  DASHBOARD: "dashboard",
} as const;

export type FinancialModule = (typeof Modules)[keyof typeof Modules];

export const Actions = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
} as const;

export type FinancialAction = (typeof Actions)[keyof typeof Actions];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADMIN_ROLE_NAME = "admin";

async function getUserRoleWithPermissions(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });

  if (!profile?.role) return null;
  return { role: profile.role, permissions: profile.role.permissions };
}

// ---------------------------------------------------------------------------
// Permission checks
// ---------------------------------------------------------------------------

export async function hasPermission(
  userId: string,
  module: FinancialModule,
  action: FinancialAction,
): Promise<boolean> {
  const data = await getUserRoleWithPermissions(userId);
  if (!data) return false;

  const { role, permissions } = data;

  if (role.name === ADMIN_ROLE_NAME) return true;

  return permissions.some(
    (p) => p.module === module && p.action === action,
  );
}

export async function canViewFinancial(
  userId: string,
  module: FinancialModule,
): Promise<boolean> {
  return hasPermission(userId, module, "view");
}

export async function canCreateEntry(userId: string): Promise<boolean> {
  return hasPermission(userId, "entries", "create");
}

export async function canEditEntry(
  userId: string,
  entryId: string,
): Promise<boolean> {
  const data = await getUserRoleWithPermissions(userId);
  if (!data) return false;
  if (data.role.name === ADMIN_ROLE_NAME) return true;

  const canEditAny = data.permissions.some(
    (p) => p.module === "entries" && p.action === "edit",
  );
  if (canEditAny) return true;

  const canEditOwn = data.permissions.some(
    (p) => p.module === "entries" && p.action === "edit_own",
  );
  if (!canEditOwn) return false;

  const entry = await prisma.financialEntry.findFirst({
    where: { id: entryId, deletedAt: null },
    select: { userId: true },
  });
  if (!entry) return false;

  return entry.userId === userId;
}
