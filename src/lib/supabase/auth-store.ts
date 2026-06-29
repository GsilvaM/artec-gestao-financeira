import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./client";

interface AuthProfile {
  status: string;
  roleName: string;
}

interface AuthState {
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  initialized: boolean;
  accessError: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  accessError: null,
  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const result = await validateApprovedSession(data.session.access_token);
      if (result.error) {
        await supabase.auth.signOut();
        set({ user: null, profile: null, loading: false, initialized: true, accessError: result.error });
      } else {
        set({ user: data.session.user, profile: result.profile, loading: false, initialized: true, accessError: null });
      }
    } else {
      set({ user: null, profile: null, loading: false, initialized: true, accessError: null });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set((state) => ({ user: session?.user ?? null, profile: session?.user ? state.profile : null }));
    });
  },
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "Email ou senha inválidos." };
    if (!data.session) return { error: "Sessão não retornada pelo provedor de autenticação." };
    const result = await validateApprovedSession(data.session.access_token);
    if (result.error) {
      await supabase.auth.signOut();
      set({ user: null, profile: null, accessError: result.error });
      return { error: result.error };
    }
    set({ user: data.user, profile: result.profile, accessError: null });
    return { error: null };
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, accessError: null });
  },
}));

async function validateApprovedSession(token: string) {
  const response = await fetch("/api/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.ok) {
    const payload = await response.json().catch(() => null);
    return { error: null, profile: { status: payload?.status ?? "", roleName: payload?.roleName ?? "" } };
  }
  const payload = await response.json().catch(() => null);
  return { error: payload?.error ?? "Acesso bloqueado. Aguarde aprovação de um administrador.", profile: null };
}
