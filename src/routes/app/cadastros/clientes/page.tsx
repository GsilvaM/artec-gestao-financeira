import { useState } from "react";
import { Building2, MoreHorizontal, UserRoundPlus, Users } from "lucide-react";
import { ClientDialog, type ClientForm } from "@/components/forms/client-dialog";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge, StatusSelect } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Client = ClientForm & { id: string; status: "ativo" };

export function Component() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  return (
    <PageShell icon={Users} title="Clientes" subtitle="Cadastre clientes para lançamentos, serviços e relatórios" actionLabel="Novo Cliente" onAction={() => setOpen(true)}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Clientes ativos" value={String(clients.length)} icon={UserRoundPlus} tone="blue" />
        <MetricCard title="Empresas" value="0" icon={Building2} tone="slate" />
      </div>
      <FilterBar searchPlaceholder="Buscar cliente, documento ou e-mail..."><StatusSelect /></FilterBar>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader><TableRow>{["Nome/Razão Social", "Documento", "Contato", "Cidade", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {clients.length ? clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.nome}</TableCell>
                <TableCell>{client.documento}</TableCell>
                <TableCell><div>{client.telefone}</div><div className="text-xs text-[#64748B]">{client.email}</div></TableCell>
                <TableCell>{client.observacoes || "-"}</TableCell>
                <TableCell><StatusBadge status={client.status} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" aria-label="Ações do cliente"><MoreHorizontal className="size-4" /></Button></TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} className="p-0"><EmptyState title="Nenhum cliente encontrado." description="Cadastre clientes para vincular serviços, contas e lançamentos." actionLabel="Novo Cliente" onAction={() => setOpen(true)} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <ClientDialog open={open} onOpenChange={setOpen} onCreate={(client) => setClients((current) => [client, ...current])} />
    </PageShell>
  );
}
