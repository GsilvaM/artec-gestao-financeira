import { useState } from "react";
import { Factory, MoreHorizontal, Pencil, Trash2, Truck, UserRoundPlus } from "lucide-react";
import { ClientDialog, type ClientRecord } from "@/components/forms/client-dialog";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge, StatusSelect } from "@/components/layout/page-shell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [deleting, setDeleting] = useState<ClientRecord | null>(null);
  const [records, setRecords] = useState<ClientRecord[]>([]);

  function handleSave(data: ClientRecord) {
    setRecords((current) => {
      const exists = current.findIndex((r) => r.id === data.id);
      if (exists >= 0) {
        const copy = [...current];
        copy[exists] = data;
        return copy;
      }
      return [data, ...current];
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    setRecords((current) => current.filter((r) => r.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <PageShell icon={Truck} title="Fornecedores" subtitle="Organize fornecedores, prestadores e parceiros financeiros" actionLabel="Novo Fornecedor" onAction={() => { setEditing(null); setOpen(true); }}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Fornecedores ativos" value={String(records.length)} icon={Factory} tone="blue" />
        <MetricCard title="Novos contatos" value="0" icon={UserRoundPlus} tone="slate" />
      </div>
      <FilterBar searchPlaceholder="Buscar fornecedor..."><StatusSelect /></FilterBar>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["Nome/Razão Social", "Documento", "Contato", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {records.length ? records.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.nome}</TableCell>
                <TableCell>{supplier.documento}</TableCell>
                <TableCell><div>{supplier.telefone}</div><div className="text-xs text-muted-foreground">{supplier.email}</div></TableCell>
                <TableCell><StatusBadge status={supplier.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { setEditing(supplier); setOpen(true); }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => setDeleting(supplier)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={5} className="p-0"><EmptyState title="Nenhum fornecedor encontrado." description="Cadastre fornecedores para organizar contas a pagar e compras." actionLabel="Novo Fornecedor" onAction={() => { setEditing(null); setOpen(true); }} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <ClientDialog open={open} onOpenChange={setOpen} record={editing} onSave={handleSave} />
      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeleting(null)} />
          <DialogHeader>
            <DialogTitle>Excluir Fornecedor</DialogTitle>
            <DialogDescription>Confirma a exclusão de <strong>{deleting?.nome}</strong>? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
