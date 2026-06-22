import { useState } from "react";
import { toast } from "sonner";
import { Bell, Building2, CreditCard, Palette, Settings, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/layout/page-shell";

const settings = [
  { icon: Building2, title: "Empresa", description: "Dados comerciais, CNPJ, endereço e contatos" },
  { icon: UserCog, title: "Usuário", description: "Perfil, preferências de sessão e identificação" },
  { icon: Palette, title: "Preferências", description: "Tema visual, idioma e formato de exibição" },
  { icon: Bell, title: "Notificações", description: "Alertas de vencimentos, serviços e relatórios" },
  { icon: CreditCard, title: "Financeiro", description: "Parâmetros financeiros, centros e categorias padrão" },
];

export function Component() {
  const [active, setActive] = useState<(typeof settings)[number] | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setSaving(false);
    setActive(null);
    toast.success("Configuração salva");
  }

  return (
    <PageShell icon={Settings} title="Configurações" subtitle="Ajustes gerais e preferências do sistema">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => (
          <Card key={item.title} className="group transition hover:-translate-y-0.5 hover:border-[#BBD7EF] hover:shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)]">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#EAF3FB] text-[#174E8C] transition group-hover:scale-105">
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
            <Field label="Nome/Identificação"><Input placeholder={active?.title === "Empresa" ? "Artec Climatizados" : active?.title} /></Field>
            <Field label="Status"><Select options={[{ value: "ativo", label: "Ativo" }, { value: "rascunho", label: "Rascunho" }]} placeholder="Selecione" /></Field>
            <Field label="E-mail de referência"><Input type="email" placeholder="contato@empresa.com" /></Field>
            <Field label="Telefone"><Input placeholder="(00) 00000-0000" /></Field>
            <div className="sm:col-span-2"><Field label="Observações"><Textarea placeholder="Notas internas para esta configuração" /></Field></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Configuração"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
