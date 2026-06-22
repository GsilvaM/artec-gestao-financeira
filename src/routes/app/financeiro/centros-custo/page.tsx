import { useState } from "react";
import { toast } from "sonner";
import { Building, MoreHorizontal, Network, Pencil, Trash2 } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCostCenters, useCreateCostCenter, useUpdateCostCenter, useDeleteCostCenter } from "@/domain/financeiro/hooks/use-cost-centers";
import type { CostCenterRow } from "@/domain/financeiro/types";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const { data: centers, isLoading } = useCostCenters(true);
  const { mutateAsync: createCenter, isPending: creating } = useCreateCostCenter();
  const { mutateAsync: updateCenter, isPending: updating } = useUpdateCostCenter();
  const { mutateAsync: deleteCenter, isPending: deleting } = useDeleteCostCenter();

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
      const msg = err instanceof Error ? err.message : "Erro ao excluir centro de custo";
      console.error("[delete-cost-center]", msg, err);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Informe o nome do centro de custo"); return; }
    try {
      if (editingId) {
        await updateCenter({ id: editingId, data: { name: name.trim(), code: code.trim() || undefined } });
        toast.success("Centro de custo atualizado");
      } else {
        await createCenter({ name: name.trim(), code: code.trim() || undefined });
        toast.success("Centro de custo criado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar centro de custo";
      console.error("[save-cost-center]", msg, err);
      toast.error(msg);
    }
  }

  return (
    <PageShell icon={Network} title="Centros de Custo" subtitle="Agrupe receitas e despesas por unidade de operação" actionLabel="Novo Centro" onAction={() => { resetForm(); setOpen(true); }}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Centros ativos" value={String((centers ?? []).filter((c) => c.active).length)} icon={Building} tone="blue" />
      </div>
      <FilterBar searchPlaceholder="Buscar centro de custo..." />
      <Card className="overflow-visible">
        <Table>
          <TableHeader>
            <TableRow>{["Código", "Nome", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-48 text-center text-sm text-[#64748B]">Carregando...</TableCell></TableRow>
            ) : centers?.length ? centers.map((cc) => (
              <TableRow key={cc.id}>
                <TableCell className="font-mono text-sm">{cc.code ?? "-"}</TableCell>
                <TableCell className="font-medium">{cc.name}</TableCell>
                <TableCell><StatusBadge status={cc.active ? "ativo" : "rascunho"} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(cc)}><Pencil className="size-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => handleDelete(cc)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="p-0"><EmptyState title="Nenhum centro de custo encontrado." description="Cadastre centros para acompanhar rentabilidade e desempenho." actionLabel="Novo Centro" onAction={() => { resetForm(); setOpen(true); }} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => { resetForm(); setOpen(false); }} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle>
            <DialogDescription>{isEditing ? "Altere os dados do centro de custo." : "Crie um centro para agrupar lançamentos."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Administrativo, Vendas, Produção" /></Field>
            <Field label="Código"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: ADM, VND, PRO" /></Field>
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
            <DialogTitle>Excluir Centro de Custo</DialogTitle>
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
