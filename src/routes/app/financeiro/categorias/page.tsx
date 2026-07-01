import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderTree, MoreHorizontal, Pencil, Tags, Trash2 } from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/domain/financeiro/hooks/use-categories";
import type { CategoryFilters, CategoryRow } from "@/domain/financeiro/types";

const DEFAULT_CATEGORY_COLOR = `#${"3B82F6"}`;
const CATEGORY_DOT_FALLBACK = "var(--primary)";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [search, setSearch] = useState("");

  const filters = useMemo<CategoryFilters | undefined>(() => {
    const f: CategoryFilters = {};
    if (search) f.search = search;
    f.type = type;
    return f;
  }, [search, type]);

  const { data: categories, isLoading } = useCategories(filters);
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory();
  const { mutateAsync: deleteCategory, isPending: deleting } = useDeleteCategory();

  const isEditing = !!editingId;
  const isWorking = creating || updating;

  function resetForm() {
    setName("");
    setType("receita");
    setColor(DEFAULT_CATEGORY_COLOR);
    setEditingId(null);
  }

  function handleEdit(cat: CategoryRow) {
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color ?? DEFAULT_CATEGORY_COLOR);
    setEditingId(cat.id);
    setOpen(true);
  }

  function handleDelete(cat: CategoryRow) {
    setDeletingId(cat.id);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await deleteCategory(deletingId);
      toast.success("Categoria excluída");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir categoria";
      console.error("[delete-category]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Informe o nome da categoria"); return; }
    try {
      if (editingId) {
        await updateCategory({ id: editingId, data: { name: name.trim(), type, color } });
        toast.success("Categoria atualizada");
      } else {
        await createCategory({ name: name.trim(), type, color });
        toast.success("Categoria criada");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar categoria";
      console.error("[save-category]", msg, err);
      toast.error(msg);
    }
  }

  return (
    <PageShell icon={Tags} title="Categorias" subtitle="Organize receitas, custos e despesas por classificação" actionLabel="Nova categoria" onAction={() => { resetForm(); setOpen(true); }}>
      <div className="grid grid-cols-1 items-stretch gap-4">
        <MetricCard title="Categorias ativas" value={String(categories?.length ?? 0)} icon={FolderTree} tone="blue" />
      </div>

      <FilterBar searchPlaceholder="Buscar categoria..." search={search} onSearchChange={setSearch}>
        <Select value={type} onChange={(e) => setType(e.target.value as "receita" | "despesa")} options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} />
      </FilterBar>

      <div className="desktop-table">
        <DesktopCategoryTable
          categories={categories}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={() => { resetForm(); setOpen(true); }}
        />
      </div>

      <div className="mobile-list">
        <MobileCategoryList
          categories={categories}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNew={() => { resetForm(); setOpen(true); }}
        />
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => { resetForm(); setOpen(false); }} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>{isEditing ? "Altere os dados da categoria." : "Crie uma categoria para classificar lançamentos."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Materiais, Aluguel, Vendas" /></Field>
            <Field label="Tipo"><Select value={type} onChange={(e) => setType(e.target.value as "receita" | "despesa")} options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} /></Field>
            <Field label="Cor"><div className="flex items-center gap-3"><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 p-1" /><Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#RRGGBB" className="flex-1" /></div></Field>
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
            <DialogTitle>Excluir categoria</DialogTitle>
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

function DesktopCategoryTable({
  categories,
  isLoading,
  onEdit,
  onDelete,
  onNew,
}: {
  categories: CategoryRow[] | undefined;
  isLoading: boolean;
  onEdit: (cat: CategoryRow) => void;
  onDelete: (cat: CategoryRow) => void;
  onNew: () => void;
}) {
  return (
    <div className="table-card" style={{ padding: 0 }}>
      <Table>
        <TableHeader>
          <TableRow>{["Nome", "Tipo", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="h-48 text-center text-sm text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : categories?.length ? categories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium"><span className="inline-flex items-center gap-2"><span className="inline-block size-3 rounded-full" style={{ backgroundColor: cat.color ?? CATEGORY_DOT_FALLBACK }} />{cat.name}</span></TableCell>
              <TableCell>{cat.type === "receita" ? "Receita" : "Despesa"}</TableCell>
              <TableCell><StatusBadge status="ativo" /></TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="size-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(cat)}><Pencil className="size-4" />Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onClick={() => onDelete(cat)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={4} className="p-0"><EmptyState title="Nenhuma categoria encontrada." description="Crie categorias para melhorar relatórios, DRE e filtros financeiros." actionLabel="Nova categoria" onAction={onNew} /></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileCategoryList({
  categories,
  isLoading,
  onEdit,
  onDelete,
  onNew,
}: {
  categories: CategoryRow[] | undefined;
  isLoading: boolean;
  onEdit: (cat: CategoryRow) => void;
  onDelete: (cat: CategoryRow) => void;
  onNew: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="category-card">
            <div className="flex items-center gap-3">
              <div className="size-5 animate-pulse rounded-full bg-surface-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-full bg-surface-muted" />
                <div className="h-3 w-20 animate-pulse rounded-full bg-surface-muted" />
              </div>
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <EmptyState title="Nenhuma categoria encontrada." description="Crie categorias para melhorar relatórios, DRE e filtros financeiros." actionLabel="Nova categoria" onAction={onNew} />
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <article key={cat.id} className="category-card">
          <div className="category-main">
            <span className="category-dot" style={{ backgroundColor: cat.color ?? CATEGORY_DOT_FALLBACK }} />
            <div>
              <h3>{cat.name}</h3>
              <p>{cat.type === "receita" ? "Receita" : "Despesa"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="ativo" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ações">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit(cat)}><Pencil className="size-4" />Editar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => onDelete(cat)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </article>
      ))}
    </div>
  );
}
