import { useState } from "react";
import { toast } from "sonner";
import { FolderTree, MoreHorizontal, Pencil, Tags, Trash2 } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/domain/financeiro/hooks/use-categories";
import type { CategoryRow } from "@/domain/financeiro/types";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [color, setColor] = useState("#3B82F6");

  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory();
  const { mutateAsync: deleteCategory, isPending: deleting } = useDeleteCategory();

  const isEditing = !!editingId;
  const isWorking = creating || updating;

  function resetForm() {
    setName("");
    setType("receita");
    setColor("#3B82F6");
    setEditingId(null);
  }

  function handleEdit(cat: CategoryRow) {
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color ?? "#3B82F6");
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
    } catch {
      toast.error("Erro ao excluir categoria");
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
    } catch {
      toast.error("Erro ao salvar categoria");
    }
  }

  return (
    <PageShell icon={Tags} title="Categorias" subtitle="Organize receitas, custos e despesas por classificação" actionLabel="Nova Categoria" onAction={() => { resetForm(); setOpen(true); }}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Categorias ativas" value={String(categories?.length ?? 0)} icon={FolderTree} tone="blue" />
      </div>
      <FilterBar searchPlaceholder="Buscar categoria...">
        <Select value={type} onChange={(e) => setType(e.target.value as "receita" | "despesa")} options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} />
      </FilterBar>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>{["Nome", "Tipo", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-48 text-center text-sm text-[#64748B]">Carregando...</TableCell></TableRow>
            ) : categories?.length ? categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium"><span className="inline-flex items-center gap-2"><span className="inline-block size-3 rounded-full" style={{ backgroundColor: cat.color ?? "#94A3B8" }} />{cat.name}</span></TableCell>
                <TableCell>{cat.type === "receita" ? "Receita" : "Despesa"}</TableCell>
                <TableCell><StatusBadge status="ativo" /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(cat)}><Pencil className="size-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => handleDelete(cat)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="p-0"><EmptyState title="Nenhuma categoria encontrada." description="Crie categorias para melhorar relatórios, DRE e filtros financeiros." actionLabel="Nova Categoria" onAction={() => { resetForm(); setOpen(true); }} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => { resetForm(); setOpen(false); }} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
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
            <DialogTitle>Excluir Categoria</DialogTitle>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
