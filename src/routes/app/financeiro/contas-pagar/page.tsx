import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { KeyboardEvent } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  MoreHorizontal,
  Pencil,
  ReceiptText,
  RotateCcw,
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
  useAccountsPayable,
  useBeneficiarySearch,
  useCreateAccountPayable,
  useUpdateAccountPayable,
  useDeleteAccountPayable,
  usePayAccountPayable,
  useReverseAccountPayablePayment,
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
  AccountPayableBeneficiaryType,
  AccountPayableFilters,
  AccountPayableRow,
} from "@/domain/financeiro/types";

const AP_STATUS_MAP: Record<string, string> = {
  aberto: "pending",
  pago: "paid",
  vencido: "overdue",
  cancelado: "cancelled",
  estornado: "reversed",
};

const PAYMENT_METHOD_OPTIONS = [
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

function canPay(entry: AccountPayableRow) {
  return entry.status === "pending" || entry.status === "overdue";
}

function isPaid(entry: AccountPayableRow) {
  return entry.status === "paid";
}

function isReversed(entry: AccountPayableRow) {
  return entry.status === "reversed";
}

function canEditOrDelete(entry: AccountPayableRow) {
  return !isPaid(entry) && !isReversed(entry);
}

function getDueHelper(entry: AccountPayableRow, todayKey: string) {
  if (entry.status === "paid") {
    return entry.paidDate ? `Pago em ${formatDate(entry.paidDate)}` : "Pago";
  }
  if (entry.status === "cancelled") return "Cancelada";
  if (entry.status === "reversed") return "Pagamento estornado";

  const dueKey = entry.dueDate.slice(0, 10);
  if (dueKey < todayKey) return "Vencida";
  if (dueKey === todayKey) return "Vence hoje";
  return "A vencer";
}

function getBeneficiaryLabel(entry: AccountPayableRow) {
  return entry.beneficiaryName ?? entry.supplier ?? "Favorecido nao informado";
}

function getBeneficiaryTypeLabel(type: AccountPayableBeneficiaryType) {
  return type === "collaborator" ? "Colaborador" : "Fornecedor";
}

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (debounced === value) return;
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [debounced, delay, value]);

  return debounced;
}

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUpdatedAt, setEditingUpdatedAt] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [beneficiaryType, setBeneficiaryType] =
    useState<AccountPayableBeneficiaryType>("supplier");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiaryError, setBeneficiaryError] = useState("");
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [activeCollaboratorIndex, setActiveCollaboratorIndex] = useState(0);
  const [selectedCollaboratorName, setSelectedCollaboratorName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<AccountPayableRow["status"]>("pending");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBeneficiaryType, setFilterBeneficiaryType] = useState("");
  const [payingEntry, setPayingEntry] = useState<AccountPayableRow | null>(
    null
  );
  const [paymentDate, setPaymentDate] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [reversalEntry, setReversalEntry] = useState<AccountPayableRow | null>(
    null
  );
  const [reversalDate, setReversalDate] = useState("");
  const [reversalReason, setReversalReason] = useState("");
  const [reversalNotes, setReversalNotes] = useState("");

  const filters = useMemo<AccountPayableFilters | undefined>(() => {
    const f: AccountPayableFilters = {};
    if (search) f.search = search;
    if (filterStatus)
      f.status = (AP_STATUS_MAP[filterStatus] ??
        filterStatus) as AccountPayableFilters["status"];
    if (filterBeneficiaryType) {
      f.beneficiaryType =
        filterBeneficiaryType as AccountPayableBeneficiaryType;
    }
    return Object.keys(f).length ? f : undefined;
  }, [search, filterStatus, filterBeneficiaryType]);

  const user = useAuthStore((state) => state.user);
  const { data: entries, isLoading } = useAccountsPayable(filters);
  const { data: categories } = useCategories();
  const { data: costCenters } = useCostCenters();
  const { mutateAsync: createEntry, isPending: creating } =
    useCreateAccountPayable();
  const { mutateAsync: updateEntry, isPending: updating } =
    useUpdateAccountPayable();
  const { mutateAsync: deleteEntry, isPending: deleting } =
    useDeleteAccountPayable();
  const { mutateAsync: payEntry, isPending: paying } = usePayAccountPayable();
  const { mutateAsync: reversePayment, isPending: reversing } =
    useReverseAccountPayablePayment();

  const isEditing = !!editingId;
  const isWorking = creating || updating;
  const debouncedCollaboratorSearch = useDebouncedValue(collaboratorSearch);
  const hasCollaboratorSearch = debouncedCollaboratorSearch.trim().length > 0;
  const collaboratorSearchQuery = useBeneficiarySearch({
    type: "collaborator",
    q: debouncedCollaboratorSearch,
    page: 1,
    pageSize: 20,
    enabled:
      beneficiaryType === "collaborator" &&
      !beneficiaryId &&
      hasCollaboratorSearch,
  });
  const collaboratorOptions = collaboratorSearchQuery.data?.items ?? [];
  const selectedCollaborator = beneficiaryId
    ? { id: beneficiaryId, name: selectedCollaboratorName || collaboratorSearch }
    : null;

  useEffect(() => {
    setActiveCollaboratorIndex((index) => (index === 0 ? index : 0));
  }, [debouncedCollaboratorSearch, collaboratorOptions.length]);

  function resetForm() {
    setDescription("");
    setAmount("");
    setDueDate("");
    setBeneficiaryType("supplier");
    setBeneficiaryId("");
    setBeneficiaryError("");
    setCollaboratorSearch("");
    setSelectedCollaboratorName("");
    setSupplier("");
    setCategoryId("");
    setCostCenterId("");
    setNotes("");
    setStatus("pending");
    setEditingId(null);
    setEditingUpdatedAt(null);
    setActiveCollaboratorIndex(0);
  }

  function handleEdit(entry: AccountPayableRow) {
    if (isPaid(entry) || isReversed(entry)) {
      toast.info(
        "Conta paga ou estornada fica bloqueada para edicao direta."
      );
      return;
    }
    setDescription(entry.description);
    setAmount(String(entry.amount));
    setDueDate(getDateInputValue(entry.dueDate));
    setBeneficiaryType(entry.beneficiaryType);
    setBeneficiaryId(entry.beneficiaryId ?? "");
    setBeneficiaryError("");
    setCollaboratorSearch(
      entry.beneficiaryType === "collaborator" ? getBeneficiaryLabel(entry) : ""
    );
    setSelectedCollaboratorName(
      entry.beneficiaryType === "collaborator" ? getBeneficiaryLabel(entry) : ""
    );
    setSupplier(
      entry.beneficiaryType === "supplier" ? getBeneficiaryLabel(entry) : ""
    );
    setCategoryId(entry.categoryId);
    setCostCenterId(entry.costCenterId ?? "");
    setNotes(entry.notes ?? "");
    setStatus(entry.status);
    setEditingId(entry.id);
    setEditingUpdatedAt(entry.updatedAt);
    setOpen(true);
  }

  function selectCollaborator(collaborator: { id: string; name: string }) {
    setBeneficiaryId(collaborator.id);
    setBeneficiaryError("");
    setSelectedCollaboratorName(collaborator.name);
    setCollaboratorSearch(collaborator.name);
    setActiveCollaboratorIndex(0);
  }

  function handleCollaboratorKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (selectedCollaborator || !collaboratorOptions.length) {
      if (event.key === "Escape") {
        setBeneficiaryId("");
        setSelectedCollaboratorName("");
        setCollaboratorSearch("");
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCollaboratorIndex((index) =>
        Math.min(index + 1, collaboratorOptions.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCollaboratorIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectCollaborator(collaboratorOptions[activeCollaboratorIndex]!);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setCollaboratorSearch("");
      setActiveCollaboratorIndex(0);
    }
  }

  function handleDelete(entry: AccountPayableRow) {
    if (isPaid(entry) || isReversed(entry)) {
      toast.info("Conta paga ou estornada nao pode ser excluida.");
      return;
    }
    setDeletingId(entry.id);
  }

  function openPaymentDialog(entry: AccountPayableRow) {
    if (isPaid(entry)) {
      toast.info(
        "Esta conta já está paga e o lançamento financeiro já existe."
      );
      return;
    }
    if (entry.status === "cancelled") {
      toast.info("Conta cancelada nao pode ser marcada como paga.");
      return;
    }
    if (isReversed(entry)) {
      toast.info("Pagamento estornado nao pode ser pago novamente.");
      return;
    }
    setPayingEntry(entry);
    setPaymentDate(toDateInputValue(new Date()));
    setPaidAmount(String(entry.amount));
    setPaymentMethod("");
    setBankAccount("");
    setPaymentNotes("");
  }

  function openReversalDialog(entry: AccountPayableRow) {
    if (!isPaid(entry)) {
      toast.info("Apenas conta paga pode ser estornada.");
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

  function closePaymentDialog() {
    setPayingEntry(null);
    setPaymentDate("");
    setPaidAmount("");
    setPaymentMethod("");
    setBankAccount("");
    setPaymentNotes("");
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
    if (beneficiaryType === "supplier" && !supplier.trim()) {
      setBeneficiaryError("Informe o nome do fornecedor.");
      toast.error("Informe o fornecedor");
      return;
    }
    if (beneficiaryType === "collaborator" && !selectedCollaborator) {
      setBeneficiaryError(
        "Selecione um colaborador ativo da lista antes de salvar."
      );
      toast.error("Selecione um colaborador ativo da lista");
      return;
    }
    setBeneficiaryError("");
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
        beneficiaryType,
        beneficiaryId:
          beneficiaryType === "collaborator"
            ? selectedCollaborator?.id
            : undefined,
        beneficiaryName:
          beneficiaryType === "collaborator"
            ? selectedCollaborator?.name
            : supplier.trim(),
        supplier: beneficiaryType === "supplier" ? supplier.trim() : undefined,
        notes: notes.trim() || undefined,
        userId: user.id,
        ...(editingId && editingUpdatedAt
          ? { expectedUpdatedAt: editingUpdatedAt }
          : {}),
      };
      if (editingId) {
        if (status === "paid") {
          toast.error(
            "Use a ação Marcar como paga para registrar o pagamento."
          );
          return;
        }
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

  async function confirmPayment() {
    if (!payingEntry) return;
    const parsedAmount = parseMoneyInput(paidAmount);
    if (!paymentDate) {
      toast.error("Informe a data do pagamento");
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Informe um valor pago válido");
      return;
    }
    if (!paymentMethod.trim()) {
      toast.error("Informe a forma de pagamento");
      return;
    }
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      await payEntry({
        id: payingEntry.id,
        data: {
          paymentDate: new Date(paymentDate + "T00:00:00"),
          paidAmount: parsedAmount,
          paymentMethod: paymentMethod.trim(),
          bankAccount: bankAccount.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
          userId: user.id,
        },
      });
      toast.success(
        "Pagamento registrado com sucesso. Um lançamento de despesa foi criado automaticamente no Financeiro."
      );
      closePaymentDialog();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao registrar pagamento";
      console.error("[pay-accounts-payable]", msg, err);
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
      await reversePayment({
        id: reversalEntry.id,
        data: {
          reversalDate: new Date(reversalDate + "T00:00:00"),
          reason: reversalReason.trim(),
          notes: reversalNotes.trim() || undefined,
          userId: user.id,
        },
      });
      toast.success(
        "Pagamento estornado com sucesso. O lançamento financeiro foi atualizado."
      );
      closeReversalDialog();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao estornar pagamento";
      console.error("[reverse-accounts-payable]", msg, err);
      toast.error(msg);
    }
  }

  const payableEntries = entries ?? [];
  const visibleEntries = filterStatus
    ? payableEntries
    : payableEntries.filter((entry) => !isPaid(entry));
  const todayKey = toDateInputValue(new Date());
  const currentMonthKey = todayKey.slice(0, 7);
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
  const dueTodayCount = payableEntries.filter(
    (e) =>
      !isPaid(e) &&
      e.status !== "cancelled" &&
      e.status !== "reversed" &&
      e.dueDate.slice(0, 10) === todayKey
  ).length;
  const paidThisMonthAmount = payableEntries
    .filter(
      (e) => e.status === "paid" && e.paidDate?.slice(0, 7) === currentMonthKey
    )
    .reduce((sum, e) => sum + toFiniteNumber(e.amount), 0);

  const statusOptions = [
    { value: "pending", label: "Pendente" },
    { value: "overdue", label: "Vencido" },
    { value: "cancelled", label: "Cancelado" },
    { value: "reversed", label: "Estornado" },
  ];
  if (status === "paid")
    statusOptions.unshift({ value: "paid", label: "Pago" });
  const paidAmountNumber = parseMoneyInput(paidAmount);
  const hasPaymentDifference =
    !!payingEntry &&
    Number.isFinite(paidAmountNumber) &&
    Math.abs(paidAmountNumber - toFiniteNumber(payingEntry.amount)) >= 0.01;
  const canConfirmPayment =
    !!paymentDate &&
    Number.isFinite(paidAmountNumber) &&
    paidAmountNumber > 0 &&
    !!paymentMethod.trim() &&
    !paying;
  const activeFilters = [];
  if (filterStatus) {
    activeFilters.push({
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
    });
  }
  if (filterBeneficiaryType) {
    activeFilters.push({
      key: "beneficiaryType",
      label: getBeneficiaryTypeLabel(
        filterBeneficiaryType as AccountPayableBeneficiaryType
      ),
      onRemove: () => setFilterBeneficiaryType(""),
    });
  }

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
          value={String(dueTodayCount)}
          icon={CalendarClock}
          tone="amber"
        />
        <MetricCard
          title="Vencidas"
          value={formatMoney(overdueAmount)}
          icon={AlertTriangle}
          tone="red"
        />
        <MetricCard
          title="Pagas no mês"
          value={formatMoney(paidThisMonthAmount)}
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <FilterBar
        searchPlaceholder="Buscar conta a pagar..."
        search={search}
        onSearchChange={setSearch}
        activeFilters={activeFilters}
        filters={[
          {
            key: "status",
            label: "Status",
            primary: true,
            control: (
              <StatusSelect value={filterStatus} onValueChange={setFilterStatus} />
            ),
          },
          {
            key: "beneficiaryType",
            label: "Tipo do favorecido",
            control: (
              <Select
                value={filterBeneficiaryType}
                onChange={(e) => setFilterBeneficiaryType(e.target.value)}
                options={[
                  { value: "supplier", label: "Fornecedor" },
                  { value: "collaborator", label: "Colaborador" },
                ]}
                placeholder="Tipo do favorecido"
              />
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
                  "Favorecido",
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
              ) : visibleEntries.length ? (
                visibleEntries.map((entry) => {
                  const showCommonActions = canEditOrDelete(entry);
                  const showMenu = showCommonActions || canPay(entry) || isPaid(entry);

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
                    <TableCell>
                      <div className="flex min-w-32 flex-col gap-1">
                        <span className="font-medium">
                          {getBeneficiaryLabel(entry)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          <span
                            aria-label={`Tipo do favorecido: ${getBeneficiaryTypeLabel(
                              entry.beneficiaryType
                            )}`}
                          >
                            {getBeneficiaryTypeLabel(entry.beneficiaryType)}
                          </span>
                        </span>
                      </div>
                    </TableCell>
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
                        {canPay(entry) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentDialog(entry)}
                          >
                            <Banknote className="size-4" />
                            Pagar
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
                              {canPay(entry) ? (
                                <DropdownMenuItem
                                  onClick={() => openPaymentDialog(entry)}
                                >
                                  <CheckCircle2 className="size-4" />
                                  Marcar como paga
                                </DropdownMenuItem>
                              ) : null}
                              {isPaid(entry) ? (
                                <DropdownMenuItem
                                  onClick={() => openReversalDialog(entry)}
                                >
                                  <RotateCcw className="size-4" />
                                  Estornar pagamento
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
                      title="Nenhuma conta a pagar encontrada."
                      description="Contas pagas saem desta lista automaticamente. Cadastre novas obrigações ou use os filtros para consultar outros status."
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
        entries={visibleEntries}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPay={openPaymentDialog}
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
            <Field label="Tipo do favorecido">
              <Select
                value={beneficiaryType}
                onChange={(e) => {
                  const nextType = e.target
                    .value as AccountPayableBeneficiaryType;
                  setBeneficiaryType(nextType);
                  setBeneficiaryId("");
                  setBeneficiaryError("");
                  setCollaboratorSearch("");
                  setSelectedCollaboratorName("");
                  setSupplier("");
                }}
                options={[
                  { value: "supplier", label: "Fornecedor" },
                  { value: "collaborator", label: "Colaborador" },
                ]}
              />
            </Field>
            {beneficiaryType === "supplier" ? (
              <Field label="Fornecedor" error={beneficiaryError}>
                <Input
                  value={supplier}
                  onChange={(e) => {
                    setSupplier(e.target.value);
                    setBeneficiaryError("");
                  }}
                  placeholder="Nome do fornecedor"
                />
              </Field>
            ) : (
              <Field label="Selecionar colaborador">
                <div className="space-y-2">
                  <Input
                    value={collaboratorSearch}
                    onChange={(e) => {
                      setCollaboratorSearch(e.target.value);
                      setBeneficiaryId("");
                      setBeneficiaryError("");
                      setSelectedCollaboratorName("");
                    }}
                    onKeyDown={handleCollaboratorKeyDown}
                    placeholder="Digite para buscar um colaborador"
                    aria-describedby={
                      beneficiaryError
                        ? "account-payable-collaborator-status account-payable-beneficiary-error"
                        : "account-payable-collaborator-status"
                    }
                    aria-invalid={Boolean(beneficiaryError)}
                    aria-autocomplete="list"
                    aria-controls="account-payable-collaborator-options"
                    aria-expanded={
                      !selectedCollaborator && collaboratorOptions.length > 0
                    }
                    role="combobox"
                  />
                  <div
                    id="account-payable-collaborator-status"
                    className="rounded-[var(--radius-field)] border border-border bg-surface-soft p-2"
                  >
                    {selectedCollaborator ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {selectedCollaborator.name}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Colaborador selecionado
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setBeneficiaryId("");
                            setBeneficiaryError("");
                            setSelectedCollaboratorName("");
                            setCollaboratorSearch("");
                            setActiveCollaboratorIndex(0);
                          }}
                        >
                          Trocar
                        </Button>
                      </div>
                    ) : !collaboratorSearch.trim() ? (
                      <p className="py-1 text-xs font-semibold text-muted-foreground">
                        Digite para buscar um colaborador.
                      </p>
                    ) : collaboratorSearchQuery.isLoading ? (
                      <div className="space-y-2 py-1">
                        <div className="h-4 w-40 animate-pulse rounded-full bg-surface-muted" />
                        <div className="h-4 w-28 animate-pulse rounded-full bg-surface-muted" />
                      </div>
                    ) : collaboratorSearchQuery.isError ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-destructive">
                          Não foi possível buscar colaboradores. Tente novamente.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void collaboratorSearchQuery.refetch()}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    ) : collaboratorOptions.length ? (
                      <div
                        id="account-payable-collaborator-options"
                        className="grid gap-1"
                        role="listbox"
                        aria-label="Colaboradores encontrados"
                      >
                        {collaboratorOptions.map((collaborator, index) => (
                          <button
                            key={collaborator.id}
                            type="button"
                            role="option"
                            aria-selected={index === activeCollaboratorIndex}
                            className="inline-flex min-h-10 w-full items-center justify-start gap-2 rounded-[var(--radius-field)] px-3 text-left text-sm font-bold leading-none text-foreground transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 aria-selected:bg-surface aria-selected:ring-1 aria-selected:ring-primary/30"
                            onMouseEnter={() => setActiveCollaboratorIndex(index)}
                            onClick={() => selectCollaborator(collaborator)}
                          >
                            <span className="truncate">{collaborator.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="py-1 text-xs font-semibold text-muted-foreground">
                        Nenhum colaborador ativo encontrado com esse nome.
                      </p>
                    )}
                  </div>
                  {beneficiaryError ? (
                    <p
                      id="account-payable-beneficiary-error"
                      className="min-h-4 text-xs font-semibold leading-4 text-destructive"
                      role="alert"
                    >
                      {beneficiaryError}
                    </p>
                  ) : null}
                </div>
              </Field>
            )}
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
                  setStatus(e.target.value as AccountPayableRow["status"])
                }
                options={statusOptions}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Observações">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes internos da obrigação"
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
        open={!!payingEntry}
        onOpenChange={(v) => {
          if (!v) closePaymentDialog();
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton onClick={closePaymentDialog} />
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
            <DialogDescription>
              Confirme os dados para efetivar a despesa no Financeiro.
            </DialogDescription>
          </DialogHeader>
          {payingEntry ? (
            <div className="border-border bg-surface-muted rounded-[var(--radius-card)] border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-[0.04em] uppercase">
                    <ReceiptText className="size-4" />
                    Obrigação selecionada
                  </p>
                  <p className="text-foreground mt-1 truncate text-sm font-bold">
                    {payingEntry.description}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {getBeneficiaryLabel(payingEntry)} -{" "}
                    {payingEntry.categoryName}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-foreground text-sm font-bold">
                    {formatMoney(payingEntry.amount)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Vence em {formatDate(payingEntry.dueDate)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data do pagamento">
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                ariaLabel="Data do pagamento"
              />
            </Field>
            <Field label="Valor pago">
              <Input
                type="text"
                inputMode="decimal"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="R$ 0,00"
              />
            </Field>
            <Field label="Forma de pagamento">
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={PAYMENT_METHOD_OPTIONS}
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
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Observações do pagamento"
                />
              </Field>
            </div>
          </div>
          {hasPaymentDifference && payingEntry ? (
            <div className="text-muted-foreground flex items-start gap-2 rounded-[var(--radius-field)] border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs dark:border-amber-400/30 dark:bg-amber-400/10">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                O valor pago difere do valor original de{" "}
                {formatMoney(payingEntry.amount)}. O financeiro sera criado com
                o valor confirmado aqui.
              </span>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closePaymentDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmPayment} disabled={!canConfirmPayment}>
              <Banknote className="size-4" />
              {paying ? "Registrando..." : "Confirmar pagamento"}
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
      <Dialog
        open={!!reversalEntry}
        onOpenChange={(v) => {
          if (!v) closeReversalDialog();
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton onClick={closeReversalDialog} />
          <DialogHeader>
            <DialogTitle>Estornar pagamento</DialogTitle>
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
                {formatMoney(reversalEntry.amount)} - Pago em{" "}
                {formatDate(reversalEntry.paidDate)}
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
                placeholder="Ex: pagamento lançado incorretamente"
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

function AccountPayableMobileList({
  entries,
  isLoading,
  onEdit,
  onDelete,
  onPay,
  onReverse,
  onNew,
}: {
  entries: AccountPayableRow[] | undefined;
  isLoading: boolean;
  onEdit: (entry: AccountPayableRow) => void;
  onDelete: (entry: AccountPayableRow) => void;
  onPay: (entry: AccountPayableRow) => void;
  onReverse: (entry: AccountPayableRow) => void;
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
                {getBeneficiaryLabel(entry)}
                <span className="sr-only">
                  {`Tipo do favorecido: ${getBeneficiaryTypeLabel(
                    entry.beneficiaryType
                  )}`}
                </span>
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {getDueHelper(entry, todayKey)}
                {entry.costCenterName ? ` - ${entry.costCenterName}` : ""}
              </p>
            </div>
            <strong className="money money-expense">
              {formatMoney(entry.amount)}
            </strong>
          </div>
          <div className="mobile-record-bottom">
            <StatusBadge status={entry.status} />
            <div className="flex items-center gap-2">
              {canPay(entry) ? (
                <Button size="sm" onClick={() => onPay(entry)}>
                  <Banknote className="size-4" />
                  Pagar
                </Button>
              ) : null}
              {canEditOrDelete(entry) || canPay(entry) || isPaid(entry) ? (
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
                    {canEditOrDelete(entry) ? (
                      <DropdownMenuItem onClick={() => onEdit(entry)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                    ) : null}
                    {canPay(entry) ? (
                      <DropdownMenuItem onClick={() => onPay(entry)}>
                        <CheckCircle2 className="size-4" />
                        Marcar como paga
                      </DropdownMenuItem>
                    ) : null}
                    {isPaid(entry) ? (
                      <DropdownMenuItem onClick={() => onReverse(entry)}>
                        <RotateCcw className="size-4" />
                        Estornar pagamento
                      </DropdownMenuItem>
                    ) : null}
                    {canEditOrDelete(entry) ? (
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
      ))}
    </div>
  );
}
