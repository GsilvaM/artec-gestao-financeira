import { useState } from "react";
import { HardHat, UserCheck } from "lucide-react";
import { SimpleRecordDialog } from "@/components/forms/simple-record-dialog";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StarterPage icon={HardHat} title="Técnicos" subtitle="Controle técnicos, disponibilidade e vínculo com serviços" actionLabel="Novo Técnico" onAction={() => setOpen(true)} metrics={[{ title: "Técnicos ativos", value: "0", icon: UserCheck, tone: "blue" }]} columns={["Nome", "Especialidade", "Telefone", "Status", "Ações"]} emptyTitle="Nenhum técnico encontrado." emptyDescription="Cadastre técnicos para atribuir ordens de serviço." />
      <SimpleRecordDialog open={open} onOpenChange={setOpen} title="Novo Técnico" description="Crie um cadastro inicial de técnico para futura integração operacional." successMessage="Técnico registrado" />
    </>
  );
}
