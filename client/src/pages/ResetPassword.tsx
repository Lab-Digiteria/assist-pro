/**
 * ResetPassword.tsx — Redefinição de senha via token.
 * Design premium alinhado com Login.tsx.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, ArrowRight, CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function GridDecor() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="rp-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rp-grid)" />
    </svg>
  );
}

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  // Extrair token da query string
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const reset = trpc.lead.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    reset.mutate({ token, newPassword: form.password });
  };

  return (
    <div className="min-h-screen bg-[#0d1e35] flex items-center justify-center px-6 py-12 relative">
      <GridDecor />

      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        {[...Array(8)].map((_, i) => (
          <line key={i} x1={`${i * 14 - 10}%`} y1="0%" x2={`${i * 14 + 40}%`} y2="100%" stroke="#1B6FD8" strokeWidth="1" />
        ))}
      </svg>

      <div className="relative z-10 w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028604039/8gQd8FyXUu5BkEGDFjJzNt/logo-assistpro-flat-G6UeJNmHvJtnXumdSpoDst.webp"
              alt="AssistPró"
              className="h-12 w-auto"
            />
            <span className="font-bold text-xl tracking-tight text-white">
              Assist<span className="text-[#1B6FD8]">Pró</span>
            </span>
          </Link>
        </div>

        {/* Token ausente */}
        {!token && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-14 h-14 border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Link inválido</h2>
              <p className="text-sm text-white/40 font-mono">
                Este link de redefinição é inválido ou expirou. Solicite um novo.
              </p>
            </div>
            <Link
              href="/esqueci-senha"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B6FD8] hover:text-[#4a9eff] transition-colors"
            >
              <span>Solicitar novo link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Formulário */}
        {token && !done && (
          <>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Nova senha</h2>
              <p className="text-sm text-white/40 font-mono leading-relaxed">
                Escolha uma senha segura com no mínimo 6 caracteres.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nova senha */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest">
                  Nova senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="
                      bg-[#0A1628] border-[#1B6FD8]/25 text-white placeholder:text-white/20
                      focus:border-[#1B6FD8] focus:ring-1 focus:ring-[#1B6FD8]/30
                      rounded-none h-11 font-mono text-sm pr-10
                      transition-all duration-200
                    "
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar senha */}
              <div className="space-y-1.5">
                <label htmlFor="confirm" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest">
                  Confirmar nova senha
                </label>
                <Input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  autoComplete="new-password"
                  required
                  className="
                    bg-[#0A1628] border-[#1B6FD8]/25 text-white placeholder:text-white/20
                    focus:border-[#1B6FD8] focus:ring-1 focus:ring-[#1B6FD8]/30
                    rounded-none h-11 font-mono text-sm
                    transition-all duration-200
                  "
                />
              </div>

              <button
                type="submit"
                disabled={reset.isPending}
                className="
                  w-full h-11 flex items-center justify-center gap-2
                  bg-[#1B6FD8] hover:bg-[#1558b0]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  text-white font-bold text-sm tracking-wide
                  rounded-none transition-all duration-200
                  relative overflow-hidden group
                "
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {reset.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Salvando...</span></>
                ) : (
                  <><span>Salvar nova senha</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </>
        )}

        {/* Sucesso */}
        {done && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 border border-[#1B6FD8]/30 bg-[#1B6FD8]/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#1B6FD8]" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Senha redefinida!</h2>
              <p className="text-sm text-white/40 font-mono leading-relaxed">
                Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B6FD8] hover:text-[#4a9eff] transition-colors"
            >
              <span>Ir para o login agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Segurança */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Shield className="w-3 h-3 text-white/15" />
          <span className="text-[10px] font-mono text-white/15 uppercase tracking-widest">
            Conexão segura · Dados criptografados
          </span>
        </div>
      </div>
    </div>
  );
}
