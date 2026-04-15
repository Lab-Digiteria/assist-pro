/**
 * Login.tsx — Tela de login por e-mail e senha do Assist-Pró.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);

  const login = trpc.lead.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      window.location.href = "/dashboard";
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    login.mutate(form);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#C4733A" }}>
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: "#1B4F8A" }}>Assist-Pró</span>
        </Link>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold" style={{ color: "#1B4F8A" }}>
              Entrar no Assist-Pró
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse sua conta de gestão de assistência técnica
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-semibold"
                style={{ background: "#1B4F8A" }}
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/#cadastro" className="font-semibold hover:underline" style={{ color: "#C4733A" }}>
                Comece seu trial grátis
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
