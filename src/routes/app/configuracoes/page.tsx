import { useState } from "react";
import { toast } from "sonner";
import { Bell, Building2, CreditCard, Palette, Settings, UserCog } from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/layout/page-shell";

const settings = [
  { icon: Building2, title: "Empresa", description: "Dados comerciais, CNPJ, endereco e contatos" },
  { icon: UserCog, title: "Usuario", description: "Perfil, preferencias de sessao e identificacao" },
  { icon: Palette, title: "Preferencias", description: "Tema visual, idioma e formato de exibicao" },
  { icon: Bell, title: "Notificacoes", description: "Alertas de vencimentos, contas e relatorios" },
  { icon: CreditCard, title: "Financeiro", description: "Parametros financeiros, centros e categorias padrao" },
];

export function Component() {
  const [active, setActive] = useState<(typeof settings)[number] | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setSaving(false);
    setActive(null);
    toast.success("Configuracao salva");
  }

  return (
    <PageShell icon={Settings} title="Configuracoes" subtitle="Ajustes gerais e preferencias do sistema">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => (
          <Card key={item.title} className="group transition-colors hover:border-[#BBD7EF]">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex size-11 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#174E8C]">
                <item.icon className="size-5" />
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-[#64748B]">{item.description}</p>
              <Button variant="outline" size="sm" onClick={() => setActive(item)}>Configurar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="relative">
          <DialogCloseButton onClick={() => setActive(null)} />
          <DialogHeader>
            <DialogTitle>Configurar {active?.title}</DialogTitle>
            <DialogDescription>{active?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome/Identificacao"><Input placeholder={active?.title === "Empresa" ? "Artec Climatizados" : active?.title} /></Field>
            <Field label="Status"><Select options={[{ value: "ativo", label: "Ativo" }, { value: "rascunho", label: "Rascunho" }]} placeholder="Selecione" /></Field>
            <Field label="E-mail de referencia"><Input type="email" placeholder="contato@empresa.com" /></Field>
            <Field label="Telefone"><Input placeholder="(00) 00000-0000" /></Field>
            <div className="sm:col-span-2"><Field label="Observacoes"><Textarea placeholder="Notas internas para esta configuracao" /></Field></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Configuracao"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
