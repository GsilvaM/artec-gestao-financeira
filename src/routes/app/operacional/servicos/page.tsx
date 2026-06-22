import { useState } from "react";
import { ClipboardList, Clock, MoreHorizontal, Pencil, PlayCircle, Trash2, Wrench } from "lucide-react";
import { ServiceDialog, type ServiceForm } from "@/components/forms/service-dialog";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge, StatusSelect } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Service = ServiceForm & { id: string; status: "rascunho" };

export function Component() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  return (
    <PageShell icon={ClipboardList} title="Serviços" subtitle="Gerencie ordens de serviço, status e responsáveis" actionLabel="Novo Serviço" onAction={() => setOpen(true)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Abertos" value={String(services.length)} icon={PlayCircle} tone="blue" />
        <MetricCard title="Em execução" value="0" icon={Wrench} tone="amber" />
        <MetricCard title="Atrasados" value="0" icon={Clock} tone="red" />
      </div>
      <FilterBar searchPlaceholder="Buscar serviço, cliente ou técnico..."><StatusSelect /></FilterBar>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["OS", "Cliente", "Serviço", "Técnico", "Status", "Prazo", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {services.length ? services.map((service, index) => (
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
                      <DropdownMenuItem onClick={() => {}}><Pencil className="size-4" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => {}}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} className="p-0"><EmptyState title="Nenhuma ordem de serviço encontrada." description="Crie ordens de serviço para organizar a operação." actionLabel="Novo Serviço" onAction={() => setOpen(true)} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <ServiceDialog open={open} onOpenChange={setOpen} onCreate={(service) => setServices((current) => [service, ...current])} />
    </PageShell>
  );
}

function formatDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "-";
}
