import { useState } from "react";
import { toast } from "sonner";
import { Banknote, CalendarCheck, CircleDollarSign, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge, StatusSelect } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountsReceivable, useCreateAccountReceivable, useUpdateAccountReceivable, useDeleteAccountReceivable } from "@/domain/financeiro/hooks/use-accounts";
import { useCategories } from "@/domain/financeiro/hooks/use-categories";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { formatDate, formatMoney, parseMoneyInput, toFiniteNumber } from "@/lib/utils";
import type { AccountReceivableRow } from "@/domain/financeiro/types";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<AccountReceivableRow["status"]>("pending");

  const user = useAuthStore((state) => state.user);
  const { data: entries, isLoading } = useAccountsReceivable();
  const { data: categories } = useCategories();
  const { mutateAsync: createEntry, isPending: creating } = useCreateAccountReceivable();
  const { mutateAsync: updateEntry, isPending: updating } = useUpdateAccountReceivable();
  const { mutateAsync: deleteEntry, isPending: deleting } = useDeleteAccountReceivable();

  const isEditing = !!editingId;
  const isWorking = creating || updating;

  function resetForm() {
    setDescription("");
    setAmount("");
    setDueDate("");
    setClient("");
    setCategoryId("");
    setStatus("pending");
    setEditingId(null);
  }

  function handleEdit(entry: AccountReceivableRow) {
    setDescription(entry.description);
    setAmount(String(entry.amount));
    setDueDate(entry.dueDate ? new Date(entry.dueDate + (entry.dueDate.includes("T") ? "" : "T00:00:00")).toISOString().slice(0, 10) : "");
    setClient(entry.client ?? "");
    setCategoryId(entry.categoryId);
    setStatus(entry.status);
    setEditingId(entry.id);
    setOpen(true);
  }

  function handleDelete(entry: AccountReceivableRow) {
    setDeletingId(entry.id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      toast.success("Conta a receber excluída");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir conta a receber";
      console.error("[delete-accounts-receivable]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    if (!description.trim()) { toast.error("Informe a descrição"); return; }
    const parsedAmount = parseMoneyInput(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) { toast.error("Informe um valor válido"); return; }
    if (!dueDate) { toast.error("Informe a data de vencimento"); return; }
    if (!categoryId) { toast.error("Selecione a categoria"); return; }
    if (!user) { toast.error("Usuário não autenticado"); return; }

    try {
      const payload = {
        description: description.trim(),
        amount: parsedAmount,
        dueDate: new Date(dueDate + "T00:00:00"),
        status,
        categoryId,
        client: client.trim() || undefined,
        userId: user.id,
      };
      if (editingId) {
        await updateEntry({ id: editingId, data: payload });
        toast.success("Conta a receber atualizada");
      } else {
        await createEntry(payload);
        toast.success("Conta a receber criada");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar conta a receber";
      console.error("[save-accounts-receivable]", msg, err);
      toast.error(msg);
    }
  }

  const receivableEntries = entries ?? [];
  const openEntries = receivableEntries.filter((e) => e.status === "pending" || e.status === "overdue");
  const openAmount = openEntries.reduce((sum, e) => sum + toFiniteNumber(e.amount), 0);
  const receivedAmount = receivableEntries.filter((e) => e.status === "received").reduce((sum, e) => sum + toFiniteNumber(e.amount), 0);

  const statusOptions = [
    { value: "pending", label: "Pendente" },
    { value: "received", label: "Recebido" },
    { value: "overdue", label: "Vencido" },
    { value: "cancelled", label: "Cancelado" },
  ];

  return (
    <PageShell icon={CircleDollarSign} title="Contas a Receber" subtitle="Controle recebíveis, clientes e previsões de entrada" actionLabel="Nova Conta" onAction={() => { resetForm(); setOpen(true); }}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="A receber" value={formatMoney(openAmount)} icon={Banknote} tone="green" helper={`${openEntries.length} conta(s)`} />
        <MetricCard title="Recebidas" value={formatMoney(receivedAmount)} icon={CalendarCheck} tone="blue" />
        <MetricCard title="Pendentes" value={String(receivableEntries.filter((e) => e.status === "pending").length)} icon={Clock} tone="amber" />
      </div>
      <FilterBar searchPlaceholder="Buscar conta a receber..."><StatusSelect /></FilterBar>
      <Card className="overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>{["Vencimento", "Cliente", "Descrição", "Categoria", "Valor", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="h-48 text-center text-sm text-[#64748B]">Carregando...</TableCell></TableRow>
            ) : entries?.length ? entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.dueDate)}</TableCell>
                <TableCell>{entry.client ?? "-"}</TableCell>
                <TableCell className="font-medium">{entry.description}</TableCell>
                <TableCell>{entry.categoryName}</TableCell>
                <TableCell>{formatMoney(entry.amount)}</TableCell>
                <TableCell><StatusBadge status={entry.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(entry)}><Pencil className="size-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => handleDelete(entry)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} className="p-0"><EmptyState title="Nenhuma conta a receber encontrada." description="Cadastre receitas previstas para acompanhar entradas futuras." actionLabel="Nova Conta" onAction={() => { resetForm(); setOpen(true); }} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => { resetForm(); setOpen(false); }} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Conta a Receber" : "Nova Conta a Receber"}</DialogTitle>
            <DialogDescription>{isEditing ? "Altere os dados da conta." : "Registre uma receita prevista."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Descrição"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição da conta" /></Field>
            <Field label="Cliente"><Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nome do cliente" /></Field>
            <Field label="Valor"><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></Field>
            <Field label="Vencimento"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            <Field label="Categoria">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Selecione..." />
            </Field>
            <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value as AccountReceivableRow["status"])} options={statusOptions} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isWorking}>{isWorking ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeletingId(null)} />
          <DialogHeader>
            <DialogTitle>Excluir Conta a Receber</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. Confirma a exclusão?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>{deleting ? "Excluindo..." : "Excluir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
