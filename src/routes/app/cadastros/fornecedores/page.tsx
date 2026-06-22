import { useState } from "react";
import { Factory, Truck, UserRoundPlus } from "lucide-react";
import { ClientDialog, type ClientForm } from "@/components/forms/client-dialog";
import { StarterPage } from "@/components/layout/page-shell";

type Supplier = ClientForm & { id: string; status: "ativo" };

export function Component() {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  return (
    <>
      <StarterPage
        icon={Truck}
        title="Fornecedores"
        subtitle="Organize fornecedores, prestadores e parceiros financeiros"
        actionLabel="Novo Fornecedor"
        onAction={() => setOpen(true)}
        metrics={[
          { title: "Fornecedores ativos", value: String(suppliers.length), icon: Factory, tone: "blue" },
          { title: "Novos contatos", value: "0", icon: UserRoundPlus, tone: "slate" },
        ]}
        columns={["Nome/Razão Social", "Documento", "Contato", "Categoria", "Status", "Ações"]}
        emptyTitle="Nenhum fornecedor encontrado."
        emptyDescription="Cadastre fornecedores para organizar contas a pagar e compras."
      />
      <ClientDialog open={open} onOpenChange={setOpen} onCreate={(supplier) => setSuppliers((current) => [supplier, ...current])} />
    </>
  );
}
