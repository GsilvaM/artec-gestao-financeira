import { useState } from "react";
import { Activity, Shield, SlidersHorizontal, UserCog, Users } from "lucide-react";
import { SimpleRecordDialog } from "@/components/forms/simple-record-dialog";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StarterPage icon={Shield} title="Admin" subtitle="Usuários, permissões, auditoria e controles administrativos" actionLabel="Novo Usuário" onAction={() => setOpen(true)} metrics={[{ title: "Usuários", value: "0", icon: Users, tone: "blue" }, { title: "Perfis", value: "5", icon: UserCog, tone: "slate" }, { title: "Permissões", value: "0", icon: SlidersHorizontal, tone: "amber" }, { title: "Eventos", value: "0", icon: Activity, tone: "green" }]} columns={["Usuário", "Email", "Perfil", "Status", "Último acesso", "Ações"]} emptyTitle="Nenhum usuário listado." emptyDescription="Gerencie usuários e permissões quando a integração administrativa estiver disponível." />
      <SimpleRecordDialog open={open} onOpenChange={setOpen} title="Novo Usuário" description="Crie um registro inicial de usuário para a área administrativa." successMessage="Usuário registrado" />
    </>
  );
}
