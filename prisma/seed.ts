import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma/client";

async function main() {
  const roles = [
    { name: "primary_admin", description: "Administrador principal - aprova acessos e gerencia administradores" },
    { name: "admin", description: "Administrador - acesso total" },
    { name: "user", description: "Usuario padrao aprovado" },
    { name: "proprietario", description: "Proprietario - dashboards executivos" },
    { name: "financeiro", description: "Financeiro - lancamentos, contas, DRE" },
    { name: "operacional", description: "Operacional - servicos e tecnicos" },
    { name: "tecnico", description: "Tecnico - proprios servicos" },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, deletedAt: null },
      create: role,
    });
  }
  console.log("Roles ok");

  await ensurePrimaryAdmin();

  const revenueCategories = [
    { name: "Venda de Servicos", type: "receita", color: "#16A34A" },
    { name: "Venda de Produtos", type: "receita", color: "#14B8A6" },
    { name: "Consultoria", type: "receita", color: "#06B6D4" },
    { name: "Manutencao", type: "receita", color: "#1E88E5" },
  ];
  const expenseCategories = [
    { name: "Material", type: "despesa", color: "#F53535" },
    { name: "Mao de Obra", type: "despesa", color: "#DC2626" },
    { name: "Transporte", type: "despesa", color: "#F97316" },
    { name: "Ferramentas", type: "despesa", color: "#F59E0B" },
    { name: "Administrativo", type: "despesa", color: "#7C3AED" },
    { name: "Impostos", type: "despesa", color: "#DB2777" },
  ];
  for (const category of [...revenueCategories, ...expenseCategories]) {
    const exists = await prisma.category.findFirst({ where: { name: category.name, type: category.type } });
    if (!exists) await prisma.category.create({ data: { id: randomUUID(), ...category } });
  }
  console.log("Categories ok");

  const costCenters = [
    { name: "Residencial", code: "RES" },
    { name: "Comercial", code: "COM" },
    { name: "Industrial", code: "IND" },
    { name: "Manutencao", code: "MAN" },
  ];
  for (const costCenter of costCenters) {
    const exists = await prisma.costCenter.findFirst({ where: { name: costCenter.name } });
    if (!exists) await prisma.costCenter.create({ data: { id: randomUUID(), ...costCenter } });
  }
  console.log("Cost centers ok");

  console.log("Seed concluido.");
}

async function ensurePrimaryAdmin() {
  const email = process.env.PRIMARY_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PRIMARY_ADMIN_PASSWORD ?? "";
  const name = process.env.PRIMARY_ADMIN_NAME?.trim() || "Administrador Principal";
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !password) {
    console.log("Primary admin nao configurado: defina PRIMARY_ADMIN_EMAIL e PRIMARY_ADMIN_PASSWORD para provisionar o primeiro administrador principal.");
    return;
  }
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("PRIMARY_ADMIN_EMAIL exige VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("PRIMARY_ADMIN_PASSWORD deve ter pelo menos 8 caracteres, com letras e numeros.");
  }

  const role = await prisma.role.findUnique({ where: { name: "primary_admin" } });
  if (!role) throw new Error("Role primary_admin nao encontrada.");

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const existing = await findUserByEmail(admin, email);
  const result = existing
    ? await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { name, primary_admin: true } })
    : await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, primary_admin: true } });

  if (result.error || !result.data.user) {
    throw new Error(result.error?.message ?? "Nao foi possivel criar ou atualizar o administrador principal.");
  }

  await prisma.profile.upsert({
    where: { userId: result.data.user.id },
    update: {
      name,
      roleId: role.id,
      status: "approved",
      approvedAt: new Date(),
      approvedBy: result.data.user.id,
      rejectedAt: null,
      rejectedBy: null,
      deletedAt: null,
    },
    create: {
      id: randomUUID(),
      userId: result.data.user.id,
      name,
      roleId: role.id,
      status: "approved",
      approvedAt: new Date(),
      approvedBy: result.data.user.id,
    },
  });

  console.log(`Primary admin ok: ${email}`);
}

type SupabaseAdminClient = ReturnType<typeof createClient>;

async function findUserByEmail(admin: SupabaseAdminClient, email: string) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
