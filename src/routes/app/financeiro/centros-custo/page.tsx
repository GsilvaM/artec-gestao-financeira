import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building,
  MoreHorizontal,
  Network,
  Pencil,
  Trash2,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
} from "@/domain/financeiro/hooks/use-cost-centers";
import type {
  CostCenterFilters,
  CostCenterRow,
} from "@/domain/financeiro/types";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");

  const filters = useMemo<CostCenterFilters | undefined>(() => {
    const f: CostCenterFilters = { includeInactive: true };
    if (search) f.search = search;
    return f;
  }, [search]);

  const { data: centers, isLoading } = useCostCenters(filters);
  const { mutateAsync: createCenter, isPending: creating } =
    useCreateCostCenter();
  const { mutateAsync: updateCenter, isPending: updating } =
    useUpdateCostCenter();
  const { mutateAsync: deleteCenter, isPending: deleting } =
    useDeleteCostCenter();

  const isEditing = !!editingId;
  const isWorking = creating || updating;

  function resetForm() {
    setName("");
    setCode("");
    setEditingId(null);
  }

  function handleEdit(cc: CostCenterRow) {
    setName(cc.name);
    setCode(cc.code ?? "");
    setEditingId(cc.id);
    setOpen(true);
  }

  function handleDelete(cc: CostCenterRow) {
    setDeletingId(cc.id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteCenter(deletingId);
      toast.success("Centro de custo excluído");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao excluir centro de custo";
      console.error("[delete-cost-center]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome do centro de custo");
      return;
    }
    try {
      if (editingId) {
        await updateCenter({
          id: editingId,
          data: { name: name.trim(), code: code.trim() || undefined },
        });
        toast.success("Centro de custo atualizado");
      } else {
        await createCenter({
          name: name.trim(),
          code: code.trim() || undefined,
        });
        toast.success("Centro de custo criado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar centro de custo";
      console.error("[save-cost-center]", msg, err);
      toast.error(msg);
    }
  }

  return (
    <PageShell
      icon={Network}
      title="Centros de custo"
      subtitle="Agrupe receitas e despesas por unidade de operação"
      actionLabel="Novo centro"
      onAction={() => {
        resetForm();
        setOpen(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Centros ativos"
          value={String((centers ?? []).filter((c) => c.active).length)}
          icon={Building}
          tone="blue"
        />
      </div>
      <FilterBar
        searchPlaceholder="Buscar centro de custo..."
        search={search}
        onSearchChange={setSearch}
      />
      <div className="desktop-table">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {["Código", "Nome", "Status", "Ações"].map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground h-48 text-center text-sm"
                  >
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : centers?.length ? (
                centers.map((cc) => (
                  <TableRow key={cc.id}>
                    <TableCell className="font-mono text-sm">
                      {cc.code ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">{cc.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={cc.active ? "ativo" : "rascunho"} />
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
                          <DropdownMenuItem onClick={() => handleEdit(cc)}>
                            <Pencil className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            destructive
                            onClick={() => handleDelete(cc)}
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
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      title="Nenhum centro de custo encontrado."
                      description="Cadastre centros para acompanhar rentabilidade e desempenho."
                      actionLabel="Novo centro"
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
      <CostCenterMobileList
        centers={centers}
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
              {isEditing ? "Editar centro de custo" : "Novo centro de custo"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere os dados do centro de custo."
                : "Crie um centro para agrupar lançamentos."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Administrativo, Vendas, Produção"
              />
            </Field>
            <Field label="Código">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: ADM, VND, PRO"
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
            <DialogTitle>Excluir centro de custo</DialogTitle>
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

function CostCenterMobileList({
  centers,
  isLoading,
  onEdit,
  onDelete,
  onNew,
}: {
  centers: CostCenterRow[] | undefined;
  isLoading: boolean;
  onEdit: (center: CostCenterRow) => void;
  onDelete: (center: CostCenterRow) => void;
  onNew: () => void;
}) {
  if (isLoading) {
    return (
      <div className="mobile-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="category-card">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-surface-muted h-4 w-36 animate-pulse rounded-full" />
              <div className="bg-surface-muted h-3 w-20 animate-pulse rounded-full" />
            </div>
            <div className="bg-surface-muted h-8 w-8 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!centers?.length) {
    return (
      <div className="mobile-list">
        <EmptyState
          title="Nenhum centro de custo encontrado."
          description="Cadastre centros para acompanhar rentabilidade e desempenho."
          actionLabel="Novo centro"
          onAction={onNew}
        />
      </div>
    );
  }

  return (
    <div className="mobile-list">
      {centers.map((center) => (
        <article key={center.id} className="category-card">
          <div className="category-main">
            <span className="category-dot category-dot-success" />
            <div>
              <h3>{center.name}</h3>
              <p>{center.code ?? "Sem codigo"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={center.active ? "ativo" : "rascunho"} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="AÃ§Ãµes do centro de custo"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit(center)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => onDelete(center)}>
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
