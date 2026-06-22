import { useState } from "react";
import { ClipboardPlus, ListChecks } from "lucide-react";
import { ServiceDialog, type ServiceForm } from "@/components/forms/service-dialog";
import { StarterPage } from "@/components/layout/page-shell";

type Service = ServiceForm & { id: string; status: "rascunho" };

export function Component() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  return (
    <>
      <StarterPage
        icon={ClipboardPlus}
        title="Cadastro de Serviços"
        subtitle="Padronize tipos de serviço para orçamentos e execução"
        actionLabel="Novo Serviço"
        onAction={() => setOpen(true)}
        metrics={[{ title: "Tipos cadastrados", value: String(services.length), icon: ListChecks, tone: "blue" }]}
        columns={["Serviço", "Categoria", "Preço base", "Status", "Ações"]}
        emptyTitle="Nenhum serviço cadastrado."
        emptyDescription="Cadastre modelos de serviço para acelerar lançamentos operacionais."
      />
      <ServiceDialog open={open} onOpenChange={setOpen} onCreate={(service) => setServices((current) => [service, ...current])} />
    </>
  );
}
