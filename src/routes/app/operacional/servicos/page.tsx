import { useState } from "react";
import { ClipboardList, Clock, MoreHorizontal, Pencil, PlayCircle, Trash2, Wrench } from "lucide-react";
import { ServiceDialog, type ServiceRecord } from "@/components/forms/service-dialog";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge, StatusSelect } from "@/components/layout/page-shell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [deleting, setDeleting] = useState<ServiceRecord | null>(null);
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  function handleSave(data: ServiceRecord) {
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
    <PageShell icon={ClipboardList} title="Serviços" subtitle="Gerencie ordens de serviço, status e responsáveis" actionLabel="Novo Serviço" onAction={() => { setEditing(null); setOpen(true); }}>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Abertos" value={String(records.length)} icon={PlayCircle} tone="blue" />
        <MetricCard title="Em execução" value="0" icon={Wrench} tone="amber" />
        <MetricCard title="Atrasados" value="0" icon={Clock} tone="red" />
      </div>
      <FilterBar searchPlaceholder="Buscar serviço, cliente ou técnico..."><StatusSelect /></FilterBar>
      <Card className="overflow-visible">
        <Table>
          <TableHeader><TableRow>{["OS", "Cliente", "Serviço", "Técnico", "Status", "Prazo", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {records.length ? records.map((service, index) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">OS-{String(index + 1).padStart(4, "0")}</TableCell>
                <TableCell>{service.cliente}</TableCell>
                <TableCell>{service.tipo}</TableCell>
                <TableCell>{service.tecnico}</TableCell>
                <TableCell><StatusBadge status={service.status} /></TableCell>
                <TableCell>{formatDate(service.prazo)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações do serviço"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { setEditing(service); setOpen(true); }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => setDeleting(service)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} className="p-0"><EmptyState title="Nenhuma ordem de serviço encontrada." description="Crie ordens de serviço para organizar a operação." actionLabel="Novo Serviço" onAction={() => { setEditing(null); setOpen(true); }} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <ServiceDialog open={open} onOpenChange={setOpen} record={editing} onSave={handleSave} />
      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeleting(null)} />
          <DialogHeader>
            <DialogTitle>Excluir Serviço</DialogTitle>
            <DialogDescription>Confirma a exclusão do serviço <strong>OS-{deleting ? String(records.findIndex((r) => r.id === deleting.id) + 1).padStart(4, "0") : ""}</strong>? Esta ação não pode ser desfeita.</DialogDescription>
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

function formatDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "-";
}
