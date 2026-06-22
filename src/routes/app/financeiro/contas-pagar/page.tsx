import { useState } from "react";
import { AlertTriangle, CalendarClock, CreditCard, WalletCards } from "lucide-react";
import { SimpleRecordDialog } from "@/components/forms/simple-record-dialog";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StarterPage icon={CreditCard} title="Contas a Pagar" subtitle="Acompanhe obrigações, vencimentos e pagamentos" actionLabel="Nova Conta" onAction={() => setOpen(true)} metrics={[{ title: "Em aberto", value: "R$ 0,00", icon: WalletCards, tone: "blue" }, { title: "Vence hoje", value: "0", icon: CalendarClock, tone: "amber" }, { title: "Vencidas", value: "0", icon: AlertTriangle, tone: "red" }]} columns={["Vencimento", "Fornecedor", "Categoria", "Valor", "Status", "Ações"]} emptyTitle="Nenhuma conta a pagar encontrada." emptyDescription="Cadastre suas obrigações para controlar o fluxo de saída." />
      <SimpleRecordDialog open={open} onOpenChange={setOpen} title="Nova Conta a Pagar" description="Crie um registro inicial para futura integração financeira." successMessage="Conta a pagar registrada" />
    </>
  );
}
