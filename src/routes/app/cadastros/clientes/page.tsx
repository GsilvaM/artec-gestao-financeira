import { useMemo, useState } from "react";
import { Building2, MoreHorizontal, Pencil, Plus, Trash2, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { ClientDialog, type ClientRecord } from "@/components/forms/client-dialog";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, MetricCard, StatusBadge, FilterBar, EmptyState, pageHeaderStyles } from "@/components/layout/page-shell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateCustomer, useCustomers, useDeleteCustomer, useUpdateCustomer } from "@/domain/financeiro/hooks/use-customers";
import type { CustomerRow } from "@/domain/financeiro/types";

function toClientRecord(customer: CustomerRow): ClientRecord {
  return {
    id: customer.id,
    nome: customer.name,
    telefone: customer.phone ?? "",
    email: customer.email ?? "",
    documento: customer.document ?? "",
    observacoes: customer.address ?? customer.notes ?? "",
    status: customer.active ? "ativo" : "ativo",
  };
}

export function Component() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [deleting, setDeleting] = useState<ClientRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const customersQuery = useCustomers({ search: search.trim() || undefined, includeInactive: statusFilter !== "ativo" ? undefined : false });
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const records = useMemo(() => (customersQuery.data ?? []).map(toClientRecord), [customersQuery.data]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((client) => {
      const matchesStatus = statusFilter ? client.status === statusFilter : true;
      const matchesSearch = term
        ? [client.nome, client.documento, client.telefone, client.email, client.observacoes]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [records, search, statusFilter]);

  function handleSave(data: ClientRecord) {
    const payload = {
      name: data.nome,
      phone: data.telefone || null,
      email: data.email || null,
      document: data.documento || null,
      address: data.observacoes || null,
      active: true,
    };
    const action = editing
      ? updateCustomer.mutateAsync({ id: data.id, data: payload })
      : createCustomer.mutateAsync(payload);
    void action
      .then(() => {
        toast.success(editing ? "Cliente atualizado." : "Cliente cadastrado.");
        setOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao salvar cliente."));
  }

  function confirmDelete() {
    if (!deleting) return;
    void deleteCustomer.mutateAsync(deleting.id)
      .then(() => {
        toast.success("Cliente excluido.");
        setDeleting(null);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao excluir cliente."));
  }

  const metrics = [
    { title: "Clientes ativos", value: String(records.length), icon: UserRoundPlus, tone: "blue" as const },
    { title: "Empresas", value: String(records.filter((r) => r.documento.length > 11).length), icon: Building2, tone: "slate" as const },
  ];

  return (
    <>
      <style>{pageHeaderStyles}</style>
      <style>{clientStyles}</style>
      <div className="page-stack">
        <PageHeader
          title="Clientes"
          description="Cadastre, edite e acompanhe seus clientes em um so lugar."
          actions={
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="size-4" />
              Novo cliente
            </Button>
          }
        />

        <div className="metrics-grid">
          {metrics.map((m) => (
            <MetricCard key={m.title} {...m} />
          ))}
        </div>

        <FilterBar
          searchPlaceholder="Buscar por nome, documento, telefone ou e-mail..."
          search={search}
          onSearchChange={setSearch}
          activeFilters={statusFilter ? [{ key: "status", label: "Ativo", onRemove: () => setStatusFilter("") }] : []}
          filters={[
            {
              key: "status",
              label: "Status",
              primary: true,
              control: (
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  placeholder="Todos os status"
                  aria-label="Filtrar clientes por status"
                  options={[{ value: "ativo", label: "Ativos" }]}
                />
              ),
            },
          ]}
        />

        <Card className="overflow-hidden">
          <div className="desktop-table">
            <div className="table-scroll">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    {["Nome/razao social", "Documento", "Contato", "Cidade", "Status", "Acoes"].map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length ? filteredRecords.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nome}</TableCell>
                      <TableCell>{client.documento}</TableCell>
                      <TableCell><div>{client.telefone}</div><div className="text-xs text-text-secondary">{client.email}</div></TableCell>
                      <TableCell>{client.observacoes || "-"}</TableCell>
                      <TableCell><StatusBadge status={client.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Acoes"><MoreHorizontal className="size-4" /></Button>
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
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <EmptyState
                          title={records.length ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
                          description={records.length ? "Ajuste a busca ou remova filtros para ver mais clientes." : "Adicione seu primeiro cliente para comecar a vincular lancamentos, contas e relatorios."}
                          action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" />Cadastrar cliente</Button>}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <ClientMobileList
            records={records}
            clients={filteredRecords}
            onEdit={(client) => { setEditing(client); setOpen(true); }}
            onDelete={setDeleting}
            onNew={() => { setEditing(null); setOpen(true); }}
          />
        </Card>
      </div>

      <ClientDialog open={open} onOpenChange={setOpen} record={editing} onSave={handleSave} />
      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeleting(null)} />
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>Confirma a exclusao de <strong>{deleting?.nome}</strong>? Esta acao nao pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClientMobileList({
  records,
  clients,
  onEdit,
  onDelete,
  onNew,
}: {
  records: ClientRecord[];
  clients: ClientRecord[];
  onEdit: (client: ClientRecord) => void;
  onDelete: (client: ClientRecord) => void;
  onNew: () => void;
}) {
  return (
    <div className="mobile-list">
      {clients.length ? (
        clients.map((client) => (
          <article key={client.id} className="mobile-record-card cadastro-mobile-card">
            <div className="mobile-record-top">
              <div className="cadastro-mobile-copy min-w-0">
                <h3 className="mobile-record-title">{client.nome}</h3>
                <span className="mobile-record-label">{client.documento}</span>
                <p className="cadastro-mobile-detail">{client.telefone || client.email || "Contato nao informado"}</p>
                {client.email && client.telefone ? <p className="cadastro-mobile-detail">{client.email}</p> : null}
              </div>
              <StatusBadge status={client.status} />
            </div>
            <div className="mobile-record-bottom">
              <span className="cadastro-mobile-detail">{client.observacoes || "Sem cidade/observacao"}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Acoes do cliente">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(client)}><Pencil className="size-4" />Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onClick={() => onDelete(client)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </article>
        ))
      ) : (
        <EmptyState
          title={records.length ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          description={records.length ? "Ajuste a busca ou remova filtros para ver mais clientes." : "Adicione seu primeiro cliente para comecar a vincular lancamentos, contas e relatorios."}
          action={<Button onClick={onNew}><Plus className="size-4" />Cadastrar cliente</Button>}
        />
      )}
    </div>
  );
}

const clientStyles = `
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1023px) {
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 639px) {
  .metrics-grid { grid-template-columns: 1fr; }
}
`;
