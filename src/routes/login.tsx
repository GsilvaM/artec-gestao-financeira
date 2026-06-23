import { useState } from "react";
import { useNavigate } from "react-router";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export function Component() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      navigate("/app");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-64 bg-[#2F73B8]" />
      <Card className="relative w-full max-w-md overflow-hidden shadow-xl">
        <div className="h-2 bg-[#2F73B8]" />
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#174E8C]">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold leading-none">Artec Gestão</h1>
          <CardDescription>Entre com sua conta para acessar o painel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
