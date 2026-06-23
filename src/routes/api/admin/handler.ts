import { createClient, type User } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma/client.js";

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw Object.assign(
      new Error("Variaveis VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias."),
      { status: 500 },
    );
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [type, token] = authorization.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

async function requireAdminUser(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    throw Object.assign(new Error("Sessao nao informada."), { status: 401 });
  }

  const { supabaseUrl, anonKey } = getSupabaseEnv();
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    throw Object.assign(new Error("Sessao invalida ou expirada."), { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: data.user.id },
    include: { role: true },
  });

  if (profile?.role?.name !== "admin") {
    throw Object.assign(new Error("Acesso restrito a administradores."), { status: 403 });
  }

  return data.user;
}

function createAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function listAllUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

async function handleGetUsers(request: Request) {
  await requireAdminUser(request);

  const [users, roles] = await Promise.all([
    listAllUsers(),
    prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    }),
  ]);

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: users.map((user) => user.id) }, deletedAt: null },
    include: { role: true },
  });
  const profilesByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));

  return json({
    roles,
    users: users.map((user) => {
      const profile = profilesByUserId.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        name: profile?.name ?? user.user_metadata?.name ?? "",
        phone: profile?.phone ?? user.user_metadata?.phone ?? "",
        roleId: profile?.roleId ?? "",
        roleName: profile?.role?.name ?? "",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmedAt: user.email_confirmed_at ?? null,
      };
    }),
  });
}

async function handleCreateUser(request: Request) {
  const currentUser = await requireAdminUser(request);
  const body = await request.json().catch(() => null) as {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    roleId?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const name = body?.name?.trim() ?? "";
  const phone = body?.phone?.trim() ?? "";
  const roleId = body?.roleId?.trim() || null;

  if (!email) return json({ error: "Email e obrigatorio." }, { status: 400 });
  if (password.length < 6) return json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });

  if (roleId) {
    const role = await prisma.role.findFirst({ where: { id: roleId, deletedAt: null } });
    if (!role) return json({ error: "Perfil selecionado nao existe." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, created_by: currentUser.id },
  });

  if (error || !data.user) {
    return json({ error: error?.message ?? "Erro ao cadastrar usuario." }, { status: 400 });
  }

  try {
    await prisma.profile.upsert({
      where: { userId: data.user.id },
      update: { name, phone, roleId, deletedAt: null },
      create: { userId: data.user.id, name, phone, roleId },
    });
  } catch (err) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw err;
  }

  return json({ id: data.user.id }, { status: 201 });
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/api\/admin\/?/, "").split("/").filter(Boolean);
    const resource = segments[0];

    if (resource !== "users") {
      return json({ error: "Recurso administrativo nao encontrado." }, { status: 404 });
    }

    if (request.method === "GET") return await handleGetUsers(request);
    if (request.method === "POST") return await handleCreateUser(request);
    return json({ error: "Metodo nao permitido." }, { status: 405 });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Erro desconhecido.");
    const status = typeof (error as Error & { status?: unknown }).status === "number"
      ? (error as Error & { status: number }).status
      : 500;
    if (status >= 500) console.error("[api/admin]", error);
    return json({ error: error.message }, { status });
  }
}
