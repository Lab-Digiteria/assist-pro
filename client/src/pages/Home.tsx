import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Eye, EyeOff, Loader2, Menu, X, Wrench, Handshake } from "lucide-react";

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
    <div ref={ref} className="relative bg-[#0d1117] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm mx-auto lg:mx-0">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-xs text-white/30">Assist-Pró — Estoque</span>
      </div>
      <div className="mb-3">
        <label className="text-xs text-white/50 mb-1 block">Part Number</label>
        <div className="flex items-center gap-2 bg-[#161b22] border border-white/10 rounded-lg px-3 py-2.5">
          <span className="text-sm text-white font-mono flex-1">{typed}<span className="animate-pulse text-[#C4733A]">|</span></span>
          {step === 1 && (
            <svg className="w-4 h-4 text-[#C4733A] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
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
        <div className="bg-[#161b22] border border-[#1B4F8A]/40 rounded-xl p-4 space-y-2 animate-lp-fadein">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C4733A]" />
            <span className="text-xs text-white/50">Resultado Nexar</span>
          </div>
          <p className="text-sm font-semibold text-white">Display OLED Samsung Galaxy S20</p>
          <p className="text-xs text-white/60">Fabricante: <span className="text-[#C4733A]">Samsung Electronics</span></p>
          <div className="flex flex-wrap gap-1 mt-1">
            {["OLED", "6.2\"", "FHD+", "120Hz"].map(s => (
              <span key={s} className="text-[10px] bg-[#1B4F8A]/30 text-[#7eb3f5] px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
          <p className="text-xs text-white/40 pt-1">Preço ref.: <span className="text-[#E8C547]">USD 42,00</span></p>
        </div>
      )}
      {step === 3 && (
        <div className="mt-3 flex items-center gap-2 bg-green-900/30 border border-green-500/30 rounded-lg px-3 py-2 animate-lp-fadein">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-300">Dados preenchidos automaticamente via Nexar</span>
        </div>
      )}
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 hover:bg-white/5 transition-colors"
        onClick={() => setOpen(!open)}>
        <span className="text-sm font-medium text-white">{q}</span>
        <span className="text-white/40 flex-shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-4 text-sm text-white/60 leading-relaxed">{a}</div>}
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
    { icon: "🔧", title: "Ordens de Serviço", desc: "Abertura, acompanhamento e encerramento com checklist de entrada, assinatura digital e portal do cliente" },
    { icon: "📦", title: "Controle de Estoque", desc: "Gerencie peças com Part Number, fabricante, modelos compatíveis e lista de compras integrada" },
    { icon: "💰", title: "Financeiro Completo", desc: "Contas a pagar e receber, fluxo de caixa, DRE gerencial e plano de contas para assistências" },
    { icon: "👥", title: "Cadastro de Clientes", desc: "Ficha completa com histórico de OS, equipamentos atendidos e contato direto via WhatsApp" },
    { icon: "📊", title: "Relatórios Gerenciais", desc: "DRE, faturamento por período, ticket médio, peças mais usadas e inadimplência" },
    { icon: "🏪", title: "Multi-unidades", desc: "Cada unidade tem ambiente isolado com gestão centralizada pelo administrador" },
  ];

  const plans = [
    { name: "Mensal", price: "R$ 99", period: "/mês", sub: null, highlight: false, badge: null, features: ["Todos os módulos incluídos", "Suporte por e-mail", "Cancele quando quiser"], cta: "Começar agora", ctaClass: "border border-white/20 text-white hover:bg-white/5" },
    { name: "Anual", price: "R$ 799", period: "/ano", sub: "equivale a R$ 66/mês", highlight: true, badge: "Mais escolhido — Economize 33%", features: ["Todos os módulos incluídos", "Suporte prioritário", "2 meses grátis vs mensal"], cta: "Assinar plano anual", ctaClass: "bg-[#C4733A] hover:bg-[#b5672f] text-white" },
    { name: "Vitalício", price: "R$ 1.499", period: " único", sub: "ou 10× sem juros", highlight: false, badge: null, features: ["Todos os módulos + atualizações", "Suporte VIP", "Pagamento único, acesso para sempre"], cta: "Garantir acesso vitalício", ctaClass: "border border-[#C4733A] text-[#C4733A] hover:bg-[#C4733A]/10" },
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

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">

      {/* ══ [1] HEADER ══════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0d1117]/85 backdrop-blur-md border-b border-white/5 shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-[#1B4F8A] flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </span>
            Assist<span className="text-[#C4733A]">-Pró</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/60">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#revendedores" className="hover:text-white transition-colors">Revendedores</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} className="bg-[#1B4F8A] hover:bg-[#1a4578] text-white text-sm">Acessar Sistema</Button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="text-sm text-white/60 hover:text-white transition-colors">Entrar</button>
                <button onClick={handleCTA} className="text-sm font-semibold bg-[#C4733A] hover:bg-[#b5672f] text-white px-4 py-2 rounded-lg transition-colors">
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
          <div className="md:hidden bg-[#0d1117] border-t border-white/5 px-4 py-4 space-y-3">
            {[["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"], ["FAQ", "#faq"], ["Revendedores", "#revendedores"]].map(([l, h]) => (
              <a key={l} href={h} className="block text-sm text-white/60 hover:text-white" onClick={() => setMobileMenu(false)}>{l}</a>
            ))}
            <button onClick={() => { handleCTA(); setMobileMenu(false); }} className="w-full text-sm font-semibold bg-[#C4733A] text-white py-2.5 rounded-lg">Testar grátis</button>
          </div>
        )}
      </header>

      {/* ══ [2] HERO ════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1B4F8A]/15 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-[#C4733A]/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          {/* Left */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 bg-[#1B4F8A]/20 border border-[#1B4F8A]/40 text-[#7eb3f5] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              ✦ Sistema completo para assistências técnicas
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-tight mb-5">
              Gerencie sua assistência técnica com{" "}
              <span className="text-[#C4733A]">inteligência</span>
            </h1>
            <p className="text-base sm:text-lg text-white/60 mb-7 leading-relaxed">
              Do atendimento ao financeiro, do estoque ao diagnóstico — tudo em um só lugar, com busca automática de componentes por Part Number.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button onClick={handleCTA} className="inline-flex items-center justify-center gap-2 bg-[#C4733A] hover:bg-[#b5672f] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-base">
                Começar teste grátis →
              </button>
              <a href="#funcionalidades" className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium px-6 py-3 rounded-xl transition-colors text-base">
                Ver demonstração
              </a>
            </div>
            <p className="text-xs text-white/35">✦ 14 dias grátis · Sem cartão de crédito · Cancele quando quiser</p>
          </div>
          {/* Right — Cadastro */}
          <div id="cadastro" className="bg-[#161b22] border border-white/10 rounded-2xl p-6 shadow-2xl">
            {!trialSuccess ? (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Comece seu trial gratuito</h2>
                <p className="text-sm text-white/50 mb-5">Preencha abaixo e tenha acesso imediato ao sistema completo.</p>
                <form onSubmit={handleTrialSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">Nome completo *</Label>
                    <Input placeholder="João Silva" value={trialForm.name} onChange={e => setTrialForm({ ...trialForm, name: e.target.value })}
                      className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">Nome da empresa *</Label>
                    <Input placeholder="Brito Assistência Técnica" value={trialForm.companyName} onChange={e => setTrialForm({ ...trialForm, companyName: e.target.value })}
                      className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/50 mb-1 block">CPF ou CNPJ *</Label>
                      <Input placeholder="000.000.000-00" value={trialForm.document} onChange={e => setTrialForm({ ...trialForm, document: e.target.value })}
                        className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50 mb-1 block">WhatsApp *</Label>
                      <Input placeholder="(11) 99999-9999" value={trialForm.phone} onChange={e => setTrialForm({ ...trialForm, phone: e.target.value })}
                        className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">E-mail *</Label>
                    <Input type="email" placeholder="joao@empresa.com" value={trialForm.email} onChange={e => setTrialForm({ ...trialForm, email: e.target.value })}
                      className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">Senha *</Label>
                    <div className="relative">
                      <Input type={showPw ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={trialForm.password}
                        onChange={e => setTrialForm({ ...trialForm, password: e.target.value })}
                        className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20 pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                        onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={registerTrial.isPending}
                    className="w-full bg-[#C4733A] hover:bg-[#b5672f] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1">
                    {registerTrial.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Começar agora — grátis por 14 dias →
                  </button>
                </form>
                <p className="text-center text-xs text-white/30 mt-3">Sem cartão de crédito · Acesso imediato · Cancele quando quiser</p>
                {!isAuthenticated && (
                  <p className="text-center text-xs text-white/40 mt-2">Já tem conta? <button onClick={() => navigate("/login")} className="text-[#7eb3f5] hover:underline">Entrar</button></p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Conta criada com sucesso!</h3>
                <p className="text-sm text-white/50">Redirecionando para o sistema...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ [3] BARRA DE CREDIBILIDADE ══════════════════════════════════════ */}
      <section className="border-y border-white/5 bg-[#0a0f16] py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-white/40 mb-4">Desenvolvido para assistências técnicas de smartphones, notebooks, tablets e eletrônicos em geral</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/35">
            {[["📱", "Smartphones"], ["💻", "Notebooks"], ["🖥️", "Desktops"], ["🎮", "Videogames"], ["📺", "TVs"]].map(([icon, label]) => (
              <span key={label as string} className="flex items-center gap-1.5">{icon} {label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ [4] FUNCIONALIDADES ═════════════════════════════════════════════ */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6">
        <div ref={sFeatures.ref} className={`max-w-6xl mx-auto transition-all duration-700 ${sFeatures.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12">
            <p className="text-xs text-[#C4733A] font-semibold tracking-widest uppercase mb-2">Módulos</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Tudo que sua assistência precisa</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map(m => (
              <div key={m.title} className="group bg-[#161b22] border border-white/5 hover:border-[#1B4F8A]/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#1B4F8A]/10 hover:-translate-y-1 cursor-default">
                <span className="text-3xl mb-4 block">{m.icon}</span>
                <h3 className="font-semibold text-white mb-2">{m.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ [5] NEXAR ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a0f16]">
        <div ref={sNexar.ref} className={`max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${sNexar.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-[#C4733A]/10 border border-[#C4733A]/30 text-[#C4733A] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wider">
              ✦ INTEGRAÇÃO NEXAR · BASE COM MILHÕES DE COMPONENTES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Identifique qualquer componente em segundos</h2>
            <p className="text-white/55 leading-relaxed mb-8">
              Digite o Part Number de uma peça e o Assist-Pró consulta automaticamente a base global da Nexar — retornando fabricante, descrição técnica e especificações sem que você precise digitar nada manualmente.
            </p>
            <ul className="space-y-3">
              {["Elimina erros de cadastro por digitação", "Acelera o lançamento de peças no estoque", "Rastreia compatibilidade com modelos de equipamentos", "Base atualizada com milhões de componentes eletrônicos"].map(b => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/65">
                  <span className="text-[#C4733A] font-bold mt-0.5 flex-shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
          </div>
          <NexarDemo />
        </div>
      </section>

      {/* ══ [6] FINANCEIRO ══════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-[#111827]">
        <div ref={sFinanceiro.ref} className={`max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center transition-all duration-700 ${sFinanceiro.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* DRE Mockup */}
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">DRE — Abril 2025</span>
              <span className="text-xs text-white/35 bg-white/5 px-2 py-0.5 rounded">Mensal</span>
            </div>
            {[
              { label: "Receita Bruta", value: "R$ 24.800", cls: "text-green-400" },
              { label: "Custo das Peças", value: "− R$ 6.200", cls: "text-red-400" },
              { label: "Despesas Operacionais", value: "− R$ 4.100", cls: "text-red-400" },
              { label: "Comissões Técnicos", value: "− R$ 2.480", cls: "text-red-400" },
              { label: "Resultado Líquido", value: "R$ 12.020", cls: "text-[#E8C547] font-bold" },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-white/55">{row.label}</span>
                <span className={`text-sm ${row.cls}`}>{row.value}</span>
              </div>
            ))}
            <div className="mt-3 bg-[#1B4F8A]/10 border border-[#1B4F8A]/20 rounded-lg p-3 text-center">
              <p className="text-xs text-white/35">Margem líquida</p>
              <p className="text-2xl font-bold text-[#E8C547]">48,5%</p>
            </div>
          </div>
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#1B4F8A]/20 border border-[#1B4F8A]/40 text-[#7eb3f5] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wider">
              ✦ GESTÃO FINANCEIRA PROFISSIONAL
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Saiba exatamente onde está o dinheiro da sua empresa</h2>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                { icon: "📥", title: "Contas a Receber", desc: "Controle de pagamentos de OS e cobranças avulsas" },
                { icon: "📤", title: "Contas a Pagar", desc: "Fornecedores, despesas fixas e variáveis com vencimento" },
                { icon: "📈", title: "DRE Gerencial", desc: "Receita, custos, despesas e resultado líquido do período" },
                { icon: "🏦", title: "Contas Bancárias", desc: "Saldo por conta, importação de extrato OFX/CSV" },
              ].map(c => (
                <div key={c.title} className="bg-[#161b22] border border-white/5 rounded-xl p-4">
                  <span className="text-xl mb-2 block">{c.icon}</span>
                  <p className="text-sm font-semibold text-white mb-1">{c.title}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ [7] PREÇOS ══════════════════════════════════════════════════════ */}
      <section id="precos" className="py-20 px-4 sm:px-6">
        <div ref={sPrecos.ref} className={`max-w-5xl mx-auto transition-all duration-700 ${sPrecos.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12">
            <p className="text-xs text-[#C4733A] font-semibold tracking-widest uppercase mb-2">Planos</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Escolha o plano ideal para sua assistência</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {plans.map(p => (
              <div key={p.name} className={`relative rounded-2xl p-6 flex flex-col ${p.highlight ? "bg-[#1B4F8A]/20 border-2 border-[#1B4F8A] shadow-xl shadow-[#1B4F8A]/20 sm:scale-[1.03]" : "bg-[#161b22] border border-white/10"}`}>
                {p.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#C4733A] text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</div>
                )}
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold">{p.price}</span>
                  <span className="text-sm text-white/45">{p.period}</span>
                </div>
                {p.sub && <p className="text-xs text-white/35 mb-4">{p.sub}</p>}
                <ul className="space-y-2 mb-6 flex-1 mt-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/65">
                      <span className="text-[#C4733A] mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={handleCTA} className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${p.ctaClass}`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-white/35 mt-6">Todos os planos incluem 14 dias de teste gratuito. Sem cartão de crédito para começar.</p>
        </div>
      </section>

      {/* ══ [8] DEPOIMENTOS ═════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a0f16]">
        <div ref={sDepo.ref} className={`max-w-5xl mx-auto transition-all duration-700 ${sDepo.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-12">
            <p className="text-xs text-[#C4733A] font-semibold tracking-widest uppercase mb-2">Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Assistências técnicas que já usam o Assist-Pró</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-[#161b22] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                <div className="text-[#E8C547] text-base">★★★★★</div>
                <p className="text-sm text-white/65 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/35">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-4 sm:px-6">
        <div ref={sFaq.ref} className={`max-w-3xl mx-auto transition-all duration-700 ${sFaq.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-10">
            <p className="text-xs text-[#C4733A] font-semibold tracking-widest uppercase mb-2">FAQ</p>
            <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ══ REVENDEDORES ════════════════════════════════════════════════════ */}
      <section id="revendedores" className="py-20 px-4 sm:px-6 bg-[#0a0f16]">
        <div ref={sRevenda.ref} className={`max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start transition-all duration-700 ${sRevenda.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-[#E8C547]/10 border border-[#E8C547]/30 text-[#E8C547] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wider">
              ✦ PROGRAMA DE REVENDEDORES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Revenda o Assist-Pró e gere renda recorrente</h2>
            <p className="text-white/55 leading-relaxed mb-6">
              Seja um revendedor autorizado e ganhe comissão recorrente por cada assistência técnica que você indicar. Ideal para consultores de TI, técnicos e agências.
            </p>
            <ul className="space-y-3">
              {["Comissão recorrente mensal", "Material de vendas e suporte técnico", "Painel de acompanhamento de indicações", "Sem custo para começar"].map(b => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/65">
                  <span className="text-[#E8C547] font-bold mt-0.5 flex-shrink-0">✓</span>{b}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#161b22] border border-white/10 rounded-2xl p-6">
            {!revendaSuccess ? (
              <>
                <h3 className="text-lg font-bold text-white mb-4">Quero ser revendedor</h3>
                <form onSubmit={handleRevendaSubmit} className="space-y-3">
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">Nome completo *</Label>
                    <Input placeholder="Seu nome" value={revendaForm.nome} onChange={e => setRevendaForm(p => ({ ...p, nome: e.target.value }))}
                      className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">E-mail *</Label>
                    <Input type="email" placeholder="seu@email.com" value={revendaForm.email} onChange={e => setRevendaForm(p => ({ ...p, email: e.target.value }))}
                      className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/50 mb-1 block">WhatsApp *</Label>
                      <Input placeholder="(11) 99999-9999" value={revendaForm.whatsapp} onChange={e => setRevendaForm(p => ({ ...p, whatsapp: e.target.value }))}
                        className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50 mb-1 block">Cidade *</Label>
                      <Input placeholder="São Paulo" value={revendaForm.cidade} onChange={e => setRevendaForm(p => ({ ...p, cidade: e.target.value }))}
                        className="bg-[#0d1117] border-white/10 text-white placeholder:text-white/20" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">Estado *</Label>
                    <select value={revendaForm.estado} onChange={e => setRevendaForm(p => ({ ...p, estado: e.target.value }))}
                      className="w-full h-10 px-3 rounded-md text-sm bg-[#0d1117] border border-white/10 text-white">
                      <option value="">Selecione o estado</option>
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">Área de atuação *</Label>
                    <select value={revendaForm.atuacao} onChange={e => setRevendaForm(p => ({ ...p, atuacao: e.target.value as typeof revendaForm.atuacao }))}
                      className="w-full h-10 px-3 rounded-md text-sm bg-[#0d1117] border border-white/10 text-white">
                      <option value="assistencia_tecnica">Assistência Técnica</option>
                      <option value="consultor_ti">Consultor de TI</option>
                      <option value="revendedor_software">Revendedor de Software</option>
                      <option value="agencia_marketing">Agência de Marketing</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-white/50 mb-1 block">Mensagem (opcional)</Label>
                    <textarea value={revendaForm.mensagem} onChange={e => setRevendaForm(p => ({ ...p, mensagem: e.target.value }))}
                      placeholder="Conte um pouco sobre sua experiência..." rows={3}
                      className="w-full px-3 py-2 rounded-md text-sm resize-none bg-[#0d1117] border border-white/10 text-white placeholder:text-white/20" />
                  </div>
                  <button type="submit" disabled={registerRevenda.isPending}
                    className="w-full bg-[#E8C547] hover:bg-[#d4b03e] disabled:opacity-60 text-[#0d1117] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    {registerRevenda.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                    Quero ser revendedor
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Interesse registrado!</h3>
                <p className="text-sm text-white/50">Entraremos em contato em breve.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ [9] CTA FINAL ═══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4F8A]/25 via-[#0d1117] to-[#C4733A]/15 pointer-events-none" />
        <div ref={sCta.ref} className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${sCta.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Sua assistência técnica merece uma gestão profissional
          </h2>
          <p className="text-white/55 text-lg mb-8">Comece hoje. Configure em minutos. Resultados desde o primeiro dia.</p>
          <button onClick={handleCTA}
            className="inline-flex items-center gap-2 bg-[#C4733A] hover:bg-[#b5672f] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-[#C4733A]/20">
            Criar minha conta grátis →
          </button>
          <p className="text-xs text-white/25 mt-4">✦ 14 dias grátis · Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </section>

      {/* ══ [10] FOOTER ═════════════════════════════════════════════════════ */}
      <footer id="contato" className="border-t border-white/5 bg-[#0a0f16] py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-2">
                <span className="w-7 h-7 rounded-lg bg-[#1B4F8A] flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-white" />
                </span>
                Assist<span className="text-[#C4733A]">-Pró</span>
              </div>
              <p className="text-xs text-white/35 leading-relaxed">Gestão inteligente para assistências técnicas</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Links</p>
              <div className="space-y-2">
                {[["Funcionalidades", "#funcionalidades"], ["Preços", "#precos"], ["FAQ", "#faq"]].map(([label, href]) => (
                  <a key={label} href={href} className="block text-sm text-white/35 hover:text-white/65 transition-colors">{label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Contato</p>
              <a href="mailto:suporte@assistpro.com.br" className="text-sm text-white/35 hover:text-white/65 transition-colors">suporte@assistpro.com.br</a>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 text-center text-xs text-white/25">
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
