import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Banknote, Check, FileText, Loader2, Search, Tag, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CategoryRow, CollaboratorRow, FinancialEntryRow } from "@/domain/financeiro/types";

export interface LancamentoFormState {
  data: string;
  tipo: string;
  categoria: string;
  descricao: string;
  cliente: string;
  colaborador: string;
  valor: string;
  status: string;
  observacoes: string;
}

type LancamentoModo = "criar" | "editar" | "duplicar";
type LancamentoContexto = "financeiro" | "contas-a-pagar" | "contas-a-receber" | "movimentacoes";

interface LancamentoModalProps {
  open: boolean;
  modo: LancamentoModo;
  tipoInicial?: "receita" | "despesa";
  contexto?: LancamentoContexto;
  lancamento?: FinancialEntryRow | null;
  duplicarDe?: FinancialEntryRow | null;
  form: LancamentoFormState;
  errors: Record<string, string>;
  categories: CategoryRow[];
  collaborators: CollaboratorRow[];
  isWorking: boolean;
  onFieldChange: (field: keyof LancamentoFormState, value: string) => void;
  onSave: () => void;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}

export function LancamentoModal({
  open,
  modo,
  contexto = "financeiro",
  lancamento,
  duplicarDe,
  form,
  errors,
  categories,
  collaborators,
  isWorking,
  onFieldChange,
  onSave,
  onClose,
  onOpenChange,
}: LancamentoModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const isReceita = form.tipo === "receita";
  const accent = isReceita ? "var(--color-success)" : "var(--color-danger)";

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.type === form.tipo).map((category) => ({ value: category.name, label: category.name })),
    [categories, form.tipo],
  );

  const title = modo === "editar" ? "Editar lançamento" : modo === "duplicar" ? "Duplicar lançamento" : "Novo lançamento";
  const description = modo === "editar"
    ? "Altere os dados do lançamento selecionado."
    : modo === "duplicar"
      ? "Revise os dados copiados e confirme a nova data antes de salvar."
      : "Registre uma receita, custo ou despesa com os dados essenciais.";

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => firstInputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="relative bg-[var(--color-bg-modal)] p-0 sm:p-0"
        style={{ "--color-border-focus": accent } as React.CSSProperties}
      >
        <DialogCloseButton onClick={onClose} />
        <div className="border-b border-border/80 px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="mb-0 border-0 p-0 pr-10">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {modo === "duplicar" && duplicarDe ? (
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-[var(--color-bg-field)] px-3 py-1.5 text-xs font-semibold leading-none text-muted-foreground">
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">Baseado em: {duplicarDe.description}</span>
            </div>
          ) : null}
        </div>

        <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-[var(--color-bg-field)] p-1.5">
            <SegmentButton active={form.tipo === "receita"} tone="success" onClick={() => onFieldChange("tipo", "receita")}>
              <ArrowUpCircle className="size-4" />
              Receita
            </SegmentButton>
            <SegmentButton active={form.tipo === "despesa"} tone="danger" onClick={() => onFieldChange("tipo", "despesa")}>
              <ArrowDownCircle className="size-4" />
              Despesa
            </SegmentButton>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Valor" error={errors.valor} icon={<Banknote className="size-4" />}>
              <Input
                ref={firstInputRef}
                type="text"
                inputMode="decimal"
                value={form.valor}
                onChange={(event) => onFieldChange("valor", event.target.value)}
                placeholder="0,00"
                className="min-h-[var(--field-height)] rounded-[var(--radius-field)] bg-[var(--color-bg-field)] pl-10 text-right focus-visible:border-[var(--color-border-focus)] focus-visible:ring-[color-mix(in_srgb,var(--color-border-focus)_24%,transparent)]"
              />
            </ModalField>

            <ModalField label="Data" error={errors.data}>
              <DatePicker value={form.data} onChange={(value) => onFieldChange("data", value)} invalid={Boolean(errors.data)} />
            </ModalField>

            <ModalField label="Tipo" error={errors.tipo}>
              <Select
                value={form.tipo}
                onChange={(event) => onFieldChange("tipo", event.target.value)}
                options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]}
                className="min-h-[var(--field-height)] rounded-[var(--radius-field)] bg-[var(--color-bg-field)] focus-visible:border-[var(--color-border-focus)]"
              />
            </ModalField>

            <ModalField label="Categoria" error={errors.categoria} icon={<Tag className="size-4" />}>
              <Select
                value={form.categoria}
                onChange={(event) => onFieldChange("categoria", event.target.value)}
                options={categoryOptions}
                placeholder={categories.length ? "Selecione..." : "Nenhuma categoria"}
                className="min-h-[var(--field-height)] rounded-[var(--radius-field)] bg-[var(--color-bg-field)] pl-10 focus-visible:border-[var(--color-border-focus)]"
              />
            </ModalField>

            <ModalField label="Status" error={errors.status}>
              <Select
                value={form.status}
                onChange={(event) => onFieldChange("status", event.target.value)}
                options={[{ value: "aberto", label: "Aberto" }, { value: "pago", label: "Pago" }, { value: "vencido", label: "Vencido" }]}
                className="min-h-[var(--field-height)] rounded-[var(--radius-field)] bg-[var(--color-bg-field)] focus-visible:border-[var(--color-border-focus)]"
              />
            </ModalField>

            <ModalField label="Vínculo (cliente/fornecedor)" icon={<Search className="size-4" />}>
              <Input
                value={form.cliente ?? ""}
                onChange={(event) => onFieldChange("cliente", event.target.value)}
                placeholder="Cliente relacionado (opcional)"
                className="min-h-[var(--field-height)] rounded-[var(--radius-field)] bg-[var(--color-bg-field)] pl-10 focus-visible:border-[var(--color-border-focus)]"
              />
            </ModalField>

            <ModalField label="Descrição" error={errors.descricao} className="sm:col-span-2">
              <Input
                value={form.descricao}
                onChange={(event) => onFieldChange("descricao", event.target.value)}
                placeholder="Descrição do lançamento"
                className="min-h-[var(--field-height)] rounded-[var(--radius-field)] bg-[var(--color-bg-field)] focus-visible:border-[var(--color-border-focus)]"
              />
            </ModalField>

            <ModalField label="Vínculo (colaborador)" icon={<UserRound className="size-4" />}>
              <Select
                value={form.colaborador ?? ""}
                onChange={(event) => onFieldChange("colaborador", event.target.value)}
                placeholder="Nenhum colaborador"
                options={collaborators.map((collaborator) => ({ value: collaborator.id, label: collaborator.name }))}
                className="min-h-[var(--field-height)] rounded-[var(--radius-field)] bg-[var(--color-bg-field)] pl-10 focus-visible:border-[var(--color-border-focus)]"
              />
            </ModalField>

            <ModalField label="Observações" className="sm:col-span-2">
              <Textarea
                value={form.observacoes ?? ""}
                onChange={(event) => onFieldChange("observacoes", event.target.value)}
                placeholder="Informações adicionais"
                className="rounded-[var(--radius-field)] bg-[var(--color-bg-field)] focus-visible:border-[var(--color-border-focus)]"
              />
            </ModalField>
          </div>
        </div>

        <DialogFooter className="mt-0 border-t border-border/80 px-5 pb-5 pt-4 sm:flex-row sm:px-6">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} disabled={isWorking} className={isReceita ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}>
            {isWorking ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {isWorking ? "Salvando..." : modo === "editar" ? "Atualizar lançamento" : "Salvar lançamento"}
          </Button>
        </DialogFooter>
        <span className="sr-only">Contexto do modal: {contexto}. Lançamento atual: {lancamento?.id ?? "novo"}.</span>
      </DialogContent>
    </Dialog>
  );
}

function SegmentButton({ active, tone, onClick, children }: { active: boolean; tone: "success" | "danger"; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold leading-none transition-all [&_svg]:size-4 [&_svg]:shrink-0",
        active
          ? tone === "success"
            ? "bg-success text-white shadow-[var(--shadow-sm)]"
            : "bg-destructive text-white shadow-[var(--shadow-sm)]"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ModalField({ label, error, icon, className, children }: { label: string; error?: string; icon?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("group grid gap-1.5", className)}>
      <span className="text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
      <span className="relative block">
        {icon ? <span className="pointer-events-none absolute left-3 top-1/2 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors group-focus-within:text-[var(--color-border-focus)]">{icon}</span> : null}
        {children}
      </span>
      <span className="min-h-4 text-xs font-semibold leading-4 text-destructive">
        {error ? (
          <span className="inline-flex items-center gap-1">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </span>
        ) : null}
      </span>
    </label>
  );
}
