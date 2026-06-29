import type { User } from "@supabase/supabase-js";
import { prisma } from "../../../lib/prisma/client.js";
import {
  createAdminClient,
  isValidEmail,
  json,
  normalizeText,
  requireApprovedUser,
  requireAdminUser,
  validatePassword,
} from "../auth-utils.js";

type CreateUserBody = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  phone?: string;
  message?: string;
  roleId?: string;
};

async function listAllUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw Object.assign(new Error("Não foi possível listar usuários."), { status: 500 });
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

async function findRoleIdByName(name: string) {
  const role = await prisma.role.findUnique({ where: { name }, select: { id: true } });
  return role?.id ?? null;
}

async function findOrCreateProfileForAuthUser(userId: string) {
  const existing = await prisma.profile.findUnique({
    where: { userId },
    include: { role: true },
  });
  if (existing && !existing.deletedAt) return existing;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;

  const roleId = await findRoleIdByName("user");
  return prisma.profile.upsert({
    where: { userId },
    update: {
      deletedAt: null,
      name: normalizeText(data.user.user_metadata?.name),
      phone: normalizeText(data.user.user_metadata?.phone, 40),
      roleId,
    },
    create: {
      userId,
      name: normalizeText(data.user.user_metadata?.name),
      phone: normalizeText(data.user.user_metadata?.phone, 40),
      roleId,
      status: "pending",
    },
    include: { role: true },
  });
}

async function assertUniqueEmail(email: string) {
  const existing = (await listAllUsers()).find((user) => user.email?.toLowerCase() === email);
  if (existing) return existing;
  return null;
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
        name: profile?.name ?? normalizeText(user.user_metadata?.name),
        phone: profile?.phone ?? normalizeText(user.user_metadata?.phone),
        status: profile?.status ?? "pending",
        roleId: profile?.roleId ?? "",
        roleName: profile?.role?.name ?? "",
        createdAt: user.created_at,
        approvedAt: profile?.approvedAt?.toISOString() ?? null,
        rejectedAt: profile?.rejectedAt?.toISOString() ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmedAt: user.email_confirmed_at ?? null,
      };
    }),
  });
}

async function handleGetMe(request: Request) {
  const { user, profile } = await requireApprovedUser(request);
  return json({
    id: user.id,
    email: user.email ?? "",
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    status: profile.status,
    roleName: profile.role?.name ?? "",
  });
}

async function handleCreateUser(request: Request) {
  const { user: currentUser } = await requireAdminUser(request);
  const body = (await request.json().catch(() => null)) as CreateUserBody | null;

  const email = normalizeText(body?.email, 320).toLowerCase();
  const password = body?.password ?? "";
  const name = normalizeText(body?.name);
  const phone = normalizeText(body?.phone, 40);
  const roleId = normalizeText(body?.roleId) || await findRoleIdByName("user");

  if (!email || !isValidEmail(email)) return json({ error: "Email inválido." }, { status: 400 });
  const passwordError = validatePassword(password);
  if (passwordError) return json({ error: passwordError }, { status: 400 });

  if (roleId) {
    const role = await prisma.role.findFirst({ where: { id: roleId, deletedAt: null } });
    if (!role) return json({ error: "Perfil selecionado não existe." }, { status: 400 });
  }

  const existing = await assertUniqueEmail(email);
  if (existing) return json({ error: "Já existe um usuário com este email." }, { status: 409 });

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, created_by: currentUser.id },
  });

  if (error || !data.user) {
    return json({ error: "Erro ao cadastrar usuário." }, { status: 400 });
  }

  try {
    await prisma.profile.upsert({
      where: { userId: data.user.id },
      update: {
        name,
        phone,
        roleId,
        status: "approved",
        approvedAt: new Date(),
        approvedBy: currentUser.id,
        rejectedAt: null,
        rejectedBy: null,
        deletedAt: null,
      },
      create: {
        userId: data.user.id,
        name,
        phone,
        roleId,
        status: "approved",
        approvedAt: new Date(),
        approvedBy: currentUser.id,
      },
    });
  } catch (err) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw err;
  }

  return json({ id: data.user.id }, { status: 201 });
}

async function handleRequestAccess(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateUserBody | null;
  const email = normalizeText(body?.email, 320).toLowerCase();
  const password = body?.password ?? "";
  const confirmPassword = body?.confirmPassword ?? "";
  const name = normalizeText(body?.name);
  const phone = normalizeText(body?.phone, 40);
  const message = normalizeText(body?.message, 1000);

  if (!name) return json({ error: "Nome completo é obrigatório." }, { status: 400 });
  if (!email || !isValidEmail(email)) return json({ error: "Email inválido." }, { status: 400 });
  const passwordError = validatePassword(password);
  if (passwordError) return json({ error: passwordError }, { status: 400 });
  if (password !== confirmPassword) return json({ error: "A confirmação de senha não confere." }, { status: 400 });

  const existing = await assertUniqueEmail(email);
  if (existing) return json({ error: "Já existe uma conta ou solicitação para este email." }, { status: 409 });

  const roleId = await findRoleIdByName("user");
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, access_request_message: message },
  });

  if (error || !data.user) return json({ error: "Não foi possível enviar a solicitação." }, { status: 400 });

  try {
    await prisma.profile.create({
      data: {
        userId: data.user.id,
        name,
        phone,
        roleId,
        status: "pending",
      },
    });
  } catch (err) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw err;
  }

  return json({ message: "Sua solicitação foi enviada e está aguardando aprovação de um administrador." }, { status: 201 });
}

async function handleUpdateUser(request: Request, userId: string | undefined) {
  const { user: currentUser, profile: currentProfile } = await requireAdminUser(request);
  if (!userId) return json({ error: "Usuário não informado." }, { status: 400 });

  const body = (await request.json().catch(() => null)) as { action?: string; roleId?: string } | null;
  const action = normalizeText(body?.action, 32);
  const now = new Date();
  const admin = createAdminClient();

  const target = await findOrCreateProfileForAuthUser(userId);
  if (!target) return json({ error: "Usuário não encontrado." }, { status: 404 });
  if (userId === currentUser.id && ["reject", "disable"].includes(action)) {
    return json({ error: "Você não pode bloquear sua própria conta." }, { status: 400 });
  }

  if (action === "approve") {
    await prisma.profile.update({
      where: { userId },
      data: { status: "approved", approvedAt: now, approvedBy: currentUser.id, rejectedAt: null, rejectedBy: null },
    });
    return json({ ok: true });
  }

  if (action === "reject") {
    await prisma.profile.update({
      where: { userId },
      data: { status: "rejected", rejectedAt: now, rejectedBy: currentUser.id },
    });
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    return json({ ok: true });
  }

  if (action === "disable") {
    await prisma.profile.update({ where: { userId }, data: { status: "disabled" } });
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    return json({ ok: true });
  }

  if (action === "reactivate") {
    await prisma.profile.update({
      where: { userId },
      data: { status: "approved", approvedAt: now, approvedBy: currentUser.id, rejectedAt: null, rejectedBy: null },
    });
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
    return json({ ok: true });
  }

  if (action === "role") {
    const roleId = normalizeText(body?.roleId) || null;
    const role = roleId ? await prisma.role.findFirst({ where: { id: roleId, deletedAt: null } }) : null;
    if (!role) return json({ error: "Perfil selecionado não existe." }, { status: 400 });
    if (role.name === "primary_admin" && currentProfile.role?.name !== "primary_admin") {
      return json({ error: "Somente o administrador principal pode promover outro administrador principal." }, { status: 403 });
    }
    await prisma.profile.update({ where: { userId }, data: { roleId } });
    return json({ ok: true });
  }

  return json({ error: "Ação administrativa inválida." }, { status: 400 });
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/api\/admin\/?/, "").split("/").filter(Boolean);
    const resource = segments[0];

    if (resource === "me" && request.method === "GET") {
      return await handleGetMe(request);
    }

    if (resource === "access-requests" && request.method === "POST") {
      return await handleRequestAccess(request);
    }

    if (resource !== "users") {
      return json({ error: "Recurso administrativo não encontrado." }, { status: 404 });
    }

    if (request.method === "GET") return await handleGetUsers(request);
    if (request.method === "POST") return await handleCreateUser(request);
    if (request.method === "PATCH") return await handleUpdateUser(request, segments[1]);
    return json({ error: "Método não permitido." }, { status: 405 });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Erro desconhecido.");
    const status = typeof (error as Error & { status?: unknown }).status === "number"
      ? (error as Error & { status: number }).status
      : 500;
    if (status >= 500) console.error("[api/admin]", error);
    return json({ error: status >= 500 ? "Erro interno do servidor." : error.message }, { status });
  }
}
