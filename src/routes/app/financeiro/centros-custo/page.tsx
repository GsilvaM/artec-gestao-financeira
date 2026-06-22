import { useState } from "react";
import { Building, Network } from "lucide-react";
import { SimpleRecordDialog } from "@/components/forms/simple-record-dialog";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StarterPage icon={Network} title="Centros de Custo" subtitle="Agrupe receitas e despesas por unidade de operação" actionLabel="Novo Centro" onAction={() => setOpen(true)} metrics={[{ title: "Centros ativos", value: "0", icon: Building, tone: "blue" }]} columns={["Código", "Nome", "Responsável", "Status", "Ações"]} emptyTitle="Nenhum centro de custo encontrado." emptyDescription="Cadastre centros para acompanhar rentabilidade e desempenho." />
      <SimpleRecordDialog open={open} onOpenChange={setOpen} title="Novo Centro de Custo" description="Crie um centro inicial para organizar relatórios e rentabilidade." successMessage="Centro de custo registrado" />
    </>
  );
}
