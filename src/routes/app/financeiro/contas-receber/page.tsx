import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Clock3,
  MoreHorizontal,
  Pencil,
  ReceiptText,
  RotateCcw,
  Trash2,
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
import { DatePicker } from "@/components/ui/date-picker";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAccountsReceivable,
  useCreateAccountReceivable,
  useUpdateAccountReceivable,
  useDeleteAccountReceivable,
  useReceiveAccountReceivable,
  useReverseAccountReceivableReceipt,
} from "@/domain/financeiro/hooks/use-accounts";
import { useCategories } from "@/domain/financeiro/hooks/use-categories";
import { useCostCenters } from "@/domain/financeiro/hooks/use-cost-centers";
import { useAuthStore } from "@/lib/supabase/auth-store";
import {
  formatDate,
  formatMoney,
  parseMoneyInput,
  toFiniteNumber,
} from "@/lib/utils";
import type {
  AccountReceivableFilters,
  AccountReceivableRow,
} from "@/domain/financeiro/types";

const AR_STATUS_MAP: Record<string, string> = {
  aberto: "pending",
  pago: "received",
  vencido: "overdue",
  cancelado: "cancelled",
  estornado: "reversed",
};

const RECEIPT_METHOD_OPTIONS = [
  { value: "pix", label: "Pix" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "dinheiro", label: "Dinheiro" },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  return toDateInputValue(
    new Date(value + (value.includes("T") ? "" : "T00:00:00"))
  );
}

function canReceive(entry: AccountReceivableRow) {
  return entry.status === "pending" || entry.status === "overdue";
}

function isReceived(entry: AccountReceivableRow) {
  return entry.status === "received";
}

function isReversed(entry: AccountReceivableRow) {
  return entry.status === "reversed";
}

function canEditOrDelete(entry: AccountReceivableRow) {
  return !isReceived(entry) && !isReversed(entry);
}

function getDueHelper(entry: AccountReceivableRow, todayKey: string) {
  if (entry.status === "received") {
    return entry.receivedDate
      ? `Recebida em ${formatDate(entry.receivedDate)}`
      : "Recebida";
  }
  if (entry.status === "cancelled") return "Cancelada";
  if (entry.status === "reversed") return "Recebimento estornado";

  const dueKey = entry.dueDate.slice(0, 10);
  if (dueKey < todayKey) return "Vencida";
  if (dueKey === todayKey) return "Vence hoje";
  return "A vencer";
}

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [client, setClient] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] =
    useState<AccountReceivableRow["status"]>("pending");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [receivingEntry, setReceivingEntry] =
    useState<AccountReceivableRow | null>(null);
  const [receiptDate, setReceiptDate] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receiptMethod, setReceiptMethod] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [reversalEntry, setReversalEntry] =
    useState<AccountReceivableRow | null>(null);
  const [reversalDate, setReversalDate] = useState("");
  const [reversalReason, setReversalReason] = useState("");
  const [reversalNotes, setReversalNotes] = useState("");

  const filters = useMemo<AccountReceivableFilters | undefined>(() => {
    const f: AccountReceivableFilters = {};
    if (search) f.search = search;
    if (filterStatus)
      f.status = (AR_STATUS_MAP[filterStatus] ??
        filterStatus) as AccountReceivableFilters["status"];
    return Object.keys(f).length ? f : undefined;
  }, [search, filterStatus]);

  const user = useAuthStore((state) => state.user);
  const { data: entries, isLoading } = useAccountsReceivable(filters);
  const { data: categories } = useCategories();
  const { data: costCenters } = useCostCenters();
  const { mutateAsync: createEntry, isPending: creating } =
    useCreateAccountReceivable();
  const { mutateAsync: updateEntry, isPending: updating } =
    useUpdateAccountReceivable();
  const { mutateAsync: deleteEntry, isPending: deleting } =
    useDeleteAccountReceivable();
  const { mutateAsync: receiveEntry, isPending: receiving } =
    useReceiveAccountReceivable();
  const { mutateAsync: reverseReceipt, isPending: reversing } =
    useReverseAccountReceivableReceipt();

  const isEditing = !!editingId;
  const isWorking = creating || updating;

  function resetForm() {
    setDescription("");
    setAmount("");
    setDueDate("");
    setClient("");
    setCategoryId("");
    setCostCenterId("");
    setNotes("");
    setStatus("pending");
    setEditingId(null);
  }

  function handleEdit(entry: AccountReceivableRow) {
    if (isReceived(entry) || isReversed(entry)) {
      toast.info(
        "Conta recebida ou estornada fica bloqueada para edicao direta."
      );
      return;
    }
    setDescription(entry.description);
    setAmount(String(entry.amount));
    setDueDate(getDateInputValue(entry.dueDate));
    setClient(entry.client ?? "");
    setCategoryId(entry.categoryId);
    setCostCenterId(entry.costCenterId ?? "");
    setNotes(entry.notes ?? "");
    setStatus(entry.status);
    setEditingId(entry.id);
    setOpen(true);
  }

  function handleDelete(entry: AccountReceivableRow) {
    if (isReceived(entry) || isReversed(entry)) {
      toast.info("Conta recebida ou estornada nao pode ser excluida.");
      return;
    }
    setDeletingId(entry.id);
  }

  function openReceiptDialog(entry: AccountReceivableRow) {
    if (isReceived(entry)) {
      toast.info(
        "Esta conta ja foi recebida e o lancamento financeiro ja existe."
      );
      return;
    }
    if (entry.status === "cancelled") {
      toast.info("Conta cancelada nao pode ser marcada como recebida.");
      return;
    }
    if (isReversed(entry)) {
      toast.info("Recebimento estornado nao pode ser recebido novamente.");
      return;
    }
    setReceivingEntry(entry);
    setReceiptDate(toDateInputValue(new Date()));
    setReceivedAmount(String(entry.amount));
    setReceiptMethod("");
    setBankAccount("");
    setReceiptNotes("");
  }

  function openReversalDialog(entry: AccountReceivableRow) {
    if (!isReceived(entry)) {
      toast.info("Apenas conta recebida pode ser estornada.");
      return;
    }
    setReversalEntry(entry);
    setReversalDate(toDateInputValue(new Date()));
    setReversalReason("");
    setReversalNotes("");
  }

  function closeReversalDialog() {
    setReversalEntry(null);
    setReversalDate("");
    setReversalReason("");
    setReversalNotes("");
  }

  function closeReceiptDialog() {
    setReceivingEntry(null);
    setReceiptDate("");
    setReceivedAmount("");
    setReceiptMethod("");
    setBankAccount("");
    setReceiptNotes("");
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      toast.success("Conta a receber excluída");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao excluir conta a receber";
      console.error("[delete-accounts-receivable]", msg, err);
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
        costCenterId: costCenterId || undefined,
        client: client.trim() || undefined,
        notes: notes.trim() || undefined,
        userId: user.id,
      };
      if (editingId) {
        if (status === "received") {
          toast.error(
            "Use a ação Marcar como recebida para registrar o recebimento."
          );
          return;
        }
        await updateEntry({ id: editingId, data: payload });
        toast.success("Conta a receber atualizada");
      } else {
        await createEntry(payload);
        toast.success("Conta a receber criada");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar conta a receber";
      console.error("[save-accounts-receivable]", msg, err);
      toast.error(msg);
    }
  }

  async function confirmReceipt() {
    if (!receivingEntry) return;
    const parsedAmount = parseMoneyInput(receivedAmount);
    if (!receiptDate) {
      toast.error("Informe a data do recebimento");
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Informe um valor recebido valido");
      return;
    }
    if (!receiptMethod.trim()) {
      toast.error("Informe a forma de recebimento");
      return;
    }
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      await receiveEntry({
        id: receivingEntry.id,
        data: {
          receivedDate: new Date(receiptDate + "T00:00:00"),
          receivedAmount: parsedAmount,
          paymentMethod: receiptMethod.trim(),
          bankAccount: bankAccount.trim() || undefined,
          notes: receiptNotes.trim() || undefined,
          userId: user.id,
        },
      });
      toast.success(
        "Recebimento registrado com sucesso. Um lançamento de receita foi criado automaticamente no Financeiro."
      );
      closeReceiptDialog();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao registrar recebimento";
      console.error("[receive-accounts-receivable]", msg, err);
      toast.error(msg);
    }
  }

  async function confirmReversal() {
    if (!reversalEntry) return;
    if (!reversalDate) {
      toast.error("Informe a data do estorno");
      return;
    }
    if (!reversalReason.trim()) {
      toast.error("Informe o motivo do estorno");
      return;
    }
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      await reverseReceipt({
        id: reversalEntry.id,
        data: {
          reversalDate: new Date(reversalDate + "T00:00:00"),
          reason: reversalReason.trim(),
          notes: reversalNotes.trim() || undefined,
          userId: user.id,
        },
      });
      toast.success(
        "Recebimento estornado com sucesso. O lançamento financeiro foi atualizado."
      );
      closeReversalDialog();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao estornar recebimento";
      console.error("[reverse-accounts-receivable]", msg, err);
      toast.error(msg);
    }
  }

  const receivableEntries = entries ?? [];
  const todayKey = toDateInputValue(new Date());
  const currentMonthKey = todayKey.slice(0, 7);
  const openEntries = receivableEntries.filter(
    (e) => e.status === "pending" || e.status === "overdue"
  );
  const openAmount = openEntries.reduce(
    (sum, e) => sum + toFiniteNumber(e.amount),
    0
  );
  const receivedTotalAmount = receivableEntries
    .filter((e) => e.status === "received")
    .reduce((sum, e) => sum + toFiniteNumber(e.amount), 0);
  const dueTodayCount = receivableEntries.filter(
    (e) =>
      !isReceived(e) &&
      e.status !== "cancelled" &&
      e.status !== "reversed" &&
      e.dueDate.slice(0, 10) === todayKey
  ).length;
  const receivedThisMonthAmount = receivableEntries
    .filter(
      (e) =>
        e.status === "received" &&
        e.receivedDate?.slice(0, 7) === currentMonthKey
    )
    .reduce((sum, e) => sum + toFiniteNumber(e.amount), 0);

  const statusOptions = [
    { value: "pending", label: "Pendente" },
    { value: "overdue", label: "Vencido" },
    { value: "cancelled", label: "Cancelado" },
    { value: "reversed", label: "Estornado" },
  ];
  if (status === "received")
    statusOptions.unshift({ value: "received", label: "Recebido" });
  const receivedAmountNumber = parseMoneyInput(receivedAmount);
  const hasReceiptDifference =
    !!receivingEntry &&
    Number.isFinite(receivedAmountNumber) &&
    Math.abs(receivedAmountNumber - toFiniteNumber(receivingEntry.amount)) >=
      0.01;
  const canConfirmReceipt =
    !!receiptDate &&
    Number.isFinite(receivedAmountNumber) &&
    receivedAmountNumber > 0 &&
    !!receiptMethod.trim() &&
    !receiving;

  return (
    <PageShell
      icon={CircleDollarSign}
      title="Contas a receber"
      subtitle="Controle recebíveis, clientes e previsões de entrada"
      actionLabel="Nova conta"
      onAction={() => {
        resetForm();
        setOpen(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="A receber"
          value={formatMoney(openAmount)}
          icon={Banknote}
          tone="green"
          helper={`${openEntries.length} conta(s)`}
        />
        <MetricCard
          title="Recebidas"
          value={formatMoney(receivedTotalAmount)}
          icon={CalendarCheck}
          tone="blue"
        />
        <MetricCard
          title="Vence hoje"
          value={String(dueTodayCount)}
          icon={Clock}
          tone="amber"
        />
        <MetricCard
          title="Recebidas no mês"
          value={formatMoney(receivedThisMonthAmount)}
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <FilterBar
        searchPlaceholder="Buscar conta a receber..."
        search={search}
        onSearchChange={setSearch}
        activeFilters={
          filterStatus
            ? [
                {
                  key: "status",
                  label:
                    filterStatus === "pago"
                      ? "Pago"
                      : filterStatus === "estornado"
                        ? "Estornado"
                        : filterStatus === "cancelado"
                          ? "Cancelado"
                      : filterStatus === "vencido"
                        ? "Vencido"
                        : "Aberto",
                  onRemove: () => setFilterStatus(""),
                },
              ]
            : []
        }
        filters={[
          {
            key: "status",
            label: "Status",
            primary: true,
            control: (
              <StatusSelect value={filterStatus} onValueChange={setFilterStatus} />
            ),
          },
        ]}
      />
      <div className="desktop-table">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Vencimento",
                  "Cliente",
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
                entries.map((entry) => {
                  const showCommonActions = canEditOrDelete(entry);
                  const showMenu =
                    showCommonActions || canReceive(entry) || isReceived(entry);

                  return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex min-w-32 flex-col gap-1">
                        <span className="font-medium">
                          {formatDate(entry.dueDate)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {getDueHelper(entry, todayKey)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{entry.client ?? "-"}</TableCell>
                    <TableCell className="font-medium">
                      {entry.description}
                    </TableCell>
                    <TableCell>{entry.categoryName}</TableCell>
                    <TableCell>{formatMoney(entry.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {canReceive(entry) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReceiptDialog(entry)}
                          >
                            <Banknote className="size-4" />
                            Receber
                          </Button>
                        ) : null}
                        {showMenu ? (
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
                              {showCommonActions ? (
                                <DropdownMenuItem onClick={() => handleEdit(entry)}>
                                  <Pencil className="size-4" />
                                  Editar
                                </DropdownMenuItem>
                              ) : null}
                              {canReceive(entry) ? (
                                <DropdownMenuItem
                                  onClick={() => openReceiptDialog(entry)}
                                >
                                  <CheckCircle2 className="size-4" />
                                  Marcar como recebida
                                </DropdownMenuItem>
                              ) : null}
                              {isReceived(entry) ? (
                                <DropdownMenuItem
                                  onClick={() => openReversalDialog(entry)}
                                >
                                  <RotateCcw className="size-4" />
                                  Estornar recebimento
                                </DropdownMenuItem>
                              ) : null}
                              {showCommonActions ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    destructive
                                    onClick={() => handleDelete(entry)}
                                  >
                                    <Trash2 className="size-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      title="Nenhuma conta a receber encontrada."
                      description="Cadastre receitas previstas para acompanhar entradas futuras."
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
      <AccountReceivableMobileList
        entries={entries}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReceive={openReceiptDialog}
        onReverse={openReversalDialog}
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
              {isEditing ? "Editar conta a receber" : "Nova conta a receber"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere os dados da conta."
                : "Registre uma receita prevista."}
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
            <Field label="Cliente">
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Nome do cliente"
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
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                ariaLabel="Data de vencimento"
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
            <Field label="Centro de custo">
              <Select
                value={costCenterId}
                onChange={(e) => setCostCenterId(e.target.value)}
                options={(costCenters ?? []).map((c) => ({
                  value: c.id,
                  label: c.code ? `${c.code} - ${c.name}` : c.name,
                }))}
                placeholder="Sem centro"
              />
            </Field>
            <Field label="Status">
              <Select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AccountReceivableRow["status"])
                }
                options={statusOptions}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Observações">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes internos da previsão"
                />
              </Field>
            </div>
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
        open={!!receivingEntry}
        onOpenChange={(v) => {
          if (!v) closeReceiptDialog();
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton onClick={closeReceiptDialog} />
          <DialogHeader>
            <DialogTitle>Registrar recebimento</DialogTitle>
            <DialogDescription>
              Confirme os dados para efetivar a receita no Financeiro.
            </DialogDescription>
          </DialogHeader>
          {receivingEntry ? (
            <div className="border-border bg-surface-muted rounded-[var(--radius-card)] border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-[0.04em] uppercase">
                    <ReceiptText className="size-4" />
                    Recebível selecionado
                  </p>
                  <p className="text-foreground mt-1 truncate text-sm font-bold">
                    {receivingEntry.description}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {receivingEntry.client ?? "Cliente nao informado"} -{" "}
                    {receivingEntry.categoryName}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-foreground text-sm font-bold">
                    {formatMoney(receivingEntry.amount)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Vence em {formatDate(receivingEntry.dueDate)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data do recebimento">
              <DatePicker
                value={receiptDate}
                onChange={setReceiptDate}
                ariaLabel="Data do recebimento"
              />
            </Field>
            <Field label="Valor recebido">
              <Input
                type="text"
                inputMode="decimal"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="R$ 0,00"
              />
            </Field>
            <Field label="Forma de recebimento">
              <Select
                value={receiptMethod}
                onChange={(e) => setReceiptMethod(e.target.value)}
                options={RECEIPT_METHOD_OPTIONS}
                placeholder="Selecione..."
              />
            </Field>
            <Field label="Conta/Banco">
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Banco, conta ou carteira"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Observações">
                <Textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Observações do recebimento"
                />
              </Field>
            </div>
          </div>
          {hasReceiptDifference && receivingEntry ? (
            <div className="text-muted-foreground flex items-start gap-2 rounded-[var(--radius-field)] border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs dark:border-amber-400/30 dark:bg-amber-400/10">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                O valor recebido difere do valor original de{" "}
                {formatMoney(receivingEntry.amount)}. O financeiro sera criado
                com o valor confirmado aqui.
              </span>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeReceiptDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmReceipt} disabled={!canConfirmReceipt}>
              <Banknote className="size-4" />
              {receiving ? "Registrando..." : "Confirmar recebimento"}
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
            <DialogTitle>Excluir conta a receber</DialogTitle>
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
      <Dialog
        open={!!reversalEntry}
        onOpenChange={(v) => {
          if (!v) closeReversalDialog();
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton onClick={closeReversalDialog} />
          <DialogHeader>
            <DialogTitle>Estornar recebimento</DialogTitle>
            <DialogDescription>
              Registre o motivo para preservar o histórico financeiro.
            </DialogDescription>
          </DialogHeader>
          {reversalEntry ? (
            <div className="border-border bg-surface-muted rounded-[var(--radius-card)] border p-4">
              <p className="text-foreground text-sm font-bold">
                {reversalEntry.description}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatMoney(reversalEntry.amount)} - Recebida em{" "}
                {formatDate(reversalEntry.receivedDate)}
              </p>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data do estorno">
              <DatePicker
                value={reversalDate}
                onChange={setReversalDate}
                ariaLabel="Data do estorno"
              />
            </Field>
            <Field label="Motivo">
              <Input
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Ex: recebimento lançado incorretamente"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Observações">
                <Textarea
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  placeholder="Detalhes adicionais do estorno"
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReversalDialog}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReversal}
              disabled={reversing}
            >
              <RotateCcw className="size-4" />
              {reversing ? "Estornando..." : "Confirmar estorno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function AccountReceivableMobileList({
  entries,
  isLoading,
  onEdit,
  onDelete,
  onReceive,
  onReverse,
  onNew,
}: {
  entries: AccountReceivableRow[] | undefined;
  isLoading: boolean;
  onEdit: (entry: AccountReceivableRow) => void;
  onDelete: (entry: AccountReceivableRow) => void;
  onReceive: (entry: AccountReceivableRow) => void;
  onReverse: (entry: AccountReceivableRow) => void;
  onNew: () => void;
}) {
  const todayKey = toDateInputValue(new Date());

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
          title="Nenhuma conta a receber encontrada."
          description="Cadastre receitas previstas para acompanhar entradas futuras."
          actionLabel="Nova conta"
          onAction={onNew}
        />
      </div>
    );
  }

  return (
    <div className="mobile-list">
      {entries.map((entry) => {
        const showCommonActions = canEditOrDelete(entry);
        const showMenu =
          showCommonActions || canReceive(entry) || isReceived(entry);

        return (
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
                {entry.client ?? "Cliente nao informado"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {getDueHelper(entry, todayKey)}
                {entry.costCenterName ? ` - ${entry.costCenterName}` : ""}
              </p>
            </div>
            <strong className="money money-income">
              {formatMoney(entry.amount)}
            </strong>
          </div>
          <div className="mobile-record-bottom">
            <StatusBadge status={entry.status} />
            <div className="flex items-center gap-2">
              {canReceive(entry) ? (
                <Button size="sm" onClick={() => onReceive(entry)}>
                  <Banknote className="size-4" />
                  Receber
                </Button>
              ) : null}
              {showMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ações da conta a receber"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {showCommonActions ? (
                      <DropdownMenuItem onClick={() => onEdit(entry)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                    ) : null}
                    {canReceive(entry) ? (
                      <DropdownMenuItem onClick={() => onReceive(entry)}>
                        <CheckCircle2 className="size-4" />
                        Marcar como recebida
                      </DropdownMenuItem>
                    ) : null}
                    {isReceived(entry) ? (
                      <DropdownMenuItem onClick={() => onReverse(entry)}>
                        <RotateCcw className="size-4" />
                        Estornar recebimento
                      </DropdownMenuItem>
                    ) : null}
                    {showCommonActions ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onClick={() => onDelete(entry)}>
                          <Trash2 className="size-4" />
                          Excluir
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        </article>
        );
      })}
    </div>
  );
}
