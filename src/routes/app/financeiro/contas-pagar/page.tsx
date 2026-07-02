import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Trash2,
  WalletCards,
} from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import {
  EmptyState,
  FilterBar,
  MetricCard,
  PageShell,
  StatusBadge,
  StatusSelect,
} from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAccountsPayable,
  useCreateAccountPayable,
  useUpdateAccountPayable,
  useDeleteAccountPayable,
} from "@/domain/financeiro/hooks/use-accounts";
import { useCategories } from "@/domain/financeiro/hooks/use-categories";
import { useAuthStore } from "@/lib/supabase/auth-store";
import {
  formatDate,
  formatMoney,
  parseMoneyInput,
  toFiniteNumber,
} from "@/lib/utils";
import type {
  AccountPayableFilters,
  AccountPayableRow,
} from "@/domain/financeiro/types";

const AP_STATUS_MAP: Record<string, string> = {
  aberto: "pending",
  pago: "paid",
  vencido: "overdue",
};

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<AccountPayableRow["status"]>("pending");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filters = useMemo<AccountPayableFilters | undefined>(() => {
    const f: AccountPayableFilters = {};
    if (search) f.search = search;
    if (filterStatus)
      f.status = (AP_STATUS_MAP[filterStatus] ??
        filterStatus) as AccountPayableFilters["status"];
    return Object.keys(f).length ? f : undefined;
  }, [search, filterStatus]);

  const user = useAuthStore((state) => state.user);
  const { data: entries, isLoading } = useAccountsPayable(filters);
  const { data: categories } = useCategories();
  const { mutateAsync: createEntry, isPending: creating } =
    useCreateAccountPayable();
  const { mutateAsync: updateEntry, isPending: updating } =
    useUpdateAccountPayable();
  const { mutateAsync: deleteEntry, isPending: deleting } =
    useDeleteAccountPayable();

  const isEditing = !!editingId;
  const isWorking = creating || updating;

  function resetForm() {
    setDescription("");
    setAmount("");
    setDueDate("");
    setSupplier("");
    setCategoryId("");
    setStatus("pending");
    setEditingId(null);
  }

  function handleEdit(entry: AccountPayableRow) {
    setDescription(entry.description);
    setAmount(String(entry.amount));
    setDueDate(
      entry.dueDate
        ? new Date(
            entry.dueDate + (entry.dueDate.includes("T") ? "" : "T00:00:00")
          )
            .toISOString()
            .slice(0, 10)
        : ""
    );
    setSupplier(entry.supplier ?? "");
    setCategoryId(entry.categoryId);
    setStatus(entry.status);
    setEditingId(entry.id);
    setOpen(true);
  }

  function handleDelete(entry: AccountPayableRow) {
    setDeletingId(entry.id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      toast.success("Conta a pagar excluída");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao excluir conta a pagar";
      console.error("[delete-accounts-payable]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    if (!description.trim()) {
      toast.error("Informe a descrição");
      return;
    }
    const parsedAmount = parseMoneyInput(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (!dueDate) {
      toast.error("Informe a data de vencimento");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione a categoria");
      return;
    }
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const payload = {
        description: description.trim(),
        amount: parsedAmount,
        dueDate: new Date(dueDate + "T00:00:00"),
        status,
        categoryId,
        supplier: supplier.trim() || undefined,
        userId: user.id,
      };
      if (editingId) {
        await updateEntry({ id: editingId, data: payload });
        toast.success("Conta a pagar atualizada");
      } else {
        await createEntry(payload);
        toast.success("Conta a pagar criada");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar conta a pagar";
      console.error("[save-accounts-payable]", msg, err);
      toast.error(msg);
    }
  }

  const payableEntries = entries ?? [];
  const openEntries = payableEntries.filter(
    (e) => e.status === "pending" || e.status === "overdue"
  );
  const openAmount = openEntries.reduce(
    (sum, e) => sum + toFiniteNumber(e.amount),
    0
  );
  const overdueAmount = payableEntries
    .filter((e) => e.status === "overdue")
    .reduce((sum, e) => sum + toFiniteNumber(e.amount), 0);

  const statusOptions = [
    { value: "pending", label: "Pendente" },
    { value: "paid", label: "Pago" },
    { value: "overdue", label: "Vencido" },
    { value: "cancelled", label: "Cancelado" },
  ];

  return (
    <PageShell
      icon={CreditCard}
      title="Contas a pagar"
      subtitle="Acompanhe obrigações, vencimentos e pagamentos"
      actionLabel="Nova conta"
      onAction={() => {
        resetForm();
        setOpen(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Em aberto"
          value={formatMoney(openAmount)}
          icon={WalletCards}
          tone="blue"
          helper={`${openEntries.length} conta(s)`}
        />
        <MetricCard
          title="Vence hoje"
          value={String(
            payableEntries.filter(
              (e) =>
                e.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10)
            ).length
          )}
          icon={CalendarClock}
          tone="amber"
        />
        <MetricCard
          title="Vencidas"
          value={formatMoney(overdueAmount)}
          icon={AlertTriangle}
          tone="red"
        />
      </div>
      <FilterBar
        searchPlaceholder="Buscar conta a pagar..."
        search={search}
        onSearchChange={setSearch}
        activeFilters={
          filterStatus
            ? [{ key: "status", label: filterStatus === "pago" ? "Pago" : filterStatus === "vencido" ? "Vencido" : "Aberto", onRemove: () => setFilterStatus("") }]
            : []
        }
      >
        <StatusSelect value={filterStatus} onValueChange={setFilterStatus} />
      </FilterBar>
      <div className="desktop-table">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Vencimento",
                  "Fornecedor",
                  "Descrição",
                  "Categoria",
                  "Valor",
                  "Status",
                  "Ações",
                ].map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground h-48 text-center text-sm"
                  >
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : entries?.length ? (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.dueDate)}</TableCell>
                    <TableCell>{entry.supplier ?? "-"}</TableCell>
                    <TableCell className="font-medium">
                      {entry.description}
                    </TableCell>
                    <TableCell>{entry.categoryName}</TableCell>
                    <TableCell>{formatMoney(entry.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Ações"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEdit(entry)}>
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onClick={() => handleDelete(entry)}
                          >
                            <Trash2 className="size-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      title="Nenhuma conta a pagar encontrada."
                      description="Cadastre suas obrigações para controlar o fluxo de saída."
                      actionLabel="Nova conta"
                      onAction={() => {
                        resetForm();
                        setOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
      <AccountPayableMobileList
        entries={entries}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNew={() => {
          resetForm();
          setOpen(true);
        }}
      />
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetForm();
          setOpen(v);
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          />
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar conta a pagar" : "Nova conta a pagar"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere os dados da conta."
                : "Registre uma obrigação financeira."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Descrição">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da conta"
              />
            </Field>
            <Field label="Fornecedor">
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nome do fornecedor"
              />
            </Field>
            <Field label="Valor">
              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="R$ 0,00"
              />
            </Field>
            <Field label="Vencimento">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
            <Field label="Categoria">
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={(categories ?? []).map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="Selecione..."
              />
            </Field>
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AccountPayableRow["status"])
                }
                options={statusOptions}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isWorking}>
              {isWorking ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deletingId}
        onOpenChange={(v) => {
          if (!v) setDeletingId(null);
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeletingId(null)} />
          <DialogHeader>
            <DialogTitle>Excluir conta a pagar</DialogTitle>
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

function AccountPayableMobileList({
  entries,
  isLoading,
  onEdit,
  onDelete,
  onNew,
}: {
  entries: AccountPayableRow[] | undefined;
  isLoading: boolean;
  onEdit: (entry: AccountPayableRow) => void;
  onDelete: (entry: AccountPayableRow) => void;
  onNew: () => void;
}) {
  if (isLoading) {
    return (
      <div className="mobile-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="mobile-record-card">
            <div className="bg-surface-muted h-4 w-36 animate-pulse rounded-full" />
            <div className="bg-surface-muted mt-3 h-6 w-28 animate-pulse rounded-full" />
            <div className="bg-border mt-4 h-px" />
            <div className="bg-surface-muted mt-4 h-4 w-44 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="mobile-list">
        <EmptyState
          title="Nenhuma conta a pagar encontrada."
          description="Cadastre suas obrigações para controlar o fluxo de saída."
          actionLabel="Nova conta"
          onAction={onNew}
        />
      </div>
    );
  }

  return (
    <div className="mobile-list">
      {entries.map((entry) => (
        <article key={entry.id} className="mobile-record-card">
          <div className="mobile-record-top">
            <div className="min-w-0">
              <h3 className="text-text-primary truncate text-sm font-bold">
                {entry.description}
              </h3>
              <p className="text-text-muted mt-1 text-xs">
                {entry.categoryName} - {formatDate(entry.dueDate)}
              </p>
              <p className="text-text-secondary mt-1 text-xs">
                {entry.supplier ?? "Fornecedor nao informado"}
              </p>
            </div>
            <strong className="money money-expense">
              {formatMoney(entry.amount)}
            </strong>
          </div>
          <div className="mobile-record-bottom">
            <StatusBadge status={entry.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ações da conta a pagar"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => onDelete(entry)}>
                  <Trash2 className="size-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </article>
      ))}
    </div>
  );
}
