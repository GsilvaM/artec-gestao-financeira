import { createClient, type User } from "@supabase/supabase-js";
import { prisma } from "../../lib/prisma/client.js";

export const USER_STATUSES = ["pending", "approved", "rejected", "disabled"] as const;
export const ADMIN_ROLES = ["primary_admin", "admin"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

export function getSupabaseEnv() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw Object.assign(
      new Error("Variáveis VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são obrigatórias."),
      { status: 500 },
    );
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [type, token] = authorization.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function createAuthClient() {
  const { supabaseUrl, anonKey } = getSupabaseEnv();
  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getUserFromRequest(request: Request): Promise<User> {
  const token = getBearerToken(request);
  if (!token) {
    throw Object.assign(new Error("Sessão não informada."), { status: 401 });
  }

  const { data, error } = await createAuthClient().auth.getUser(token);
  if (error || !data.user) {
    throw Object.assign(new Error("Sessão inválida ou expirada."), { status: 401 });
  }

  return data.user;
}

export async function requireApprovedUser(request: Request) {
  const user = await getUserFromRequest(request);
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { role: true },
  });

  if (!profile || profile.deletedAt || profile.status !== "approved") {
    throw Object.assign(new Error("Acesso bloqueado. Sua conta ainda não está aprovada ou foi desativada."), { status: 403 });
  }

  return { user, profile };
}

export async function requireAdminUser(request: Request) {
  const session = await requireApprovedUser(request);
  const roleName = session.profile.role?.name ?? "";

  if (!ADMIN_ROLES.includes(roleName as (typeof ADMIN_ROLES)[number])) {
    throw Object.assign(new Error("Acesso restrito a administradores."), { status: 403 });
  }

  return session;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeText(value: unknown, maxLength = 255) {
  if (typeof value !== "string") return "";
  return Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, maxLength);
}

export function validatePassword(password: string) {
  if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "A senha deve conter letras e números.";
  }
  return null;
}
