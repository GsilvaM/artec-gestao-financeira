import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormField as Field } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const clientSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  telefone: z.string().min(8, "Informe um telefone válido"),
  email: z.string().email("Informe um e-mail válido"),
  documento: z.string().min(5, "Informe CPF ou CNPJ"),
  observacoes: z.string().optional(),
});

export type ClientForm = z.infer<typeof clientSchema>;

const initialForm: ClientForm = { nome: "", telefone: "", email: "", documento: "", observacoes: "" };

export type ClientRecord = ClientForm & { id: string; status: "ativo" };

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: ClientRecord | null;
  onSave: (data: ClientRecord) => void;
}

export function ClientDialog({ open, onOpenChange, record, onSave }: ClientDialogProps) {
  const [form, setForm] = useState<ClientForm>(record ?? initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isEditing = !!record;

  function updateField(field: keyof ClientForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSave() {
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error("Revise os campos");
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    onSave({
      id: record?.id ?? crypto.randomUUID(),
      status: "ativo",
      ...parsed.data,
    });
    setSaving(false);
    setForm(initialForm);
    onOpenChange(false);
    toast.success(isEditing ? "Registro atualizado" : "Registro criado");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setForm(initialForm); setErrors({}); } onOpenChange(v); }}>
      <DialogContent className="relative">
        <DialogCloseButton onClick={() => { setForm(initialForm); setErrors({}); onOpenChange(false); }} />
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Registro" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>{isEditing ? "Altere os dados do registro." : "Cadastre dados básicos para vincular serviços, contas e lançamentos."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" error={errors.nome}><Input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} placeholder="Nome ou razão social" /></Field>
          <Field label="Telefone" error={errors.telefone}><Input value={form.telefone} onChange={(e) => updateField("telefone", e.target.value)} placeholder="(00) 00000-0000" /></Field>
          <Field label="E-mail" error={errors.email}><Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="cliente@email.com" /></Field>
          <Field label="Documento" error={errors.documento}><Input value={form.documento} onChange={(e) => updateField("documento", e.target.value)} placeholder="CPF ou CNPJ" /></Field>
          <div className="sm:col-span-2"><Field label="Endereço/observações"><Textarea value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Endereço, bairro, cidade ou observações" /></Field></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setForm(initialForm); setErrors({}); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
