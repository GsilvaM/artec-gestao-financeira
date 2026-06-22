import { useState } from "react";
import { Building2, MoreHorizontal, Pencil, Trash2, UserRoundPlus, Users } from "lucide-react";
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
    <PageShell icon={Users} title="Clientes" subtitle="Cadastre clientes para lançamentos, serviços e relatórios" actionLabel="Novo Cliente" onAction={() => { setEditing(null); setOpen(true); }}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Clientes ativos" value={String(records.length)} icon={UserRoundPlus} tone="blue" />
        <MetricCard title="Empresas" value={String(records.filter((r) => r.documento.length > 11).length)} icon={Building2} tone="slate" />
      </div>
      <FilterBar searchPlaceholder="Buscar cliente, documento ou e-mail..."><StatusSelect /></FilterBar>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["Nome/Razão Social", "Documento", "Contato", "Cidade", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {records.length ? records.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.nome}</TableCell>
                <TableCell>{client.documento}</TableCell>
                <TableCell><div>{client.telefone}</div><div className="text-xs text-[#64748B]">{client.email}</div></TableCell>
                <TableCell>{client.observacoes || "-"}</TableCell>
                <TableCell><StatusBadge status={client.status} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { setEditing(client); setOpen(true); }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => setDeleting(client)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="p-0"><EmptyState title="Nenhum cliente encontrado." description="Cadastre clientes para vincular serviços, contas e lançamentos." actionLabel="Novo Cliente" onAction={() => { setEditing(null); setOpen(true); }} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <ClientDialog open={open} onOpenChange={setOpen} record={editing} onSave={handleSave} />
      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeleting(null)} />
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
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
