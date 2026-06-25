import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, LockKeyhole, Moon, Send, ShieldCheck, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { useThemeStore } from "@/stores/theme";

type Mode = "login" | "request";

export function Component() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) toast.error(error);
    else navigate("/app");
  }

  async function handleAccessRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const response = await fetch("/api/admin/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        message: message.trim(),
      }),
    });
    const payload = await response.json().catch(() => null);
    setSubmitting(false);
    if (!response.ok) {
      toast.error(payload?.error ?? "Nao foi possivel enviar a solicitacao.");
      return;
    }
    toast.success(payload?.message ?? "Solicitacao enviada. Aguarde aprovacao.");
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="absolute inset-x-0 top-0 h-[42vh] bg-[#003A70] dark:bg-[#061A31]" />
      <div className="absolute inset-x-0 top-0 h-[42vh] bg-[linear-gradient(135deg,rgba(30,136,229,0.78),rgba(245,53,53,0.62)_58%,rgba(6,182,212,0.46))]" />
      <button type="button" onClick={toggleTheme} className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-lg border border-white/20 bg-white/12 text-white shadow-sm backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40" aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}>
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

      <Card className="relative w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-[linear-gradient(90deg,#005AA8,#1E88E5,#06B6D4,#F53535)]" />
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-2xl font-bold leading-none text-foreground">Artec Gestão</h1>
          <CardDescription>
            {mode === "login" ? "Entre com sua conta aprovada para acessar o painel." : "Solicite acesso. A entrada depende da aprovacao de um administrador."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                <LockKeyhole className="size-4" />
                {submitting ? "Entrando..." : "Entrar"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("request")}>
                Solicitar acesso
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAccessRequest} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="request-name">Nome completo</Label>
                  <Input id="request-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="request-email">Email</Label>
                  <Input id="request-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="request-phone">Telefone</Label>
                  <Input id="request-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-password">Senha</Label>
                  <Input id="request-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 8 caracteres" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-confirm-password">Confirmar senha</Label>
                  <Input id="request-confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="request-message">Observacao</Label>
                  <Textarea id="request-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Explique brevemente por que precisa acessar o sistema." />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                <Send className="size-4" />
                {submitting ? "Enviando..." : "Enviar solicitacao"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
                <ArrowLeft className="size-4" />
                Voltar para login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
