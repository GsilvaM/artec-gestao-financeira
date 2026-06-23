import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, Mail, Search, Shield, UserCog, UserPlus, Users } from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import { EmptyState, MetricCard, PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
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

type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  roleId: string;
  roleName: string;
  createdAt: string;
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
  if (!token) throw new Error("Sessao expirada. Entre novamente.");
  return token;
}

async function fetchAdminUsers(): Promise<AdminUsersResponse> {
  const token = await getAccessToken();
  const response = await fetch("/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Erro ao carregar usuarios.");
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
  if (!response.ok) throw new Error(payload.error ?? "Erro ao cadastrar usuario.");
  return payload as { id: string };
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
  if (!roleName) return "Sem perfil";
  return roleName.charAt(0).toUpperCase() + roleName.slice(1);
}

export function Component() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: fetchAdminUsers,
  });
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const users = data?.users ?? emptyUsers;
  const roles = data?.roles ?? emptyRoles;

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.roleName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [search, users]);

  const confirmedUsers = users.filter((user) => user.emailConfirmedAt).length;
  const newUsersThisMonth = users.filter((user) => {
    const created = new Date(user.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

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
      await mutateAsync({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        roleId,
      });
      toast.success("Usuario cadastrado");
      resetForm();
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar usuario";
      toast.error(message);
    }
  }

  return (
    <PageShell icon={Shield} title="Admin" subtitle="Usuarios, perfis e controles administrativos" actionLabel="Novo Usuario" onAction={() => setOpen(true)}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Usuarios" value={String(users.length)} icon={Users} tone="blue" />
        <MetricCard title="Confirmados" value={String(confirmedUsers)} icon={Mail} tone="green" />
        <MetricCard title="Perfis" value={String(roles.length)} icon={UserCog} tone="slate" />
        <MetricCard title="Novos no mes" value={String(newUsersThisMonth)} icon={Activity} tone="amber" />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, email ou perfil" aria-label="Buscar usuario" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {["Usuario", "Email", "Perfil", "Status", "Ultimo acesso"].map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-sm text-[#64748B]">Carregando usuarios...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState title="Nao foi possivel carregar usuarios." description={error instanceof Error ? error.message : "Verifique as credenciais do Supabase e tente novamente."} />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name || "Sem nome"}</div>
                    {user.phone ? <div className="mt-1 text-xs text-[#64748B]">{user.phone}</div> : null}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleLabel(user.roleName)}</TableCell>
                  <TableCell>
                    <Badge variant={user.emailConfirmedAt ? "default" : "secondary"}>
                      {user.emailConfirmedAt ? "Confirmado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(user.lastSignInAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState title="Nenhum usuario encontrado." description="Cadastre usuarios para liberar acesso ao sistema." actionLabel="Novo Usuario" onAction={() => setOpen(true)} />
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
            <DialogTitle>Novo Usuario</DialogTitle>
            <DialogDescription>Cadastre um usuario no Supabase Auth e vincule um perfil do sistema.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do usuario" />
              </Field>
              <Field label="Telefone">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(00) 00000-0000" />
              </Field>
              <Field label="Email">
                <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="usuario@email.com" />
              </Field>
              <Field label="Senha">
                <Input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimo 6 caracteres" />
              </Field>
              <Field label="Perfil">
                <Select value={roleId} onChange={(event) => setRoleId(event.target.value)} placeholder="Sem perfil" options={roles.map((role) => ({ value: role.id, label: roleLabel(role.name) }))} />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                <UserPlus className="size-4" />
                {isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
