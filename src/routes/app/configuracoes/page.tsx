import { useState } from "react";
import { toast } from "sonner";
import { Bell, Building2, CreditCard, Loader2, Palette, Settings, UserCog } from "lucide-react";
import { FormField as Field } from "@/components/forms/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/layout/page-shell";

const settings = [
  { icon: Building2, title: "Empresa", description: "Dados comerciais, CNPJ, endereço e contatos" },
  { icon: UserCog, title: "Usuário", description: "Perfil, preferências de sessão e identificação" },
  { icon: Palette, title: "Preferências", description: "Tema visual, idioma e formato de exibição" },
  { icon: Bell, title: "Notificações", description: "Alertas de vencimentos, contas e relatórios" },
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
          <Card key={item.title} className="group overflow-hidden border-primary/10 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_4%,var(--surface))_0%,var(--surface)_42%)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/10 text-primary shadow-[inset_0_1px_0_color-mix(in_srgb,var(--primary)_12%,transparent)]">
                <item.icon className="size-5" />
              </div>
              <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setActive(item)}>Configurar</Button>
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
            <Field label="Nome/identificação"><Input placeholder={active?.title === "Empresa" ? "Artec Climatizados" : active?.title} /></Field>
            <Field label="Status"><Select options={[{ value: "ativo", label: "Ativo" }, { value: "rascunho", label: "Rascunho" }]} placeholder="Selecione" /></Field>
            <Field label="E-mail de referência"><Input type="email" placeholder="contato@empresa.com" /></Field>
            <Field label="Telefone"><Input placeholder="(00) 00000-0000" /></Field>
            <div className="sm:col-span-2"><Field label="Observações"><Textarea placeholder="Notas internas para esta configuração" /></Field></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar configuração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
