/**
 * Login.tsx — Tela de login premium do Assist-Pró.
 * Layout split-screen: painel esquerdo decorativo + painel direito com formulário.
 */
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, Shield, Zap, BarChart2 } from "lucide-react";
import { toast } from "sonner";

/* ─── Decoração geométrica SVG ──────────────────────────────────────────────── */
function GridDecor() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="lg-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lg-grid)" />
    </svg>
  );
}

/* ─── Linha diagonal decorativa ─────────────────────────────────────────────── */
function DiagLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1={`${i * 10 - 20}%`} y1="0%"
          x2={`${i * 10 + 30}%`} y2="100%"
          stroke="#1B6FD8"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/* ─── Cantos angulares ───────────────────────────────────────────────────────── */
function CornerAccent({ pos }: { pos: "tl" | "br" }) {
  const cls = pos === "tl"
    ? "absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#1B6FD8]/40"
    : "absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#1B6FD8]/40";
  return <div className={cls} />;
}

/* ─── Benefícios do painel esquerdo ─────────────────────────────────────────── */
const BENEFITS = [
  { icon: Zap,       text: "Ordens de serviço em tempo real" },
  { icon: BarChart2, text: "Dashboard financeiro completo" },
  { icon: Shield,    text: "Dados seguros e isolados por empresa" },
];

/* ─── Componente principal ───────────────────────────────────────────────────── */
export default function Login() {
  const [form, setForm]   = useState({ email: "", password: "" });
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
    <div className="min-h-screen flex bg-[#0A1628]">

      {/* ══ PAINEL ESQUERDO — decorativo ══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Fundos decorativos */}
        <GridDecor />
        <DiagLines />
        <CornerAccent pos="tl" />
        <CornerAccent pos="br" />

        {/* Barra lateral de cor */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#1B6FD8]/30 to-transparent" />

        {/* Logo no topo */}
        <Link href="/" className="flex items-center gap-3 w-fit relative z-10">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028604039/8gQd8FyXUu5BkEGDFjJzNt/logo-assistpro-flat-G6UeJNmHvJtnXumdSpoDst.webp"
            alt="AssistPró"
            className="h-10 w-auto"
          />
          <span className="font-bold text-lg tracking-tight text-white">
            Assist<span className="text-[#1B6FD8]">Pró</span>
          </span>
        </Link>

        {/* Conteúdo central */}
        <div className="relative z-10 space-y-10">
          {/* Headline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1B6FD8]/30 bg-[#1B6FD8]/8 text-[#1B6FD8] text-xs font-mono uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B6FD8] animate-pulse" />
              Sistema ativo
            </div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
              Gestão completa<br />
              para sua<br />
              <span className="text-[#1B6FD8]">assistência técnica</span>
            </h1>
            <p className="text-white/45 text-sm leading-relaxed max-w-xs font-mono">
              Do atendimento ao financeiro — tudo em um painel, acessível de qualquer dispositivo.
            </p>
          </div>

          {/* Benefícios */}
          <ul className="space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[#1B6FD8]/25 bg-[#1B6FD8]/8 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#1B6FD8]" />
                </div>
                <span className="text-sm text-white/60 font-mono">{text}</span>
              </li>
            ))}
          </ul>

          {/* Depoimento */}
          <div className="border-l-2 border-[#1B6FD8]/40 pl-4 space-y-2">
            <p className="text-sm text-white/50 italic leading-relaxed">
              "Reduzi o tempo de abertura de OS em 70% e nunca mais perdi peça no estoque."
            </p>
            <p className="text-xs text-white/30 font-mono uppercase tracking-wider">
              — Ricardo M., TechFix Curitiba
            </p>
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <div className="relative z-10">
          <p className="text-xs text-white/20 font-mono">© {new Date().getFullYear()} Assist-Pró · assistpro.click</p>
        </div>
      </div>

      {/* ══ PAINEL DIREITO — formulário ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Fundo sutil no painel direito */}
        <div className="absolute inset-0 bg-[#0d1e35]" />
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="rg-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rg-grid)" />
          </svg>
        </div>

        {/* Card do formulário */}
        <div className="relative z-10 w-full max-w-sm space-y-8">

          {/* Logo mobile (visível apenas em telas pequenas) */}
          <div className="lg:hidden flex flex-col items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028604039/8gQd8FyXUu5BkEGDFjJzNt/logo-assistpro-flat-G6UeJNmHvJtnXumdSpoDst.webp"
                alt="AssistPró"
                className="h-14 w-auto"
              />
              <span className="font-bold text-2xl tracking-tight text-white">
                Assist<span className="text-[#1B6FD8]">Pró</span>
              </span>
            </Link>
          </div>

          {/* Cabeçalho do form */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Acessar sistema</h2>
            <p className="text-sm text-white/40 font-mono">Entre com suas credenciais para continuar</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest"
              >
                E-mail
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  required
                  className="
                    bg-[#0A1628] border-[#1B6FD8]/25 text-white placeholder:text-white/20
                    focus:border-[#1B6FD8] focus:ring-1 focus:ring-[#1B6FD8]/30
                    rounded-none h-11 font-mono text-sm
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest"
              >
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
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

            {/* Botão submit */}
            <button
              type="submit"
              disabled={login.isPending}
              className="
                w-full h-11 flex items-center justify-center gap-2
                bg-[#1B6FD8] hover:bg-[#1558b0]
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-bold text-sm tracking-wide
                rounded-none
                transition-all duration-200
                relative overflow-hidden group
              "
            >
              {/* Shimmer no hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {login.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1B6FD8]/10" />
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">ou</span>
            <div className="flex-1 h-px bg-[#1B6FD8]/10" />
          </div>

          {/* Link para trial */}
          <div className="text-center space-y-1">
            <p className="text-xs text-white/30 font-mono">Ainda não tem conta?</p>
            <Link
              href="/#cadastro"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B6FD8] hover:text-[#4a9eff] transition-colors group"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Comece seu trial grátis — 14 dias</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Segurança */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Shield className="w-3 h-3 text-white/15" />
            <span className="text-[10px] font-mono text-white/15 uppercase tracking-widest">
              Conexão segura · Dados criptografados
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
