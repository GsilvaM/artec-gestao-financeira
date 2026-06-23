import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma/client.js";
import { getE2ECredentials } from "./env.js";

config();

const E2E_MARKER = "[E2E]";

export async function ensureE2EUserAndData() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { email, password } = getE2ECredentials();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "E2E seed requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Configure them in .env before running Playwright.",
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const user = await findOrCreateUser(admin, email, password);
  await ensureProfile(user.id, email);
  await ensureCategories();
  await cleanupOldE2EEntries(user.id);

  return { userId: user.id, email };
}

type SupabaseAdminClient = ReturnType<typeof createClient>;

async function findOrCreateUser(admin: SupabaseAdminClient, email: string, password: string) {
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { e2e: true },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { e2e: true },
  });
  if (error) throw error;
  return data.user;
}

async function findUserByEmail(admin: SupabaseAdminClient, email: string) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureProfile(userId: string, email: string) {
  await prisma.profile.upsert({
    where: { userId },
    update: { name: "Usuário E2E", deletedAt: null },
    create: { id: randomUUID(), userId, name: "Usuário E2E", phone: email },
  });
}

async function ensureCategories() {
  const categories = [
    { name: "Venda de Serviços", type: "receita", color: "#22c55e" },
    { name: "Material", type: "despesa", color: "#ef4444" },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: category.type, deletedAt: null },
    });
    if (!existing) await prisma.category.create({ data: { id: randomUUID(), ...category } });
  }
}

async function cleanupOldE2EEntries(userId: string) {
  await prisma.financialEntry.deleteMany({
    where: {
      userId,
      description: { startsWith: E2E_MARKER },
    },
  });
}
