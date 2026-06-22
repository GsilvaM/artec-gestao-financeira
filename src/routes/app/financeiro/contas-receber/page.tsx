import { useState } from "react";
import { Banknote, CalendarCheck, CircleDollarSign, Clock } from "lucide-react";
import { SimpleRecordDialog } from "@/components/forms/simple-record-dialog";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StarterPage icon={CircleDollarSign} title="Contas a Receber" subtitle="Controle recebíveis, clientes e previsões de entrada" actionLabel="Nova Conta" onAction={() => setOpen(true)} metrics={[{ title: "A receber", value: "R$ 0,00", icon: Banknote, tone: "green" }, { title: "Recebidas", value: "0", icon: CalendarCheck, tone: "blue" }, { title: "Pendentes", value: "0", icon: Clock, tone: "amber" }]} columns={["Vencimento", "Cliente", "Categoria", "Valor", "Status", "Ações"]} emptyTitle="Nenhuma conta a receber encontrada." emptyDescription="Cadastre receitas previstas para acompanhar entradas futuras." />
      <SimpleRecordDialog open={open} onOpenChange={setOpen} title="Nova Conta a Receber" description="Crie um registro inicial para futura integração financeira." successMessage="Conta a receber registrada" />
    </>
  );
}
