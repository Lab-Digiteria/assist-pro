import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Eye, EyeOff, Loader2, Menu, X, Handshake,
  Wrench, Package, DollarSign, Users, BarChart2, Building2,
  Inbox, Send, TrendingUp, Landmark, ChevronDown, ChevronUp,
  CheckCircle2,
} from "lucide-react";

// ── Intersection Observer hook ────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Geometric grid background decoration ─────────────────────────────────────
function GridDecor({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute pointer-events-none select-none ${className}`}
      aria-hidden="true"
      width="480"
      height="480"
      viewBox="0 0 480 480"
      fill="none"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(27,111,216,0.07)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="480" height="480" fill="url(#grid)" />
    </svg>
  );
}

// ── Corner accent block ───────────────────────────────────────────────────────
function CornerAccent({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <div className="w-16 h-16 border-l-2 border-t-2 border-[#1B6FD8]/30" />
    </div>
  );
}

// ── Nexar Demo Animation ──────────────────────────────────────────────────────
function NexarDemo() {
  const [step, setStep] = useState(0);
  const pn = "Samsung GH82-20";
  const [typed, setTyped] = useState("");
  const { ref, inView } = useInView(0.3);

  useEffect(() => {
    if (!inView) return;
    let t: ReturnType<typeof setTimeout>;
    if (step === 0) {
      let i = 0;
      const type = () => {
        if (i <= pn.length) { setTyped(pn.slice(0, i)); i++; t = setTimeout(type, 65); }
        else { t = setTimeout(() => setStep(1), 400); }
      };
      t = setTimeout(type, 800);
    }
    if (step === 1) { t = setTimeout(() => setStep(2), 1300); }
    if (step === 2) { t = setTimeout(() => setStep(3), 700); }
    if (step === 3) { t = setTimeout(() => { setStep(0); setTyped(""); }, 4500); }
    return () => clearTimeout(t);
  }, [step, inView]);

  return (
    <div ref={ref} className="relative bg-[#0A1628] border border-[#1B6FD8]/20 rounded-none p-6 shadow-2xl max-w-sm mx-auto lg:mx-0">
      {/* Top bar */}
      <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 text-xs text-white/30 font-mono">Assist-Pró — Estoque</span>
      </div>
      <div className="mb-3">
        <label className="text-xs text-white/40 mb-1 block font-mono tracking-wider uppercase">Part Number</label>
        <div className="flex items-center gap-2 bg-[#0d1a2e] border border-[#1B6FD8]/20 px-3 py-2.5">
          <span className="text-sm text-white font-mono flex-1">{typed}<span className="animate-pulse text-[#1B6FD8]">|</span></span>
          {step === 1 && (
            <svg className="w-4 h-4 text-[#1B6FD8] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {step >= 2 && (
            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      {step >= 2 && (
        <div className="bg-[#0d1a2e] border border-[#1B6FD8]/30 p-4 space-y-2 animate-lp-fadein">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#1B6FD8]" />
            <span className="text-xs text-white/40 font-mono tracking-wider uppercase">Resultado Nexar</span>
          </div>
          <p className="text-sm font-semibold text-white">Display OLED Samsung Galaxy S20</p>
          <p className="text-xs text-white/55">Fabricante: <span className="text-[#1B6FD8]">Samsung Electronics</span></p>
          <div className="flex flex-wrap gap-1 mt-1">
            {["OLED", "6.2\"", "FHD+", "120Hz"].map(s => (
              <span key={s} className="text-[10px] bg-[#1B6FD8]/15 text-[#7eb3f5] px-2 py-0.5 font-mono">{s}</span>
            ))}
          </div>
          <p className="text-xs text-white/35 pt-1 font-mono">Preço ref.: <span className="text-[#E8C547]">USD 42,00</span></p>
        </div>
      )}
      {step === 3 && (
        <div className="mt-3 flex items-center gap-2 bg-green-900/20 border border-green-500/25 px-3 py-2 animate-lp-fadein">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-xs text-green-300 font-mono">Dados preenchidos via Nexar</span>
        </div>
      )}
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#1B6FD8]/40" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#1B6FD8]/40" />
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/8 overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 hover:bg-white/3 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-white/85">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-white/35 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-white/35 flex-shrink-0" />
        }
      </button>
      {open && <div className="px-5 pb-4 text-sm text-white/55 leading-relaxed border-t border-white/5">{a}</div>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [trialSuccess, setTrialSuccess] = useState(false);
  const [trialForm, setTrialForm] = useState({ name: "", email: "", password: "", companyName: "", phone: "", document: "" });
  const [revendaSuccess, setRevendaSuccess] = useState(false);
  const [revendaForm, setRevendaForm] = useState({ nome: "", email: "", whatsapp: "", cidade: "", estado: "", atuacao: "assistencia_tecnica" as const, mensagem: "" });

  const [referralCode] = useState<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref")?.toUpperCase();
    if (ref) { localStorage.setItem("ap_ref", ref); return ref; }
    return localStorage.getItem("ap_ref") ?? undefined;
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const registerTrial = trpc.lead.register.useMutation({
    onSuccess: (data) => {
      setTrialSuccess(true);
      toast.success(`Bem-vindo! Seu trial de ${data.trialDays} dias começou agora.`);
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    },
    onError: (e) => toast.error(e.message),
  });

  const registerRevenda = trpc.revendedores.register.useMutation({
    onSuccess: () => { setRevendaSuccess(true); toast.success("Interesse registrado! Entraremos em contato em breve."); },
    onError: (e) => toast.error(e.message),
  });

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, companyName, phone, document } = trialForm;
    if (!name || !email || !password || !companyName || !phone || !document) { toast.error("Preencha todos os campos obrigatórios"); return; }
    registerTrial.mutate({ name, email, password, companyName, phone, document, source: "landing", referralCode });
  };

  const handleRevendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { nome, email, whatsapp, cidade, estado } = revendaForm;
    if (!nome || !email || !whatsapp || !cidade || !estado) { toast.error("Preencha todos os campos obrigatórios"); return; }
    registerRevenda.mutate({ ...revendaForm });
  };

  const handleCTA = () => {
    if (isAuthenticated) navigate("/dashboard");
    else document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  // Section animations
  const sFeatures = useInView(); const sNexar = useInView(); const sFinanceiro = useInView();
  const sPrecos = useInView(); const sDepo = useInView(); const sFaq = useInView();
  const sRevenda = useInView(); const sCta = useInView();

  const modules = [
    { icon: <Wrench className="w-5 h-5" />, title: "Ordens de Serviço", desc: "Abertura, acompanhamento e encerramento com checklist de entrada, assinatura digital e portal do cliente" },
    { icon: <Package className="w-5 h-5" />, title: "Controle de Estoque", desc: "Gerencie peças com Part Number, fabricante, modelos compatíveis e lista de compras integrada" },
    { icon: <DollarSign className="w-5 h-5" />, title: "Financeiro Completo", desc: "Contas a pagar e receber, fluxo de caixa, DRE gerencial e plano de contas para assistências" },
    { icon: <Users className="w-5 h-5" />, title: "Cadastro de Clientes", desc: "Ficha completa com histórico de OS, equipamentos atendidos e contato direto via WhatsApp" },
    { icon: <BarChart2 className="w-5 h-5" />, title: "Relatórios Gerenciais", desc: "DRE, faturamento por período, ticket médio, peças mais usadas e inadimplência" },
    { icon: <Building2 className="w-5 h-5" />, title: "Multi-unidades", desc: "Cada unidade tem ambiente isolado com gestão centralizada pelo administrador" },
  ];

  const plans = [
    { name: "Mensal", price: "R$ 99", period: "/mês", sub: null, highlight: false, badge: null, features: ["Todos os módulos incluídos", "Suporte por e-mail", "Cancele quando quiser"], cta: "Começar agora", ctaClass: "border border-white/20 text-white hover:bg-white/5" },
    { name: "Anual", price: "R$ 799", period: "/ano", sub: "equivale a R$ 66/mês", highlight: true, badge: "Mais escolhido — Economize 33%", features: ["Todos os módulos incluídos", "Suporte prioritário", "2 meses grátis vs mensal"], cta: "Assinar plano anual", ctaClass: "bg-[#1B6FD8] hover:bg-[#1558b0] text-white" },
    { name: "Vitalício", price: "R$ 1.499", period: " único", sub: "ou 10× sem juros", highlight: false, badge: null, features: ["Todos os módulos + atualizações", "Suporte VIP", "Pagamento único, acesso para sempre"], cta: "Garantir acesso vitalício", ctaClass: "border border-[#1B6FD8] text-[#1B6FD8] hover:bg-[#1B6FD8]/10" },
  ];

  const testimonials = [
    { text: "Antes eu controlava tudo em planilha. Hoje consigo ver o DRE do mês em segundos e saber exatamente quanto lucrei.", name: "Carlos Mendes", company: "TechFix Curitiba" },
    { text: "A busca por Part Number mudou minha vida. Cadastrar peças agora leva metade do tempo.", name: "Adriana Souza", company: "Repara Já — São Paulo" },
    { text: "O portal do cliente reduziu as ligações perguntando sobre o status das OS. Vale cada centavo.", name: "Roberto Lima", company: "Lima Cell — Belo Horizonte" },
  ];

  const faqs = [
    { q: "Posso usar em mais de uma assistência técnica?", a: "Sim! O Assist-Pró é multi-tenant: cada assistência tem seu ambiente completamente isolado, com dados, equipe e configurações independentes." },
    { q: "O trial de 14 dias exige cartão de crédito?", a: "Não. Você começa a usar imediatamente sem precisar cadastrar nenhum meio de pagamento. Só pedimos CPF/CNPJ e WhatsApp para contato." },
    { q: "Como funciona o cálculo de comissão dos técnicos?", a: "Você configura o percentual por técnico e por categoria de equipamento. Ao marcar a OS como concluída, o sistema calcula e registra a comissão automaticamente." },
    { q: "O sistema funciona no celular?", a: "Sim. O Assist-Pró é totalmente responsivo e funciona em qualquer dispositivo — computador, tablet ou smartphone." },
    { q: "Posso migrar meus dados de outro sistema?", a: "Nossa equipe oferece suporte para importação de dados. Entre em contato pelo WhatsApp para verificar a compatibilidade com seu sistema atual." },
  ];

  const inputCls = "bg-[#060e1c] border-[#1B6FD8]/20 text-white placeholder:text-white/20 rounded-none focus-visible:ring-[#1B6FD8]/40 focus-visible:border-[#1B6FD8]/50";

  return (
    <div className="min-h-screen bg-[#0A1628] text-white font-sans">

      {/* ══ [1] HEADER ══════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0A1628]/90 backdrop-blur-md border-b border-[#1B6FD8]/10 shadow-lg shadow-black/30" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
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
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/55">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#revendedores" className="hover:text-white transition-colors">Revendedores</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={() => navigate("/dashboard")} className="text-sm font-semibold bg-[#1B6FD8] hover:bg-[#1558b0] text-white px-4 py-2 transition-colors">
                Acessar Sistema
              </button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="text-sm text-white/55 hover:text-white transition-colors">Entrar</button>
                <button onClick={handleCTA} className="text-sm font-semibold bg-[#1B6FD8] hover:bg-[#1558b0] text-white px-4 py-2 transition-colors">
                  Testar grátis por 14 dias
                </button>
              </>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-[#0A1628] border-t border-[#1B6FD8]/10 px-4 py-4 space-y-3">
            {[["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"], ["FAQ", "#faq"], ["Revendedores", "#revendedores"]].map(([l, h]) => (
              <a key={l} href={h} className="block text-sm text-white/55 hover:text-white" onClick={() => setMobileMenu(false)}>{l}</a>
            ))}
            <button onClick={() => { handleCTA(); setMobileMenu(false); }} className="w-full text-sm font-semibold bg-[#1B6FD8] text-white py-2.5 transition-colors">Testar grátis</button>
          </div>
        )}
      </header>

      {/* ══ [2] HERO ════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Geometric background */}
        <GridDecor className="top-0 right-0 opacity-60" />
        <GridDecor className="bottom-0 left-0 opacity-40" />
        {/* Horizontal rule accent */}
        <div className="absolute top-28 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1B6FD8]/15 to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          {/* Left */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 bg-[#1B6FD8]/10 border border-[#1B6FD8]/25 text-[#7eb3f5] text-xs font-medium px-3 py-1.5 mb-6 font-mono tracking-wider uppercase">
              ▸ Sistema completo para assistências técnicas
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-tight mb-5 tracking-tight">
              Gerencie sua assistência técnica com{" "}
              <span className="text-[#1B6FD8]">inteligência</span>
            </h1>
            <p className="text-base sm:text-lg text-white/55 mb-7 leading-relaxed">
              Do atendimento ao financeiro, do estoque ao diagnóstico — tudo em um só lugar, com busca automática de componentes por Part Number.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button onClick={handleCTA} className="inline-flex items-center justify-center gap-2 bg-[#1B6FD8] hover:bg-[#1558b0] text-white font-semibold px-6 py-3 transition-colors text-base">
                Começar teste grátis →
              </button>
              <a href="#funcionalidades" className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-medium px-6 py-3 transition-colors text-base">
                Ver demonstração
              </a>
            </div>
            <p className="text-xs text-white/30 font-mono">▸ 14 dias grátis · Sem cartão de crédito · Cancele quando quiser</p>
            {/* Dashboard Screenshot */}
            <div className="mt-6 overflow-hidden border border-[#1B6FD8]/15 shadow-2xl hidden lg:block">
              <div className="flex items-center gap-1.5 bg-[#060e1c] px-3 py-2 border-b border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-white/25 font-mono">Assist-Pró — Dashboard</span>
              </div>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028604039/8gQd8FyXUu5BkEGDFjJzNt/dashboard-screenshot_d1524766.png"
                alt="Dashboard do Assist-Pró com OS, faturamento e alertas"
                className="w-full object-cover object-top"
                style={{ maxHeight: "260px" }}
              />
            </div>
          </div>

          {/* Right — Cadastro */}
          <div id="cadastro" className="bg-[#060e1c] border border-[#1B6FD8]/15 p-6 shadow-2xl relative">
            <CornerAccent className="top-0 right-0" />
            <CornerAccent className="bottom-0 left-0 rotate-180" />
            {!trialSuccess ? (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Comece seu trial gratuito</h2>
                <p className="text-sm text-white/45 mb-5">Preencha abaixo e tenha acesso imediato ao sistema completo.</p>
                <form onSubmit={handleTrialSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs text-white/45 mb-1 block font-mono tracking-wider">NOME COMPLETO *</Label>
                    <Input placeholder="João Silva" value={trialForm.name} onChange={e => setTrialForm({ ...trialForm, name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-xs text-white/45 mb-1 block font-mono tracking-wider">NOME DA EMPRESA *</Label>
                    <Input placeholder="Brito Assistência Técnica" value={trialForm.companyName} onChange={e => setTrialForm({ ...trialForm, companyName: e.target.value })} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/45 mb-1 block font-mono tracking-wider">CPF OU CNPJ *</Label>
                      <Input placeholder="000.000.000-00" value={trialForm.document} onChange={e => setTrialForm({ ...trialForm, document: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <Label className="text-xs text-white/45 mb-1 block font-mono tracking-wider">WHATSAPP *</Label>
                      <Input placeholder="(11) 99999-9999" value={trialForm.phone} onChange={e => setTrialForm({ ...trialForm, phone: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/45 mb-1 block font-mono tracking-wider">E-MAIL *</Label>
                    <Input type="email" placeholder="joao@empresa.com" value={trialForm.email} onChange={e => setTrialForm({ ...trialForm, email: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-xs text-white/45 mb-1 block font-mono tracking-wider">SENHA *</Label>
                    <div className="relative">
                      <Input type={showPw ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={trialForm.password}
                        onChange={e => setTrialForm({ ...trialForm, password: e.target.value })}
                        className={`${inputCls} pr-10`} />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/65"
                        onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={registerTrial.isPending}
                    className="w-full bg-[#1B6FD8] hover:bg-[#1558b0] disabled:opacity-60 text-white font-semibold py-3 transition-colors flex items-center justify-center gap-2 mt-1">
                    {registerTrial.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Começar agora — grátis por 14 dias →
                  </button>
                </form>
                <p className="text-center text-xs text-white/25 mt-3 font-mono">Sem cartão de crédito · Acesso imediato · Cancele quando quiser</p>
                {!isAuthenticated && (
                  <p className="text-center text-xs text-white/35 mt-2">Já tem conta? <button onClick={() => navigate("/login")} className="text-[#7eb3f5] hover:underline">Entrar</button></p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Conta criada com sucesso!</h3>
                <p className="text-sm text-white/45">Redirecionando para o sistema...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ [3] BARRA DE CREDIBILIDADE ══════════════════════════════════════ */}
      <section className="border-y border-[#1B6FD8]/10 bg-[#060e1c] py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-white/35 mb-4 font-mono">Desenvolvido para assistências técnicas de smartphones, notebooks, tablets e eletrônicos em geral</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/30">
            {[["Smartphones", "📱"], ["Notebooks", "💻"], ["Desktops", "🖥️"], ["Videogames", "🎮"], ["TVs", "📺"]].map(([label, icon]) => (
              <span key={label} className="flex items-center gap-1.5 font-mono text-xs tracking-wider uppercase">{icon} {label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ [4] FUNCIONALIDADES ═════════════════════════════════════════════ */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <GridDecor className="top-0 left-0 opacity-30" />
        <div ref={sFeatures.ref} className={`max-w-6xl mx-auto transition-all duration-700 ${sFeatures.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12">
            <p className="text-xs text-[#1B6FD8] font-mono font-semibold tracking-widest uppercase mb-2">▸ Módulos</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Tudo que sua assistência precisa</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1B6FD8]/8">
            {modules.map(m => (
              <div key={m.title} className="group bg-[#0A1628] hover:bg-[#0d1a2e] p-6 transition-colors duration-200 cursor-default">
                <div className="w-9 h-9 bg-[#1B6FD8]/10 border border-[#1B6FD8]/20 flex items-center justify-center mb-4 text-[#1B6FD8] group-hover:bg-[#1B6FD8]/20 transition-colors">
                  {m.icon}
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{m.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ [5] NEXAR ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-[#060e1c] relative overflow-hidden">
        <GridDecor className="top-0 right-0 opacity-40" />
        <div ref={sNexar.ref} className={`max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${sNexar.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-[#C4733A]/8 border border-[#C4733A]/25 text-[#C4733A] text-xs font-mono font-semibold px-3 py-1.5 mb-6 tracking-wider uppercase">
              ▸ Integração Nexar · Base com milhões de componentes
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Identifique qualquer componente em segundos</h2>
            <p className="text-white/50 leading-relaxed mb-8 text-sm">
              Digite o Part Number de uma peça e o Assist-Pró consulta automaticamente a base global da Nexar — retornando fabricante, descrição técnica e especificações sem que você precise digitar nada manualmente.
            </p>
            <ul className="space-y-3">
              {["Elimina erros de cadastro por digitação", "Acelera o lançamento de peças no estoque", "Rastreia compatibilidade com modelos de equipamentos", "Base atualizada com milhões de componentes eletrônicos"].map(b => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-[#1B6FD8] mt-0.5 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
          </div>
          <NexarDemo />
        </div>
      </section>

      {/* ══ [6] FINANCEIRO ══════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <GridDecor className="bottom-0 right-0 opacity-25" />
        <div ref={sFinanceiro.ref} className={`max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${sFinanceiro.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* DRE Mockup */}
          <div className="bg-[#060e1c] border border-[#1B6FD8]/15 p-5 shadow-xl relative">
            <CornerAccent className="top-0 right-0" />
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <span className="text-sm font-semibold text-white font-mono">DRE — Abril 2025</span>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 font-mono">Mensal</span>
            </div>
            {[
              { label: "Receita Bruta", value: "R$ 24.800", cls: "text-green-400" },
              { label: "Custo das Peças", value: "− R$ 6.200", cls: "text-red-400" },
              { label: "Despesas Operacionais", value: "− R$ 4.100", cls: "text-red-400" },
              { label: "Comissões Técnicos", value: "− R$ 2.480", cls: "text-red-400" },
              { label: "Resultado Líquido", value: "R$ 12.020", cls: "text-[#E8C547] font-bold" },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-white/50">{row.label}</span>
                <span className={`text-sm font-mono ${row.cls}`}>{row.value}</span>
              </div>
            ))}
            <div className="mt-3 bg-[#1B6FD8]/8 border border-[#1B6FD8]/15 p-3 text-center">
              <p className="text-xs text-white/30 font-mono uppercase tracking-wider">Margem líquida</p>
              <p className="text-2xl font-bold text-[#E8C547] font-mono">48,5%</p>
            </div>
          </div>
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#1B6FD8]/10 border border-[#1B6FD8]/25 text-[#7eb3f5] text-xs font-mono font-semibold px-3 py-1.5 mb-6 tracking-wider uppercase">
              ▸ Gestão financeira profissional
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Saiba exatamente onde está o dinheiro da sua empresa</h2>
            <div className="grid grid-cols-2 gap-px bg-[#1B6FD8]/8 mt-6">
              {[
                { icon: <Inbox className="w-4 h-4" />, title: "Contas a Receber", desc: "Controle de pagamentos de OS e cobranças avulsas" },
                { icon: <Send className="w-4 h-4" />, title: "Contas a Pagar", desc: "Fornecedores, despesas fixas e variáveis com vencimento" },
                { icon: <TrendingUp className="w-4 h-4" />, title: "DRE Gerencial", desc: "Receita, custos, despesas e resultado líquido do período" },
                { icon: <Landmark className="w-4 h-4" />, title: "Contas Bancárias", desc: "Saldo por conta, importação de extrato OFX/CSV" },
              ].map(c => (
                <div key={c.title} className="bg-[#0A1628] p-4">
                  <div className="text-[#1B6FD8] mb-2">{c.icon}</div>
                  <p className="text-sm font-semibold text-white mb-1">{c.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ [7] PREÇOS ══════════════════════════════════════════════════════ */}
      <section id="precos" className="py-20 px-4 sm:px-6 bg-[#060e1c] relative overflow-hidden">
        <GridDecor className="top-0 left-0 opacity-30" />
        <div ref={sPrecos.ref} className={`max-w-5xl mx-auto transition-all duration-700 ${sPrecos.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12">
            <p className="text-xs text-[#1B6FD8] font-mono font-semibold tracking-widest uppercase mb-2">▸ Planos</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Escolha o plano ideal para sua assistência</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-[#1B6FD8]/10 items-start">
            {plans.map(p => (
              <div key={p.name} className={`relative p-6 flex flex-col ${p.highlight ? "bg-[#0d1a2e] border-t-2 border-t-[#1B6FD8] sm:scale-[1.02]" : "bg-[#0A1628]"}`}>
                {p.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1B6FD8] text-white text-xs font-bold px-3 py-1 font-mono">{p.badge}</div>
                )}
                <h3 className="font-bold text-lg mb-1 font-mono">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold font-mono">{p.price}</span>
                  <span className="text-sm text-white/40">{p.period}</span>
                </div>
                {p.sub && <p className="text-xs text-white/30 mb-4 font-mono">{p.sub}</p>}
                <ul className="space-y-2 mb-6 flex-1 mt-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-[#1B6FD8] mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={handleCTA} className={`w-full py-3 font-semibold text-sm transition-colors ${p.ctaClass}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-white/30 mt-6 font-mono">Todos os planos incluem 14 dias de teste gratuito. Sem cartão de crédito para começar.</p>
        </div>
      </section>

      {/* ══ [8] DEPOIMENTOS ═════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <GridDecor className="top-0 right-0 opacity-20" />
        <div ref={sDepo.ref} className={`max-w-5xl mx-auto transition-all duration-700 ${sDepo.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12">
            <p className="text-xs text-[#1B6FD8] font-mono font-semibold tracking-widest uppercase mb-2">▸ Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Assistências técnicas que já usam o Assist-Pró</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-[#1B6FD8]/8">
            {testimonials.map(t => (
              <div key={t.name} className="bg-[#0A1628] p-6 flex flex-col gap-4">
                <div className="text-[#E8C547] text-base tracking-widest">★★★★★</div>
                <p className="text-sm text-white/60 leading-relaxed">"{t.text}"</p>
                <div className="mt-auto pt-3 border-t border-white/5">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/30 font-mono">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ [9] FAQ ═════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-[#060e1c] relative overflow-hidden">
        <GridDecor className="bottom-0 left-0 opacity-25" />
        <div ref={sFaq.ref} className={`max-w-3xl mx-auto transition-all duration-700 ${sFaq.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-10">
            <p className="text-xs text-[#1B6FD8] font-mono font-semibold tracking-widest uppercase mb-2">▸ FAQ</p>
            <h2 className="text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
          </div>
          <div className="space-y-px bg-[#1B6FD8]/8">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ══ [10] REVENDEDORES ═══════════════════════════════════════════════ */}
      <section id="revendedores" className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <GridDecor className="top-0 right-0 opacity-25" />
        <div ref={sRevenda.ref} className={`max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start transition-all duration-700 ${sRevenda.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-[#E8C547]/8 border border-[#E8C547]/25 text-[#E8C547] text-xs font-mono font-semibold px-3 py-1.5 mb-6 tracking-wider uppercase">
              ▸ Programa de Revendedores
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Revenda o Assist-Pró e gere renda recorrente</h2>
            <p className="text-white/50 leading-relaxed mb-6 text-sm">
              Seja um revendedor autorizado e ganhe comissão recorrente por cada assistência técnica que você indicar. Ideal para consultores de TI, técnicos e agências.
            </p>
            <ul className="space-y-3">
              {["Comissão recorrente mensal", "Material de vendas e suporte técnico", "Painel de acompanhamento de indicações", "Sem custo para começar"].map(b => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-[#E8C547] mt-0.5 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#060e1c] border border-[#1B6FD8]/15 p-6 relative">
            <CornerAccent className="top-0 right-0" />
            {!revendaSuccess ? (
              <>
                <h3 className="text-lg font-bold text-white mb-4">Quero ser revendedor</h3>
                <form onSubmit={handleRevendaSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block font-mono tracking-wider">NOME COMPLETO *</Label>
                    <Input placeholder="Seu nome" value={revendaForm.nome} onChange={e => setRevendaForm(p => ({ ...p, nome: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block font-mono tracking-wider">E-MAIL *</Label>
                    <Input type="email" placeholder="seu@email.com" value={revendaForm.email} onChange={e => setRevendaForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/40 mb-1 block font-mono tracking-wider">WHATSAPP *</Label>
                      <Input placeholder="(11) 99999-9999" value={revendaForm.whatsapp} onChange={e => setRevendaForm(p => ({ ...p, whatsapp: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <Label className="text-xs text-white/40 mb-1 block font-mono tracking-wider">CIDADE *</Label>
                      <Input placeholder="São Paulo" value={revendaForm.cidade} onChange={e => setRevendaForm(p => ({ ...p, cidade: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block font-mono tracking-wider">ESTADO *</Label>
                    <select value={revendaForm.estado} onChange={e => setRevendaForm(p => ({ ...p, estado: e.target.value }))}
                      className="w-full h-10 px-3 text-sm bg-[#060e1c] border border-[#1B6FD8]/20 text-white rounded-none focus:outline-none focus:border-[#1B6FD8]/50">
                      <option value="">Selecione o estado</option>
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block font-mono tracking-wider">ÁREA DE ATUAÇÃO *</Label>
                    <select value={revendaForm.atuacao} onChange={e => setRevendaForm(p => ({ ...p, atuacao: e.target.value as typeof revendaForm.atuacao }))}
                      className="w-full h-10 px-3 text-sm bg-[#060e1c] border border-[#1B6FD8]/20 text-white rounded-none focus:outline-none focus:border-[#1B6FD8]/50">
                      <option value="assistencia_tecnica">Assistência Técnica</option>
                      <option value="consultor_ti">Consultor de TI</option>
                      <option value="revendedor_software">Revendedor de Software</option>
                      <option value="agencia_marketing">Agência de Marketing</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block font-mono tracking-wider">MENSAGEM (OPCIONAL)</Label>
                    <textarea value={revendaForm.mensagem} onChange={e => setRevendaForm(p => ({ ...p, mensagem: e.target.value }))}
                      placeholder="Conte um pouco sobre sua experiência..." rows={3}
                      className="w-full px-3 py-2 text-sm resize-none bg-[#060e1c] border border-[#1B6FD8]/20 text-white placeholder:text-white/20 rounded-none focus:outline-none focus:border-[#1B6FD8]/50" />
                  </div>
                  <button type="submit" disabled={registerRevenda.isPending}
                    className="w-full bg-[#E8C547] hover:bg-[#d4b03e] disabled:opacity-60 text-[#0A1628] font-bold py-3 transition-colors flex items-center justify-center gap-2">
                    {registerRevenda.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                    Quero ser revendedor
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Interesse registrado!</h3>
                <p className="text-sm text-white/45">Entraremos em contato em breve.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ [11] CTA FINAL ══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden bg-[#060e1c]">
        {/* Geometric accent lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1B6FD8]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1B6FD8]/20 to-transparent" />
          <GridDecor className="top-0 left-1/2 -translate-x-1/2 opacity-20" />
        </div>
        <div ref={sCta.ref} className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${sCta.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 bg-[#1B6FD8]/10 border border-[#1B6FD8]/25 text-[#7eb3f5] text-xs font-mono font-semibold px-3 py-1.5 mb-6 tracking-wider uppercase">
            ▸ Comece hoje mesmo
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Sua assistência técnica merece uma gestão profissional
          </h2>
          <p className="text-white/50 text-lg mb-8">Comece hoje. Configure em minutos. Resultados desde o primeiro dia.</p>
          <button onClick={handleCTA}
            className="inline-flex items-center gap-2 bg-[#1B6FD8] hover:bg-[#1558b0] text-white font-bold px-8 py-4 text-lg transition-colors shadow-lg shadow-[#1B6FD8]/20">
            Criar minha conta grátis →
          </button>
          <p className="text-xs text-white/20 mt-4 font-mono">▸ 14 dias grátis · Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </section>

      {/* ══ [12] FOOTER ═════════════════════════════════════════════════════ */}
      <footer id="contato" className="border-t border-[#1B6FD8]/10 bg-[#0A1628] py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310419663028604039/8gQd8FyXUu5BkEGDFjJzNt/logo-assistpro-flat-G6UeJNmHvJtnXumdSpoDst.webp"
                  alt="AssistPró"
                  className="h-10 w-auto"
                />
                <span className="font-bold text-lg tracking-tight text-white">
                  Assist<span className="text-[#1B6FD8]">Pró</span>
                </span>
              </div>
              <p className="text-xs text-white/30 leading-relaxed font-mono">Gestão inteligente para assistências técnicas</p>
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-3">Links</p>
              <div className="space-y-2">
                {[["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"], ["FAQ", "#faq"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-sm text-white/30 hover:text-white/60 transition-colors font-mono">{label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-white/40 uppercase tracking-wider mb-3">Contato</p>
              <a href="mailto:suporte@assistpro.com.br" className="text-sm text-white/30 hover:text-white/60 transition-colors font-mono">suporte@assistpro.com.br</a>
            </div>
          </div>
          <div className="border-t border-[#1B6FD8]/8 pt-6 text-center text-xs text-white/20 font-mono">
            © {new Date().getFullYear()} Assist-Pró. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes lp-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-lp-fadein { animation: lp-fadein 0.35s ease forwards; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
