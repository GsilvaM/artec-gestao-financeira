import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { SimpleRecordDialog } from "@/components/forms/simple-record-dialog";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StarterPage icon={Users} title="Colaboradores" subtitle="Gerencie equipe interna, funções e status operacional" actionLabel="Novo Colaborador" onAction={() => setOpen(true)} metrics={[{ title: "Colaboradores ativos", value: "0", icon: UserPlus, tone: "blue" }]} columns={["Nome", "Cargo", "Departamento", "Status", "Ações"]} emptyTitle="Nenhum colaborador encontrado." emptyDescription="Cadastre colaboradores para organizar responsabilidades internas." />
      <SimpleRecordDialog open={open} onOpenChange={setOpen} title="Novo Colaborador" description="Crie um cadastro inicial para a equipe interna." successMessage="Colaborador registrado" />
    </>
  );
}
