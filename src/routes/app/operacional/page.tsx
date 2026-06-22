import { ClipboardList, HardHat, Timer, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const navigate = useNavigate();
  return (
    <StarterPage
      icon={ClipboardList}
      title="Operacional"
      subtitle="Acompanhe serviços, equipes, produtividade e execução"
      actionLabel="Novo Serviço"
      onAction={() => navigate("/app/operacional/servicos")}
      metrics={[
        { title: "Serviços ativos", value: "0", icon: ClipboardList, tone: "blue" },
        { title: "Técnicos", value: "0", icon: HardHat, tone: "amber" },
        { title: "Colaboradores", value: "0", icon: Users, tone: "slate" },
        { title: "Pendências", value: "0", icon: Timer, tone: "red" },
      ]}
      columns={["OS", "Cliente", "Técnico", "Status", "Prazo", "Ações"]}
      emptyTitle="Nenhum serviço operacional encontrado."
      emptyDescription="Cadastre serviços para acompanhar a operação em tempo real."
    />
  );
}
