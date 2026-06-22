import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowDownCircle, ArrowUpCircle, Banknote, FileText, ListChecks, MoreHorizontal } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, MoneyValue, MonthSelect, PageShell, StatusBadge, StatusSelect } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const schema = z.object({
  data: z.string().min(1, "Informe a data"),
  tipo: z.enum(["receita", "despesa"], { required_error: "Informe o tipo" }),
  categoria: z.string().min(2, "Informe a categoria"),
  descricao: z.string().min(3, "Informe a descrição"),
  pessoa: z.string().min(2, "Informe cliente ou fornecedor"),
  valor: z.coerce.number().positive("Informe um valor maior que zero"),
  status: z.enum(["aberto", "pago", "vencido"]),
  observacoes: z.string().optional(),
});

type Entry = z.infer<typeof schema> & { id: string };
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

export function Component() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const receitas = entries.filter((entry) => entry.tipo === "receita").reduce((sum, entry) => sum + entry.valor, 0);
  const despesas = entries.filter((entry) => entry.tipo === "despesa").reduce((sum, entry) => sum + entry.valor, 0);
  const saldo = receitas - despesas;

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSave() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error("Revise os campos do lançamento");
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setEntries((current) => [{ id: crypto.randomUUID(), ...parsed.data }, ...current]);
    setSaving(false);
    setOpen(false);
    setForm(initialForm);
    toast.success("Lançamento criado");
  }

  return (
    <PageShell icon={FileText} title="Lançamentos" subtitle="Cadastre receitas, custos e despesas" actionLabel="Novo Lançamento" onAction={() => setOpen(true)}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Lançamentos" value={String(entries.length)} icon={ListChecks} tone="blue" />
        <MetricCard title="Receitas" value={formatMoney(receitas)} icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas" value={formatMoney(despesas)} icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Saldo" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} />
      </div>
      <FilterBar searchPlaceholder="Buscar por descrição, cliente ou fornecedor...">
        <MonthSelect />
        <StatusSelect />
      </FilterBar>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>{["Data", "Tipo", "Categoria", "Descrição", "Cliente/Fornecedor", "Valor", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {entries.length ? entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.data)}</TableCell>
                <TableCell>{entry.tipo === "receita" ? "Receita" : "Despesa"}</TableCell>
                <TableCell>{entry.categoria}</TableCell>
                <TableCell className="font-medium">{entry.descricao}</TableCell>
                <TableCell>{entry.pessoa}</TableCell>
                <TableCell><MoneyValue value={formatMoney(entry.valor)} tone={entry.tipo === "receita" ? "positive" : "negative"} /></TableCell>
                <TableCell><StatusBadge status={entry.status} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" aria-label="Ações do lançamento"><MoreHorizontal className="size-4" /></Button></TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState title="Nenhum lançamento encontrado." description="Use o botão Novo Lançamento para cadastrar receitas, custos ou despesas." actionLabel="Novo Lançamento" onAction={() => setOpen(true)} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setOpen(false)} />
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
            <DialogDescription>Registre uma receita, custo ou despesa com os dados essenciais.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data" error={errors.data}><Input type="date" value={form.data} onChange={(e) => updateField("data", e.target.value)} /></Field>
            <Field label="Tipo" error={errors.tipo}><Select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} /></Field>
            <Field label="Categoria" error={errors.categoria}><Input value={form.categoria} onChange={(e) => updateField("categoria", e.target.value)} placeholder="Ex: Manutenção" /></Field>
            <Field label="Status" error={errors.status}><Select value={form.status} onChange={(e) => updateField("status", e.target.value)} options={[{ value: "aberto", label: "Aberto" }, { value: "pago", label: "Pago" }, { value: "vencido", label: "Vencido" }]} /></Field>
            <Field label="Descrição" error={errors.descricao}><Input value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} placeholder="Descrição do lançamento" /></Field>
            <Field label="Cliente/Fornecedor" error={errors.pessoa}><Input value={form.pessoa} onChange={(e) => updateField("pessoa", e.target.value)} placeholder="Nome relacionado" /></Field>
            <Field label="Valor" error={errors.valor}><Input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => updateField("valor", e.target.value)} placeholder="0,00" /></Field>
            <Field label="Observações"><Textarea value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Informações adicionais" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Lançamento"}</Button>
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
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "-";
}
