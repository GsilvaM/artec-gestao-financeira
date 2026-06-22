import { useState } from "react";
import { FolderTree, Tags } from "lucide-react";
import { SimpleRecordDialog } from "@/components/forms/simple-record-dialog";
import { StarterPage } from "@/components/layout/page-shell";

export function Component() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StarterPage icon={Tags} title="Categorias" subtitle="Organize receitas, custos e despesas por classificação" actionLabel="Nova Categoria" onAction={() => setOpen(true)} metrics={[{ title: "Categorias ativas", value: "0", icon: FolderTree, tone: "blue" }]} columns={["Nome", "Tipo", "Cor", "Status", "Ações"]} emptyTitle="Nenhuma categoria encontrada." emptyDescription="Crie categorias para melhorar relatórios, DRE e filtros financeiros." />
      <SimpleRecordDialog open={open} onOpenChange={setOpen} title="Nova Categoria" description="Crie uma categoria inicial para organizar lançamentos." successMessage="Categoria registrada" />
    </>
  );
}
