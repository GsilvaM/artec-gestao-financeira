import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormField as Field } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const serviceSchema = z.object({
  cliente: z.string().min(2, "Informe o cliente"),
  tipo: z.string().min(2, "Informe o tipo de serviço"),
  tecnico: z.string().min(2, "Informe o técnico"),
  prazo: z.string().min(1, "Informe o prazo"),
  prioridade: z.enum(["baixa", "media", "alta"]),
  observacoes: z.string().optional(),
});

export type ServiceForm = z.infer<typeof serviceSchema>;

const initialForm: ServiceForm = {
  cliente: "", tipo: "", tecnico: "", prazo: "", prioridade: "media", observacoes: "",
};

export type ServiceRecord = ServiceForm & { id: string; status: "rascunho" };

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: ServiceRecord | null;
  onSave: (data: ServiceRecord) => void;
}

export function ServiceDialog({ open, onOpenChange, record, onSave }: ServiceDialogProps) {
  const [form, setForm] = useState<ServiceForm>(record ?? initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isEditing = !!record;

  function updateField(field: keyof ServiceForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSave() {
    const parsed = serviceSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error("Revise os campos");
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    onSave({
      id: record?.id ?? crypto.randomUUID(),
      status: "rascunho",
      ...parsed.data,
    });
    setSaving(false);
    setForm(initialForm);
    onOpenChange(false);
    toast.success(isEditing ? "Serviço atualizado" : "Serviço criado");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setForm(initialForm); setErrors({}); } onOpenChange(v); }}>
      <DialogContent className="relative">
        <DialogCloseButton onClick={() => { setForm(initialForm); setErrors({}); onOpenChange(false); }} />
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          <DialogDescription>{isEditing ? "Altere os dados do serviço." : "Crie um serviço para acompanhar cliente, técnico e prazo."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" error={errors.cliente}><Input value={form.cliente} onChange={(e) => updateField("cliente", e.target.value)} placeholder="Nome do cliente" /></Field>
          <Field label="Tipo de serviço" error={errors.tipo}><Input value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} placeholder="Instalação, manutenção..." /></Field>
          <Field label="Técnico" error={errors.tecnico}><Input value={form.tecnico} onChange={(e) => updateField("tecnico", e.target.value)} placeholder="Responsável" /></Field>
          <Field label="Prazo" error={errors.prazo}><Input type="date" value={form.prazo} onChange={(e) => updateField("prazo", e.target.value)} /></Field>
          <Field label="Prioridade" error={errors.prioridade}><Select value={form.prioridade} onChange={(e) => updateField("prioridade", e.target.value)} options={[{ value: "baixa", label: "Baixa" }, { value: "media", label: "Média" }, { value: "alta", label: "Alta" }]} /></Field>
          <Field label="Observações"><Textarea value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Detalhes do atendimento" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setForm(initialForm); setErrors({}); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
