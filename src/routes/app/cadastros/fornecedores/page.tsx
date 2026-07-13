import { useMemo, useState } from "react";
import { Factory, MoreHorizontal, Pencil, Trash2, Truck, UserRoundPlus } from "lucide-react";
import { ClientDialog, type ClientRecord } from "@/components/forms/client-dialog";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState, FilterBar, MetricCard, PageShell, StatusBadge } from "@/components/layout/page-shell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Component() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [deleting, setDeleting] = useState<ClientRecord | null>(null);
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((supplier) => {
      const matchesStatus = statusFilter ? supplier.status === statusFilter : true;
      const matchesSearch = term
        ? [supplier.nome, supplier.documento, supplier.telefone, supplier.email, supplier.observacoes]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [records, search, statusFilter]);

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

      <FilterBar
        searchPlaceholder="Buscar fornecedor..."
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
                aria-label="Filtrar fornecedores por status"
                options={[{ value: "ativo", label: "Ativos" }]}
              />
            ),
          },
        ]}
      />

      {records.length ? (
        <>
          <div className="desktop-table">
            <div className="table-card" style={{ padding: 0 }}>
              <Table>
                <TableHeader><TableRow>{["Nome/razao social", "Documento", "Contato", "Status", "Acoes"].map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {filteredRecords.length ? filteredRecords.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.nome}</TableCell>
                      <TableCell>{supplier.documento}</TableCell>
                      <TableCell><div>{supplier.telefone}</div><div className="text-xs text-muted-foreground">{supplier.email}</div></TableCell>
                      <TableCell><StatusBadge status={supplier.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Acoes"><MoreHorizontal className="size-4" /></Button>
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
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <EmptyState title="Nenhum fornecedor encontrado." description="Ajuste a busca ou remova filtros para ver mais fornecedores." />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mobile-list">
            {filteredRecords.length ? (
              <div className="space-y-3">
                {filteredRecords.map((supplier) => (
                  <article key={supplier.id} className="category-card">
                    <div className="category-main">
                      <div>
                        <h3>{supplier.nome}</h3>
                        <p>{supplier.documento}</p>
                        {supplier.telefone && <p className="text-text-muted mt-1 text-xs">{supplier.telefone}</p>}
                      </div>
                    </div>
                    <div className="category-actions flex items-center gap-2">
                      <StatusBadge status={supplier.status} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Acoes">
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
            ) : (
              <EmptyState title="Nenhum fornecedor encontrado." description="Ajuste a busca ou remova filtros para ver mais fornecedores." />
            )}
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
            <DialogDescription>Confirma a exclusao de <strong>{deleting?.nome}</strong>? Esta acao nao pode ser desfeita.</DialogDescription>
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
