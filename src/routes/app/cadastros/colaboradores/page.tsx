import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BriefcaseBusiness,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import {
  EmptyState,
  FilterBar,
  MetricCard,
  PageShell,
  StatusBadge,
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
  useCollaborators,
  useCreateCollaborator,
  useDeleteCollaborator,
  useUpdateCollaborator,
} from "@/domain/financeiro/hooks/use-collaborators";
import type {
  CollaboratorFilters,
  CollaboratorRow,
} from "@/domain/financeiro/types";

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
  active: "true" | "false";
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "",
  active: "true",
};

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const filters = useMemo<CollaboratorFilters | undefined>(
    () => ({
      search: search || undefined,
      includeInactive,
    }),
    [includeInactive, search]
  );

  const { data: collaborators, isLoading } = useCollaborators(filters);
  const { mutateAsync: createCollaborator, isPending: creating } =
    useCreateCollaborator();
  const { mutateAsync: updateCollaborator, isPending: updating } =
    useUpdateCollaborator();
  const { mutateAsync: deleteCollaborator, isPending: deleting } =
    useDeleteCollaborator();

  const isEditing = !!editingId;
  const isWorking = creating || updating;
  const activeCount = collaborators?.filter((item) => item.active).length ?? 0;

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleEdit(collaborator: CollaboratorRow) {
    setForm({
      name: collaborator.name,
      email: collaborator.email ?? "",
      phone: collaborator.phone ?? "",
      role: collaborator.role ?? "",
      active: collaborator.active ? "true" : "false",
    });
    setEditingId(collaborator.id);
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do colaborador");
      return;
    }

    const data = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      role: form.role.trim() || undefined,
      active: form.active === "true",
    };

    try {
      if (editingId) {
        await updateCollaborator({ id: editingId, data });
        toast.success("Colaborador atualizado");
      } else {
        await createCollaborator(data);
        toast.success("Colaborador criado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar colaborador";
      console.error("[save-collaborator]", msg, err);
      toast.error(msg);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteCollaborator(deletingId);
      toast.success("Colaborador inativado");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao inativar colaborador";
      console.error("[delete-collaborator]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageShell
      icon={UsersRound}
      title="Colaboradores"
      subtitle="Cadastre equipe, terceiros e responsaveis para vincular aos lancamentos."
      actionLabel="Novo colaborador"
      onAction={() => {
        resetForm();
        setOpen(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Colaboradores ativos"
          value={String(activeCount)}
          icon={UserRoundCheck}
          tone="blue"
        />
        <MetricCard
          title="Funcoes cadastradas"
          value={String(
            new Set(
              (collaborators ?? []).map((item) => item.role).filter(Boolean)
            ).size
          )}
          icon={BriefcaseBusiness}
          tone="slate"
        />
      </div>

      <FilterBar
        searchPlaceholder="Buscar colaborador, e-mail, telefone ou funcao..."
        search={search}
        onSearchChange={setSearch}
        activeFilters={
          includeInactive
            ? [{ key: "includeInactive", label: "Inclui inativos", onRemove: () => setIncludeInactive(false) }]
            : []
        }
      >
        <Select
          value={includeInactive ? "true" : "false"}
          onChange={(event) =>
            setIncludeInactive(event.target.value === "true")
          }
          options={[
            { value: "false", label: "Somente ativos" },
            { value: "true", label: "Todos" },
          ]}
          aria-label="Filtrar colaboradores por status"
        />
      </FilterBar>

      <div className="desktop-table">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {["Nome", "Funcao", "Contato", "Status", "Acoes"].map(
                  (column) => (
                    <TableHead key={column}>{column}</TableHead>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-48 text-center text-sm"
                  >
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : collaborators?.length ? (
                collaborators.map((collaborator) => (
                  <TableRow key={collaborator.id}>
                    <TableCell className="font-medium">
                      {collaborator.name}
                    </TableCell>
                    <TableCell>{collaborator.role || "-"}</TableCell>
                    <TableCell>
                      <div>{collaborator.phone || "-"}</div>
                      <div className="text-muted-foreground text-xs">
                        {collaborator.email || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={collaborator.active ? "ativo" : "disabled"}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Acoes"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleEdit(collaborator)}
                          >
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onClick={() => setDeletingId(collaborator.id)}
                          >
                            <Trash2 className="size-4" />
                            Inativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="Nenhum colaborador encontrado."
                      description="Cadastre colaboradores para vincular custos, comissoes e responsaveis aos lancamentos."
                      actionLabel="Novo colaborador"
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

      <CollaboratorMobileList
        collaborators={collaborators}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(collaborator) => setDeletingId(collaborator.id)}
        onNew={() => {
          resetForm();
          setOpen(true);
        }}
      />

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) resetForm();
          setOpen(value);
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
              {isEditing ? "Editar colaborador" : "Novo colaborador"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere os dados do colaborador."
                : "Cadastre dados basicos para usar nos lancamentos."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Nome completo"
              />
            </Field>
            <Field label="Funcao">
              <Input
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                placeholder="Ex: tecnico, vendedor, administrativo"
              />
            </Field>
            <Field label="Telefone">
              <Input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="(00) 00000-0000"
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="colaborador@email.com"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.active}
                onChange={(event) => updateField("active", event.target.value)}
                options={[
                  { value: "true", label: "Ativo" },
                  { value: "false", label: "Inativo" },
                ]}
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
        onOpenChange={(value) => {
          if (!value) setDeletingId(null);
        }}
      >
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeletingId(null)} />
          <DialogHeader>
            <DialogTitle>Inativar colaborador</DialogTitle>
            <DialogDescription>
              O colaborador sera removido das novas selecoes, mas os lancamentos
              ja vinculados continuam preservados.
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
              {deleting ? "Inativando..." : "Inativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function CollaboratorMobileList({
  collaborators,
  isLoading,
  onEdit,
  onDelete,
  onNew,
}: {
  collaborators: CollaboratorRow[] | undefined;
  isLoading: boolean;
  onEdit: (collaborator: CollaboratorRow) => void;
  onDelete: (collaborator: CollaboratorRow) => void;
  onNew: () => void;
}) {
  if (isLoading) {
    return (
      <div className="mobile-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="mobile-record-card">
            <div className="bg-surface-muted h-4 w-40 animate-pulse rounded-full" />
            <div className="bg-surface-muted mt-2 h-3 w-28 animate-pulse rounded-full" />
            <div className="bg-border mt-4 h-px" />
            <div className="bg-surface-muted mt-4 h-4 w-48 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!collaborators?.length) {
    return (
      <div className="mobile-list">
        <EmptyState
          title="Nenhum colaborador encontrado."
          description="Cadastre colaboradores para vincular custos, comissoes e responsaveis aos lancamentos."
          actionLabel="Novo colaborador"
          onAction={onNew}
        />
      </div>
    );
  }

  return (
    <div className="mobile-list">
      {collaborators.map((collaborator) => (
        <article key={collaborator.id} className="mobile-record-card">
          <div className="mobile-record-top">
            <div className="min-w-0">
              <h3 className="text-text-primary truncate text-sm font-bold">
                {collaborator.name}
              </h3>
              <p className="text-text-muted mt-1 text-xs">
                {collaborator.role || "Funcao nao informada"}
              </p>
              <p className="text-text-secondary mt-1 truncate text-xs">
                {collaborator.phone ||
                  collaborator.email ||
                  "Contato nao informado"}
              </p>
            </div>
            <StatusBadge status={collaborator.active ? "ativo" : "disabled"} />
          </div>
          <div className="mobile-record-bottom">
            <span className="text-text-muted text-xs font-semibold">
              {collaborator.email || "-"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Acoes do colaborador"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit(collaborator)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  destructive
                  onClick={() => onDelete(collaborator)}
                >
                  <Trash2 className="size-4" />
                  Inativar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </article>
      ))}
    </div>
  );
}
