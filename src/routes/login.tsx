import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, LockKeyhole, Moon, Send, Sun } from "lucide-react";
import { ArtecLogoMark } from "@/components/brand/ArtecLogoMark";
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
      <button type="button" onClick={toggleTheme} className="login-theme-btn" aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}>
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

      <Card className="login-card">
        <CardHeader className="items-center text-center">
          <div className="login-icon">
            <ArtecLogoMark className="size-11" />
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
              <Button type="submit" disabled={submitting} className="w-full">
                <LockKeyhole className="size-4" />
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
              <Button type="submit" disabled={submitting} className="w-full">
                <Send className="size-4" />
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
  background: var(--color-background);
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(21, 94, 239, 0.15), transparent),
    var(--sidebar-start);
}

.dark .login-bg {
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59, 130, 246, 0.12), transparent),
    #06111f;
}

.login-theme-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 10;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  display: grid;
  place-items: center;
  transition: background-color 160ms ease;
}

.login-theme-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
}

.login-icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.18), transparent 32px),
    linear-gradient(135deg, #03152e 0%, #06244a 52%, #0f4fa8 100%);
  color: #ffffff;
  --logo-accent: #bfd9ff;
  margin: 0 auto 14px;
  box-shadow: 0 18px 40px rgba(6, 26, 56, 0.22);
}

.login-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
  letter-spacing: -0.035em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
`;
