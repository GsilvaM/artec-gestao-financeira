import { useState } from "react";
import { Factory, MoreHorizontal, Pencil, Trash2, Truck, UserRoundPlus } from "lucide-react";
import { ClientDialog, type ClientRecord } from "@/components/forms/client-dialog";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    <PageShell icon={Truck} title="Fornecedores" subtitle="Organize fornecedores, prestadores e parceiros financeiros" actionLabel="Novo fornecedor" onAction={() => { setEditing(null); setOpen(true); }}>
      <div className="stats-grid">
        <MetricCard title="Fornecedores ativos" value={String(records.length)} icon={Factory} tone="blue" />
        <MetricCard title="Novos contatos" value="0" icon={UserRoundPlus} tone="slate" />
      </div>

      <FilterBar searchPlaceholder="Buscar fornecedor..."><StatusSelect /></FilterBar>

      {records.length ? (
        <>
          <div className="desktop-table">
            <div className="table-card" style={{ padding: 0 }}>
              <Table>
                <TableHeader><TableRow>{["Nome/razão social", "Documento", "Contato", "Status", "Ações"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {records.map((supplier) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mobile-list">
            <div className="space-y-3">
              {records.map((supplier) => (
                <article key={supplier.id} className="category-card">
                  <div className="category-main">
                    <div>
                      <h3>{supplier.nome}</h3>
                      <p>{supplier.documento}</p>
                      {supplier.telefone && <p className="text-xs text-text-muted mt-1">{supplier.telefone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={supplier.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setEditing(supplier); setOpen(true); }}><Pencil className="size-4" />Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onClick={() => setDeleting(supplier)}><Trash2 className="size-4" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Truck size={24} />}
          title="Nenhum fornecedor encontrado"
          description="Cadastre fornecedores, prestadores e parceiros para organizar contas a pagar e compras."
          actionLabel="Novo fornecedor"
          onAction={() => { setEditing(null); setOpen(true); }}
        />
      )}

      <ClientDialog open={open} onOpenChange={setOpen} record={editing} onSave={handleSave} />
      <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setDeleting(null)} />
          <DialogHeader>
            <DialogTitle>Excluir fornecedor</DialogTitle>
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
