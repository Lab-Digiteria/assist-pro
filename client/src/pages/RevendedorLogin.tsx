import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function RevendedorLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = trpc.revendedores.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      navigate("/revendedor/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse, #2563EB 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1B4F8A, #2563EB)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white">Assist-Pró</span>
          </a>
          <h1 className="text-2xl font-bold text-white mb-2">Portal do Revendedor</h1>
          <p className="text-gray-400 text-sm">Acesse seu painel de comissões e indicações</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border" style={{ background: "#141414", borderColor: "rgba(255,255,255,0.08)" }}>
          <form onSubmit={(e) => { e.preventDefault(); login.mutate({ email, password }); }} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-bold h-11"
              style={{ background: "linear-gradient(135deg, #1B4F8A, #2563EB)" }}
              disabled={login.isPending}
            >
              {login.isPending ? "Entrando..." : "Entrar no painel"}
            </Button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            Ainda não é revendedor?{" "}
            <a href="/#revendedores" className="text-blue-400 hover:text-blue-300">
              Cadastre seu interesse
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
