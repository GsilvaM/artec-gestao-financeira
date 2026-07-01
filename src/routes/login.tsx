import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, LockKeyhole, Moon, Send, Sun } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { toast } from "sonner";
import { Button, IconButton } from "@/components/ui/button";
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
      toast.error(payload?.error ?? "Não foi possível enviar a solicitação.");
      return;
    }
    toast.success(payload?.message ?? "Solicitação enviada. Aguarde aprovação.");
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <IconButton onClick={toggleTheme} className="login-theme-btn" aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}>
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </IconButton>

      <Card className="login-card">
        <CardHeader className="items-center text-center">
          <div className="login-icon">
            <AppLogo compact markClassName="size-11" />
          </div>
          <h1 className="login-title">Artec Gestão</h1>
          <CardDescription>
            {mode === "login" ? "Entre com sua conta aprovada para acessar o painel." : "Solicite acesso. A entrada depende da aprovação de um administrador."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-field">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="form-field">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
              </div>
              <Button type="submit" size="lg" loading={submitting} className="w-full">
                {!submitting && <LockKeyhole className="size-4" />}
                {submitting ? "Entrando..." : "Entrar"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("request")}>
                Solicitar acesso
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAccessRequest} className="login-form">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-field sm:col-span-2">
                  <Label htmlFor="request-name">Nome completo</Label>
                  <Input id="request-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="form-field sm:col-span-2">
                  <Label htmlFor="request-email">Email</Label>
                  <Input id="request-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="form-field sm:col-span-2">
                  <Label htmlFor="request-phone">Telefone</Label>
                  <Input id="request-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="form-field">
                  <Label htmlFor="request-password">Senha</Label>
                  <Input id="request-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                </div>
                <div className="form-field">
                  <Label htmlFor="request-confirm-password">Confirmar senha</Label>
                  <Input id="request-confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
                </div>
                <div className="form-field sm:col-span-2">
                  <Label htmlFor="request-message">Observação</Label>
                  <Textarea id="request-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Explique brevemente por que precisa acessar o sistema." />
                </div>
              </div>
              <Button type="submit" size="lg" loading={submitting} className="w-full">
                {!submitting && <Send className="size-4" />}
                {submitting ? "Enviando..." : "Enviar solicitação"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
                <ArrowLeft className="size-4" />
                Voltar para login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      <style>{loginStyles}</style>
    </div>
  );
}

const loginStyles = `
.login-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 40px 16px;
  background: var(--background);
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), transparent 44%),
    var(--surface-2);
}

.dark .login-bg {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), transparent 42%),
    var(--background);
}

.login-theme-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--foreground);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background-color 180ms ease, transform 180ms ease;
}

.login-theme-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.login-theme-btn:hover {
  background: var(--surface-2);
  transform: translateY(-1px);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: var(--radius-xl);
  border-color: var(--border-subtle);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.login-icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xl);
  background: var(--primary);
  color: var(--primary-foreground);
  --logo-accent: var(--primary-soft);
  margin: 0 auto 14px;
  box-shadow: var(--shadow-md);
}

.login-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.2;
  letter-spacing: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
`;
