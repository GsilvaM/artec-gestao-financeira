import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  FileText,
  ListChecks,
} from "lucide-react";
import {
  LancamentoModal,
  type LancamentoFormState,
} from "@/components/lancamentos/LancamentoModal";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useFinancialEntries,
  useCreateFinancialEntry,
  useUpdateFinancialEntry,
  useDeleteFinancialEntry,
} from "@/domain/financeiro/hooks/use-financial-entries";
import { useCategories } from "@/domain/financeiro/hooks/use-categories";
import { useCollaborators } from "@/domain/financeiro/hooks/use-collaborators";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { calculateFinancialSummary } from "@/domain/financeiro/calculations";
import { formatMoney } from "@/lib/utils";
import { SummaryCard } from "@/components/lancamentos/SummaryCard";
import { TransactionFilters } from "@/components/lancamentos/TransactionFilters";
import { ResponsiveTransactionList } from "./responsive-transaction-list";
import type {
  FinancialEntryRow,
  FinancialEntryFilters,
} from "@/domain/financeiro/types";

const schema = z.object({
  data: z.string().min(1, "Informe a data"),
  tipo: z.enum(["receita", "despesa"], { required_error: "Informe o tipo" }),
  categoria: z.string().min(1, "Selecione a categoria"),
  descricao: z.string().min(3, "Informe a descrição"),
  cliente: z.string().optional(),
  colaborador: z.string().optional(),
  valor: z.preprocess((v) => {
    if (typeof v !== "string") return v;
    const input = v.trim();
    if (!input) return undefined;
    const normalized = input.includes(",")
      ? input.replace(/\./g, "").replace(",", ".")
      : input;
    return Number(normalized);
  }, z.number().positive("Informe um valor maior que zero")),
  status: z.enum(["aberto", "pago", "vencido"]),
  observacoes: z.string().optional(),
});

const initialForm: LancamentoFormState = {
  data: "",
  tipo: "receita",
  categoria: "",
  descricao: "",
  cliente: "",
  colaborador: "",
  valor: "",
  status: "aberto",
  observacoes: "",
};

const STATUS_MAP: Record<string, string> = {
  aberto: "pending",
  pago: "confirmed",
  vencido: "cancelled",
  cancelado: "cancelled",
  estornado: "reversed",
};

const STATUS_REVERSE: Record<string, string> = {
  pending: "aberto",
  confirmed: "pago",
  cancelled: "vencido",
};

function isOriginatedEntry(entry: FinancialEntryRow) {
  return (
    entry.notes?.includes("[originType=accounts_payable;") ||
    entry.notes?.includes("[originType=accounts_receivable;")
  );
}

function resolvePeriod(
  period: string,
  dateFrom: string,
  dateTo: string,
): { dateFrom?: Date; dateTo?: Date } {
  const now = new Date();
  if (period === "today") {
    return {
      dateFrom: startOfDay(now),
      dateTo: endOfDay(now),
    };
  }
  if (period === "week") {
    const start = startOfDay(now);
    start.setDate(now.getDate() - now.getDay());
    const end = endOfDay(start);
    end.setDate(start.getDate() + 6);
    return { dateFrom: start, dateTo: end };
  }
  if (period === "month") {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth(), 1),
      dateTo: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "year") {
    return {
      dateFrom: new Date(now.getFullYear(), 0, 1),
      dateTo: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }
  if (period === "custom") {
    return {
      dateFrom: dateFrom ? new Date(dateFrom + "T00:00:00") : undefined,
      dateTo: dateTo ? new Date(dateTo + "T23:59:59.999") : undefined,
    };
  }
  return {};
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );
}

export function Component() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"criar" | "editar" | "duplicar">("criar");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FinancialEntryRow | null>(
    null
  );
  const [duplicatingEntry, setDuplicatingEntry] =
    useState<FinancialEntryRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<LancamentoFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");

  const filters = useMemo<FinancialEntryFilters | undefined>(() => {
    const f: FinancialEntryFilters = {};
    if (search) f.search = search;
    if (filterType)
      f.type = filterType as FinancialEntryFilters["type"];
    if (filterStatus)
      f.status = (STATUS_MAP[filterStatus] ??
        filterStatus) as FinancialEntryFilters["status"];
    if (filterCategoryId) f.categoryId = filterCategoryId;
    if (filterOrigin) f.origin = filterOrigin as FinancialEntryFilters["origin"];
    if (filterPaymentMethod) f.paymentMethod = filterPaymentMethod;

    const period = resolvePeriod(filterPeriod, filterDateFrom, filterDateTo);
    if (period.dateFrom) f.dateFrom = period.dateFrom;
    if (period.dateTo) f.dateTo = period.dateTo;
    return Object.keys(f).length ? f : undefined;
  }, [
    search,
    filterType,
    filterStatus,
    filterCategoryId,
    filterOrigin,
    filterPaymentMethod,
    filterPeriod,
    filterDateFrom,
    filterDateTo,
  ]);

  const user = useAuthStore((state) => state.user);
  const { data: entries, isLoading, error } = useFinancialEntries(filters);
  const { data: categories } = useCategories();
  const { data: collaborators } = useCollaborators();
  const { mutateAsync: createEntry, isPending: saving } =
    useCreateFinancialEntry();
  const { mutateAsync: updateEntry, isPending: updating } =
    useUpdateFinancialEntry();
  const { mutateAsync: deleteEntry, isPending: deleting } =
    useDeleteFinancialEntry();

  const isWorking = saving || updating;
  const { receitas, despesas, saldo } = calculateFinancialSummary(
    entries ?? []
  );

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setEditingEntry(null);
    setDuplicatingEntry(null);
    setMode("criar");
    setErrors({});
  }

  function updateField(field: keyof LancamentoFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function findCategoryId(name: string): string | null {
    const match = (categories ?? []).find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.type === form.tipo
    );
    return match?.id ?? null;
  }

  function handleEdit(entry: FinancialEntryRow) {
    if (isOriginatedEntry(entry)) {
      toast.info(
        "Lancamento automatico de contas a pagar/receber fica bloqueado para edicao direta."
      );
      return;
    }
    const parsedDate = entry.date
      ? new Date(entry.date + (entry.date.includes("T") ? "" : "T00:00:00"))
      : new Date();
    setForm({
      data: parsedDate.toISOString().slice(0, 10),
      tipo: entry.type,
      categoria: entry.categoryName,
      descricao: entry.description,
      cliente:
        entry.clientName ??
        (entry.notes?.startsWith("Cliente/Fornecedor: ")
          ? entry.notes.replace("Cliente/Fornecedor: ", "").split(" | ")[0]
          : "") ??
        "",
      colaborador: entry.collaboratorId ?? "",
      valor: entry.amount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      status: (STATUS_REVERSE[entry.status] ?? "aberto") as
        | "aberto"
        | "pago"
        | "vencido",
      observacoes: entry.notes?.startsWith("Cliente/Fornecedor: ")
        ? entry.notes.split(" | ").slice(1).join(" | ")
        : (entry.notes ?? ""),
    });
    setEditingId(entry.id);
    setEditingEntry(entry);
    setDuplicatingEntry(null);
    setMode("editar");
    setOpen(true);
  }

  function handleDuplicate(entry: FinancialEntryRow) {
    if (isOriginatedEntry(entry)) {
      toast.info(
        "Lancamento automatico de contas a pagar/receber nao pode ser duplicado diretamente."
      );
      return;
    }
    setForm({
      data: "",
      tipo: entry.type,
      categoria: entry.categoryName,
      descricao: entry.description,
      cliente:
        entry.clientName ??
        (entry.notes?.startsWith("Cliente/Fornecedor: ")
          ? entry.notes.replace("Cliente/Fornecedor: ", "").split(" | ")[0]
          : "") ??
        "",
      colaborador: entry.collaboratorId ?? "",
      valor: entry.amount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      status: (STATUS_REVERSE[entry.status] ?? "aberto") as
        | "aberto"
        | "pago"
        | "vencido",
      observacoes: entry.notes?.startsWith("Cliente/Fornecedor: ")
        ? entry.notes.split(" | ").slice(1).join(" | ")
        : (entry.notes ?? ""),
    });
    setEditingId(null);
    setEditingEntry(null);
    setDuplicatingEntry(entry);
    setMode("duplicar");
    setErrors({});
    setOpen(true);
  }

  function handleDelete(entry: FinancialEntryRow) {
    if (isOriginatedEntry(entry)) {
      toast.info(
        "Lancamento automatico de contas a pagar/receber fica bloqueado ate existir rotina de estorno."
      );
      return;
    }
    setDeletingId(entry.id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      toast.success("Lançamento excluído");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao excluir lançamento";
      console.error("[delete-entry]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ])
        )
      );
      toast.error("Revise os campos do lançamento");
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const categoryId = findCategoryId(parsed.data.categoria);
    if (!categoryId) {
      toast.error(
        "Categoria não encontrada. Cadastre-a em Financeiro > Categorias primeiro."
      );
      return;
    }

    const notes = parsed.data.observacoes?.trim() || undefined;
    const clientName = parsed.data.cliente?.trim() || null;
    const collaboratorId = parsed.data.colaborador || null;

    try {
      if (editingId) {
        await updateEntry({
          id: editingId,
          data: {
            description: parsed.data.descricao,
            amount: parsed.data.valor,
            type: parsed.data.tipo,
            date: new Date(parsed.data.data + "T00:00:00"),
            status: (STATUS_MAP[parsed.data.status] ?? "pending") as
              | "pending"
              | "confirmed"
              | "cancelled",
            categoryId,
            clientName,
            collaboratorId,
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
          clientName,
          collaboratorId,
          userId: user.id,
          notes,
        });
        toast.success("Lançamento criado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar lançamento";
      console.error("[save-entry]", msg, err);
      toast.error(msg);
    }
  }

  return (
    <PageShell
      icon={FileText}
      title="Lançamentos"
      subtitle="Cadastre receitas, custos e despesas com menos cliques."
      actionLabel="Novo lançamento"
      onAction={() => {
        resetForm();
        setOpen(true);
      }}
    >
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Lançamentos"
          value={String(entries?.length ?? 0)}
          icon={ListChecks}
          iconColor="blue"
          footer="Registros encontrados"
        />
        <SummaryCard
          label="Receitas"
          value={formatMoney(receitas)}
          icon={ArrowUpCircle}
          iconColor="green"
          footer="Entradas confirmadas"
        />
        <SummaryCard
          label="Despesas"
          value={formatMoney(despesas)}
          icon={ArrowDownCircle}
          iconColor="red"
          footer="Saídas registradas"
        />
        <SummaryCard
          label="Saldo"
          value={formatMoney(saldo)}
          icon={Banknote}
          iconColor={saldo < 0 ? "red" : "blue"}
          footer="Receitas menos despesas"
        />
      </div>

      <TransactionFilters
        search={search}
        onSearchChange={setSearch}
        status={filterStatus}
        onStatusChange={setFilterStatus}
        type={filterType}
        onTypeChange={setFilterType}
        period={filterPeriod}
        onPeriodChange={setFilterPeriod}
        dateFrom={filterDateFrom}
        onDateFromChange={setFilterDateFrom}
        dateTo={filterDateTo}
        onDateToChange={setFilterDateTo}
        categoryId={filterCategoryId}
        onCategoryChange={setFilterCategoryId}
        categories={categories ?? []}
        origin={filterOrigin}
        onOriginChange={setFilterOrigin}
        paymentMethod={filterPaymentMethod}
        onPaymentMethodChange={setFilterPaymentMethod}
      />

      <ResponsiveTransactionList
        entries={entries}
        isLoading={isLoading}
        error={error}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <LancamentoModal
        open={open}
        modo={mode}
        tipoInicial={form.tipo === "despesa" ? "despesa" : "receita"}
        contexto="financeiro"
        lancamento={editingEntry}
        duplicarDe={duplicatingEntry}
        form={form}
        errors={errors}
        categories={categories ?? []}
        collaborators={collaborators ?? []}
        isWorking={isWorking}
        onFieldChange={updateField}
        onSave={handleSave}
        onClose={() => {
          resetForm();
          setOpen(false);
        }}
        onOpenChange={(v) => {
          if (!v) resetForm();
          setOpen(v);
        }}
      />

      <Dialog
        open={!!deletingId}
        onOpenChange={(v) => {
          if (!v) setDeletingId(null);
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeletingId(null)} />
          <DialogHeader>
            <DialogTitle>Excluir lançamento</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Confirma a exclusão?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
