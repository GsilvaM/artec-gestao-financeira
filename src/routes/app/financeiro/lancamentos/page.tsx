import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowDownCircle, ArrowUpCircle, Banknote, FileText, ListChecks, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, MoneyValue, MonthSelect, PageShell, StatusBadge, StatusSelect } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinancialEntries, useCreateFinancialEntry, useUpdateFinancialEntry, useDeleteFinancialEntry } from "@/domain/financeiro/hooks/use-financial-entries";
import { useCategories } from "@/domain/financeiro/hooks/use-categories";
import { useAuthStore } from "@/lib/supabase/auth-store";
import type { FinancialEntryRow } from "@/domain/financeiro/types";

const schema = z.object({
  data: z.string().min(1, "Informe a data"),
  tipo: z.enum(["receita", "despesa"], { required_error: "Informe o tipo" }),
  categoria: z.string().min(1, "Selecione a categoria"),
  descricao: z.string().min(3, "Informe a descrição"),
  pessoa: z.string().optional(),
  valor: z.coerce.number().positive("Informe um valor maior que zero"),
  status: z.enum(["aberto", "pago", "vencido"]),
  observacoes: z.string().optional(),
});

type FormState = z.input<typeof schema>;

const initialForm: FormState = {
  data: "",
  tipo: "receita",
  categoria: "",
  descricao: "",
  pessoa: "",
  valor: "",
  status: "aberto",
  observacoes: "",
};

const STATUS_MAP: Record<string, string> = {
  aberto: "pending",
  pago: "confirmed",
  vencido: "cancelled",
};

const STATUS_REVERSE: Record<string, string> = {
  pending: "aberto",
  confirmed: "pago",
  cancelled: "vencido",
};

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const user = useAuthStore((state) => state.user);
  const { data: entries, isLoading, error } = useFinancialEntries();
  const { data: categories } = useCategories();
  const { mutateAsync: createEntry, isPending: saving } = useCreateFinancialEntry();
  const { mutateAsync: updateEntry, isPending: updating } = useUpdateFinancialEntry();
  const { mutateAsync: deleteEntry, isPending: deleting } = useDeleteFinancialEntry();

  const isEditing = !!editingId;
  const isWorking = saving || updating;

  const receitas = (entries ?? []).filter((e) => e.type === "receita").reduce((sum, e) => sum + e.amount, 0);
  const despesas = (entries ?? []).filter((e) => e.type === "despesa").reduce((sum, e) => sum + e.amount, 0);
  const saldo = receitas - despesas;

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function findCategoryId(name: string): string | null {
    const match = (categories ?? []).find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.type === form.tipo,
    );
    return match?.id ?? null;
  }

  function handleEdit(entry: FinancialEntryRow) {
    const parsedDate = entry.date ? new Date(entry.date + (entry.date.includes("T") ? "" : "T00:00:00")) : new Date();
    setForm({
      data: parsedDate.toISOString().slice(0, 10),
      tipo: entry.type,
      categoria: entry.categoryName,
      descricao: entry.description,
      pessoa: entry.notes?.startsWith("Cliente/Fornecedor: ") ? entry.notes.replace("Cliente/Fornecedor: ", "").split(" | ")[0] : "",
      valor: entry.amount,
      status: STATUS_REVERSE[entry.status] ?? "aberto",
      observacoes: entry.notes?.startsWith("Cliente/Fornecedor: ") ? entry.notes.split(" | ").slice(1).join(" | ") : entry.notes ?? "",
    });
    setEditingId(entry.id);
    setOpen(true);
  }

  function handleDelete(entry: FinancialEntryRow) {
    setDeletingId(entry.id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      toast.success("Lançamento excluído");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir lançamento";
      console.error("[delete-entry]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error("Revise os campos do lançamento");
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const categoryId = findCategoryId(parsed.data.categoria);
    if (!categoryId) {
      toast.error("Categoria não encontrada. Cadastre-a em Financeiro > Categorias primeiro.");
      return;
    }

    const parts = [parsed.data.observacoes];
    if (parsed.data.pessoa) parts.unshift(`Cliente/Fornecedor: ${parsed.data.pessoa}`);
    const notes = parts.filter(Boolean).join(" | ") || null;

    try {
      if (editingId) {
        await updateEntry({
          id: editingId,
          data: {
            description: parsed.data.descricao,
            amount: parsed.data.valor,
            type: parsed.data.tipo,
            date: new Date(parsed.data.data + "T00:00:00"),
            status: STATUS_MAP[parsed.data.status] ?? "pending",
            categoryId,
            notes,
          },
        });
        toast.success("Lançamento atualizado");
      } else {
        await createEntry({
          description: parsed.data.descricao,
          amount: parsed.data.valor,
          type: parsed.data.tipo,
          date: new Date(parsed.data.data + "T00:00:00"),
          status: STATUS_MAP[parsed.data.status] ?? "pending",
          categoryId,
          userId: user.id,
          notes,
        });
        toast.success("Lançamento criado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar lançamento";
      console.error("[save-entry]", msg, err);
      toast.error(msg);
    }
  }

  return (
    <PageShell icon={FileText} title="Lançamentos" subtitle="Cadastre receitas, custos e despesas" actionLabel="Novo Lançamento" onAction={() => { resetForm(); setOpen(true); }}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Lançamentos" value={String(entries?.length ?? 0)} icon={ListChecks} tone="blue" />
        <MetricCard title="Receitas" value={formatMoney(receitas)} icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas" value={formatMoney(despesas)} icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Saldo" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} />
      </div>
      <FilterBar searchPlaceholder="Buscar por descrição, cliente ou fornecedor...">
        <MonthSelect />
        <StatusSelect />
      </FilterBar>
      <Card className="overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>{["Data", "Tipo", "Categoria", "Descrição", "Valor", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-destructive">
                  Erro ao carregar lançamentos
                </TableCell>
              </TableRow>
            ) : entries?.length ? entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>{entry.type === "receita" ? "Receita" : "Despesa"}</TableCell>
                <TableCell>{entry.categoryName}</TableCell>
                <TableCell className="font-medium">{entry.description}</TableCell>
                <TableCell><MoneyValue value={formatMoney(Number(entry.amount))} tone={entry.type === "receita" ? "positive" : "negative"} /></TableCell>
                <TableCell><StatusBadge status={entry.status as never} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações do lançamento"><MoreHorizontal className="size-4" /></Button>
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
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState title="Nenhum lançamento encontrado." description="Use o botão Novo Lançamento para cadastrar receitas, custos ou despesas." actionLabel="Novo Lançamento" onAction={() => { resetForm(); setOpen(true); }} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => { resetForm(); setOpen(false); }} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
            <DialogDescription>{isEditing ? "Altere os dados do lançamento selecionado." : "Registre uma receita, custo ou despesa com os dados essenciais."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data" error={errors.data}><Input type="date" value={form.data} onChange={(e) => updateField("data", e.target.value)} /></Field>
            <Field label="Tipo" error={errors.tipo}><Select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} /></Field>
            <Field label="Categoria" error={errors.categoria}>
              <Select value={form.categoria} onChange={(e) => updateField("categoria", e.target.value)}
                options={(categories ?? [])
                  .filter((c) => c.type === form.tipo)
                  .map((c) => ({ value: c.name, label: c.name }))}
                placeholder={categories?.length ? "Selecione..." : "Nenhuma categoria"} />
            </Field>
            <Field label="Status" error={errors.status}><Select value={form.status} onChange={(e) => updateField("status", e.target.value)} options={[{ value: "aberto", label: "Aberto" }, { value: "pago", label: "Pago" }, { value: "vencido", label: "Vencido" }]} /></Field>
            <Field label="Descrição" error={errors.descricao}><Input value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} placeholder="Descrição do lançamento" /></Field>
            <Field label="Cliente/Fornecedor"><Input value={form.pessoa ?? ""} onChange={(e) => updateField("pessoa", e.target.value)} placeholder="Nome relacionado" /></Field>
            <Field label="Valor" error={errors.valor}><Input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => updateField("valor", e.target.value)} placeholder="0,00" /></Field>
            <Field label="Observações"><Textarea value={form.observacoes ?? ""} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Informações adicionais" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isWorking}>{isWorking ? "Salvando..." : isEditing ? "Atualizar Lançamento" : "Salvar Lançamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeletingId(null)} />
          <DialogHeader>
            <DialogTitle>Excluir Lançamento</DialogTitle>
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error ? <p className="text-xs font-medium text-[#EF4444]">{error}</p> : null}</div>;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return value ? new Date(value + (value.includes("T") ? "" : "T00:00:00")).toLocaleDateString("pt-BR") : "-";
}
