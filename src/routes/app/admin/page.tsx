import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, CheckCircle2, Search, Shield, UserPlus, Users, XCircle } from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import { EmptyState, MetricCard, PageShell, StatusBadge } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase/client";

type AdminRole = {
  id: string;
  name: string;
  description: string | null;
};

type UserStatus = "pending" | "approved" | "rejected" | "disabled";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: UserStatus;
  roleId: string;
  roleName: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
};

type AdminUsersResponse = {
  roles: AdminRole[];
  users: AdminUser[];
};

type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  roleId: string;
};

const queryKey = ["admin-users"];
const emptyUsers: AdminUser[] = [];
const emptyRoles: AdminRole[] = [];

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  return token;
}

async function fetchAdminUsers(): Promise<AdminUsersResponse> {
  const token = await getAccessToken();
  const response = await fetch("/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Erro ao carregar usuários.");
  return payload;
}

async function createAdminUser(input: CreateUserInput) {
  const token = await getAccessToken();
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Erro ao cadastrar usuário.");
  return payload as { id: string };
}

async function updateAdminUser(input: { id: string; action: string; roleId?: string }) {
  const token = await getAccessToken();
  const response = await fetch(`/api/admin/users/${input.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: input.action, roleId: input.roleId }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Erro ao atualizar usuário.");
  return payload as { ok: true };
}

function formatDateTime(value: string | null) {
  if (!value) return "Nunca";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function roleLabel(roleName: string) {
  const labels: Record<string, string> = {
    primary_admin: "Admin principal",
    admin: "Admin",
    user: "Usuário",
    proprietario: "Proprietário",
    financeiro: "Financeiro",
  };
  return labels[roleName] ?? (roleName || "Sem perfil");
}

export function Component() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey, queryFn: fetchAdminUsers });
  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const updateMutation = useMutation({
    mutationFn: updateAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const users = data?.users ?? emptyUsers;
  const roles = data?.roles ?? emptyRoles;

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesStatus = statusFilter ? user.status === statusFilter : true;
      const matchesTerm = term
        ? [user.name, user.email, user.phone, user.roleName, user.status].filter(Boolean).some((value) => value.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesTerm;
    });
  }, [search, statusFilter, users]);

  const pendingUsers = users.filter((user) => user.status === "pending").length;
  const approvedUsers = users.filter((user) => user.status === "approved").length;
  const blockedUsers = users.filter((user) => user.status === "rejected" || user.status === "disabled").length;

  function resetForm() {
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setRoleId("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createMutation.mutateAsync({ email: email.trim(), password, name: name.trim(), phone: phone.trim(), roleId });
      toast.success("Usuário cadastrado e aprovado.");
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar usuário");
    }
  }

  async function handleAction(user: AdminUser, action: string, roleIdValue?: string) {
    const labels: Record<string, string> = {
      approve: "aprovar",
      reject: "rejeitar",
      disable: "desativar",
      reactivate: "reativar",
      role: "alterar perfil de",
    };
    if (action !== "role" && !window.confirm(`Deseja ${labels[action]} ${user.email}?`)) return;
    try {
      await updateMutation.mutateAsync({ id: user.id, action, roleId: roleIdValue });
      toast.success("Usuário atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar usuário.");
    }
  }

  return (
    <PageShell icon={Shield} title="Admin" subtitle="Aprovação de acessos, perfis e controles administrativos" actionLabel="Novo usuário" onAction={() => setOpen(true)}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Usuários" value={String(users.length)} icon={Users} tone="blue" />
        <MetricCard title="Pendentes" value={String(pendingUsers)} icon={Activity} tone="amber" />
        <MetricCard title="Aprovados" value={String(approvedUsers)} icon={CheckCircle2} tone="green" />
        <MetricCard title="Bloqueados" value={String(blockedUsers)} icon={XCircle} tone="red" />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, e-mail, telefone ou perfil" aria-label="Buscar usuário" />
          </div>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            placeholder="Todos os status"
            aria-label="Filtrar por status"
            options={[
              { value: "pending", label: "Pendentes" },
              { value: "approved", label: "Aprovados" },
              { value: "rejected", label: "Rejeitados" },
              { value: "disabled", label: "Desativados" },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Usuário", "E-mail", "Perfil", "Status", "Solicitado em", "Último acesso", "Ações"].map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-sm text-muted-foreground">Carregando usuários...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState title="Não foi possível carregar usuários." description={error instanceof Error ? error.message : "Verifique as credenciais do Supabase e tente novamente."} />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name || "Sem nome"}</div>
                    {user.phone ? <div className="mt-1 text-xs text-muted-foreground">{user.phone}</div> : null}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      className="min-w-40"
                      value={user.roleId}
                      onChange={(event) => handleAction(user, "role", event.target.value)}
                      placeholder="Sem perfil"
                      options={roles.map((role) => ({ value: role.id, label: roleLabel(role.name) }))}
                      aria-label={`Perfil de ${user.email}`}
                    />
                  </TableCell>
                  <TableCell><StatusBadge status={user.status} /></TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(user.lastSignInAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.status !== "approved" ? (
                        <Button size="sm" onClick={() => handleAction(user, "approve")} disabled={updateMutation.isPending}>Aprovar</Button>
                      ) : null}
                      {user.status === "pending" ? (
                        <Button size="sm" variant="destructive" onClick={() => handleAction(user, "reject")} disabled={updateMutation.isPending}>Rejeitar</Button>
                      ) : null}
                      {user.status === "approved" ? (
                        <Button size="sm" variant="outline" onClick={() => handleAction(user, "disable")} disabled={updateMutation.isPending}>Desativar</Button>
                      ) : null}
                      {user.status === "disabled" || user.status === "rejected" ? (
                        <Button size="sm" variant="secondary" onClick={() => handleAction(user, "reactivate")} disabled={updateMutation.isPending}>Reativar</Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState title="Nenhum usuário encontrado." description="Cadastre usuários ou aguarde novas solicitações de acesso." actionLabel="Novo usuário" onAction={() => setOpen(true)} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={(value) => { if (!value) resetForm(); setOpen(value); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => { resetForm(); setOpen(false); }} />
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>Cadastre um usuário já aprovado no Supabase Auth e vincule um perfil do sistema.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do usuário" />
              </Field>
              <Field label="Telefone">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(00) 00000-0000" />
              </Field>
              <Field label="Email">
                <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="usuario@email.com" />
              </Field>
              <Field label="Senha">
                <Input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" />
              </Field>
              <Field label="Perfil">
                <Select value={roleId} onChange={(event) => setRoleId(event.target.value)} placeholder="Perfil padrao" options={roles.map((role) => ({ value: role.id, label: roleLabel(role.name) }))} />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                <UserPlus className="size-4" />
                {createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
