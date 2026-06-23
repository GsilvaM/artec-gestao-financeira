import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormField as Field } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nome: z.string().min(2, "Informe um nome"),
  referencia: z.string().optional(),
  status: z.enum(["ativo", "rascunho"]),
  observacoes: z.string().optional(),
});

const initialForm = { nome: "", referencia: "", status: "ativo", observacoes: "" };

interface SimpleRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  successMessage: string;
}

export function SimpleRecordDialog({ open, onOpenChange, title, description, successMessage }: SimpleRecordDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSave() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error("Revise os campos do formulário");
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setSaving(false);
    setForm(initialForm);
    onOpenChange(false);
    toast.success(successMessage);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative">
        <DialogCloseButton onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" error={errors.nome}><Input value={form.nome} onChange={(e) => updateField("nome", e.target.value)} placeholder="Nome do registro" /></Field>
          <Field label="Referência"><Input value={form.referencia} onChange={(e) => updateField("referencia", e.target.value)} placeholder="Código, contato ou categoria" /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => updateField("status", e.target.value)} options={[{ value: "ativo", label: "Ativo" }, { value: "rascunho", label: "Rascunho" }]} /></Field>
          <div className="sm:col-span-2"><Field label="Observações"><Textarea value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Notas iniciais" /></Field></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
