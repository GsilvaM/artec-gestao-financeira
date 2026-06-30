import { useState } from "react";
import { Building2, MoreHorizontal, Pencil, Plus, Trash2, UserRoundPlus } from "lucide-react";
import { ClientDialog, type ClientRecord } from "@/components/forms/client-dialog";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, MetricCard, StatusBadge, FilterBar, StatusSelect, EmptyState, pageHeaderStyles } from "@/components/layout/page-shell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


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
          description="Cadastre, edite e acompanhe seus clientes em um só lugar."
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

        <FilterBar searchPlaceholder="Buscar por nome, documento, telefone ou e-mail...">
          <StatusSelect />
        </FilterBar>

        <Card className="table-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {["Nome/razão social", "Documento", "Contato", "Cidade", "Status", "Ações"].map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length ? records.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium">{client.nome}</td>
                    <td>{client.documento}</td>
                    <td><div>{client.telefone}</div><div className="text-xs text-text-secondary">{client.email}</div></td>
                    <td>{client.observacoes || "-"}</td>
                    <td><StatusBadge status={client.status} /></td>
                    <td>
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
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        title="Nenhum cliente cadastrado ainda."
                        description="Adicione seu primeiro cliente para começar a vincular lançamentos, contas e relatórios."
                        action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" />Cadastrar cliente</Button>}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ClientDialog open={open} onOpenChange={setOpen} record={editing} onSave={handleSave} />
      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeleting(null)} />
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>Confirma a exclusão de <strong>{deleting?.nome}</strong>? Esta ação não pode ser desfeita.</DialogDescription>
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

.filter-bar {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-bar input { flex: 1; }

@media (max-width: 1023px) {
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-bar { flex-direction: column; align-items: stretch; }
}

@media (max-width: 639px) {
  .metrics-grid { grid-template-columns: 1fr; }
}

.table-card {
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.data-table thead th {
  padding: 13px 16px;
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

.data-table thead th:first-child {
  border-top-left-radius: 12px;
}

.data-table thead th:last-child {
  border-top-right-radius: 12px;
}

.data-table tbody td {
  padding: 15px 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.data-table tbody tr {
  transition: background-color 160ms ease;
}

.data-table tbody tr:hover {
  background: var(--color-surface-muted);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}
`;
