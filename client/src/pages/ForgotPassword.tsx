/**
 * ForgotPassword.tsx — Solicitação de redefinição de senha.
 * Design premium alinhado com Login.tsx.
 */
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Mail, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";

function GridDecor() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="fp-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#fp-grid)" />
    </svg>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const request = trpc.lead.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Informe seu e-mail"); return; }
    request.mutate({ email, origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-[#0d1e35] flex items-center justify-center px-6 py-12 relative">
      <GridDecor />

      {/* Linha diagonal decorativa */}
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

        {!sent ? (
          <>
            {/* Cabeçalho */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Esqueceu sua senha?</h2>
              <p className="text-sm text-white/40 font-mono leading-relaxed">
                Informe o e-mail cadastrado e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="
                      bg-[#0A1628] border-[#1B6FD8]/25 text-white placeholder:text-white/20
                      focus:border-[#1B6FD8] focus:ring-1 focus:ring-[#1B6FD8]/30
                      rounded-none h-11 font-mono text-sm pl-10
                      transition-all duration-200
                    "
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={request.isPending}
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
                {request.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Enviando...</span></>
                ) : (
                  <><Mail className="w-4 h-4" /><span>Enviar link de redefinição</span></>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Estado de sucesso */
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 border border-[#1B6FD8]/30 bg-[#1B6FD8]/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#1B6FD8]" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">E-mail enviado!</h2>
              <p className="text-sm text-white/40 font-mono leading-relaxed">
                Se o e-mail <strong className="text-white/60">{email}</strong> estiver cadastrado, você receberá as instruções em breve.
              </p>
              <p className="text-xs text-white/25 font-mono">
                O link expira em 1 hora. Verifique também a caixa de spam.
              </p>
            </div>
          </div>
        )}

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#1B6FD8]/10" />
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">ou</span>
          <div className="flex-1 h-px bg-[#1B6FD8]/10" />
        </div>

        {/* Voltar ao login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/40 hover:text-white/70 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar ao login</span>
          </Link>
        </div>

        {/* Segurança */}
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-3 h-3 text-white/15" />
          <span className="text-[10px] font-mono text-white/15 uppercase tracking-widest">
            Conexão segura · Dados criptografados
          </span>
        </div>
      </div>
    </div>
  );
}
