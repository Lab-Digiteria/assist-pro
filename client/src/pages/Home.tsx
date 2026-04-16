import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Smartphone, Wrench, BarChart3, Package, DollarSign,
  Users, Shield, CheckCircle, ChevronDown, ChevronUp,
  Star, ArrowRight, Clock, AlertTriangle, TrendingUp,
  Zap, Menu, X, Eye, EyeOff, Loader2, ClipboardList,
  Settings, Bell,
} from "lucide-react";

// ── Paleta ──────────────────────────────────────────────────────────────────
const BG       = "#0a0a0a";
const CARD_BG  = "#141414";
const BORDER   = "rgba(255,255,255,0.08)";
const PRIMARY  = "#1B4F8A";
const ACCENT   = "#C4733A";
const YELLOW   = "#E8C547";
const MUTED    = "#6b7280";

// ── Dados ───────────────────────────────────────────────────────────────────
const METRICS = [
  { value: "+500", label: "Assistências ativas" },
  { value: "+12.000", label: "OS abertas/mês" },
  { value: "R$1,8M+", label: "Faturamento gerenciado" },
  { value: "4.9/5", label: "Avaliação média" },
];

const FEATURES = [
  { icon: ClipboardList, badge: "Core", title: "Ordens de Serviço", desc: "Fluxo completo: recebimento, diagnóstico, aprovação, reparo, entrega. Checklist de entrada com 20 itens, histórico de status e prazo de orçamento com alerta visual." },
  { icon: DollarSign, badge: "Destaque", title: "Controle Financeiro", desc: "Caixa diário, lançamentos por forma de pagamento (PIX, cartão, dinheiro), comissões automáticas por técnico e categoria, e exportação CSV." },
  { icon: Smartphone, badge: "Novo", title: "Gestão de Equipamentos", desc: "Cadastro por categoria com validação de IMEI para smartphones e tablets, número de série, cor, capacidade e vínculo com cliente." },
  { icon: Package, badge: null, title: "Estoque Inteligente", desc: "Saída automática de peças ao concluir OS, alertas de estoque mínimo, movimentações rastreadas e código auto-gerado PÇ-NNNNNN." },
  { icon: BarChart3, badge: null, title: "Dashboard e Relatórios", desc: "Alertas críticos em tempo real, OS por status, faturamento do dia e do mês, breakdown por forma de pagamento e exportação em CSV." },
  { icon: Users, badge: null, title: "Multi-tenancy e Equipe", desc: "Cada assistência tem ambiente isolado. Gerencie técnicos, roles (gerente, técnico, visualizador) e permissões por perfil." },
];

const STEPS = [
  { num: "01", title: "Preencha o formulário", desc: "Nome, e-mail, empresa, CPF/CNPJ e WhatsApp. Leva menos de 1 minuto. Nenhum cartão de crédito necessário." },
  { num: "02", title: "Acesse imediatamente", desc: "Sua conta é criada na hora. Sistema completo disponível em segundos, com 14 dias de trial gratuito." },
  { num: "03", title: "Configure e comece a usar", desc: "Cadastre técnicos, configure comissões, abra sua primeira OS com checklist inteligente e controle financeiro completo." },
];

const TESTIMONIALS = [
  { name: "Marcos Andrade", company: "TechFix Assistência — SP", stars: 5, text: "\"O checklist de entrada mudou tudo. Agora registro a condição do aparelho antes de começar. Acabaram as reclamações de danos que já existiam. E o controle de caixa me mostra exatamente quanto entrou e saiu.\"" },
  { name: "Fernanda Costa", company: "FC Eletrônicos — RJ", stars: 5, text: "\"O controle financeiro é completo. Caixa diário, comissões automáticas, formas de pagamento — tudo integrado. O relatório mensal me ajudou a descobrir que estava perdendo dinheiro em peças sem perceber.\"" },
  { name: "Ricardo Lemos", company: "Lemos Tech — MG", stars: 5, text: "\"Meus técnicos adoraram o sistema de comissões. Agora eles sabem em tempo real quanto vão receber. Reduziu os conflitos e aumentou a produtividade da equipe consideravelmente.\"" },
];

const FAQS = [
  { q: "Posso usar em mais de uma assistência técnica?", a: "Sim! O Assist-Pró é multi-tenant: cada assistência tem seu ambiente completamente isolado, com dados, equipe e configurações independentes." },
  { q: "O trial de 14 dias exige cartão de crédito?", a: "Não. Você começa a usar imediatamente sem precisar cadastrar nenhum meio de pagamento. Só pedimos CPF/CNPJ e WhatsApp para contato." },
  { q: "Como funciona o cálculo de comissão dos técnicos?", a: "Você configura o percentual por técnico e por categoria de equipamento. Ao marcar a OS como concluída, o sistema calcula e registra a comissão automaticamente." },
  { q: "O sistema funciona no celular?", a: "Sim. O Assist-Pró é totalmente responsivo e funciona em qualquer dispositivo — computador, tablet ou smartphone." },
  { q: "Posso migrar meus dados de outro sistema?", a: "Nossa equipe oferece suporte para importação de dados. Entre em contato pelo WhatsApp para verificar a compatibilidade com seu sistema atual." },
];

// ── Componente principal ─────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [trialForm, setTrialForm] = useState({ name: "", email: "", password: "", companyName: "", phone: "", document: "" });
  const [trialSuccess, setTrialSuccess] = useState(false);

  const registerTrial = trpc.lead.register.useMutation({
    onSuccess: (data) => {
      setTrialSuccess(true);
      toast.success(`Bem-vindo! Seu trial de ${data.trialDays} dias começou agora.`);
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCTA = () => {
    if (isAuthenticated) navigate("/dashboard");
    else document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, companyName, phone, document } = trialForm;
    if (!name || !email || !password || !companyName || !phone || !document) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    registerTrial.mutate({ name, email, password, companyName, phone, document, source: "landing" });
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: BG, color: "#e2e8f0" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(12px)", borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}>
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Assist-Pró</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: MUTED }}>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} style={{ background: PRIMARY }} className="text-white">
                Acessar Sistema
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-sm" style={{ color: MUTED }} onClick={() => navigate("/login")}>Entrar</Button>
                <Button onClick={handleCTA} className="text-white font-semibold" style={{ background: ACCENT }}>
                  Testar grátis
                </Button>
              </>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t px-4 py-4 space-y-3" style={{ background: "#111", borderColor: BORDER }}>
            <a href="#funcionalidades" className="block text-sm" style={{ color: MUTED }}>Funcionalidades</a>
            <a href="#como-funciona" className="block text-sm" style={{ color: MUTED }}>Como funciona</a>
            <a href="#depoimentos" className="block text-sm" style={{ color: MUTED }}>Depoimentos</a>
            <a href="#precos" className="block text-sm" style={{ color: MUTED }}>Preços</a>
            <a href="#faq" className="block text-sm" style={{ color: MUTED }}>FAQ</a>
            <Button onClick={handleCTA} className="w-full text-white" style={{ background: ACCENT }}>Testar grátis</Button>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Texto */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border" style={{ background: `${ACCENT}18`, borderColor: `${ACCENT}40`, color: ACCENT }}>
              <Zap className="w-3 h-3" /> Sistema completo para assistências técnicas
            </div>
            <h1 className="font-black leading-[1.05] mb-6 text-white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900 }}>
              Sua assistência<br />
              <span style={{ color: YELLOW }}>organizada</span> e<br />
              lucrativa
            </h1>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: MUTED }}>
              Controle de OS com checklist, estoque, financeiro, comissões e caixa em um único sistema. Do recebimento do equipamento ao encerramento — tudo automatizado.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              {["Multi-tenancy", "IMEI validado", "Comissão automática", "Caixa diário"].map(tag => (
                <div key={tag} className="flex items-center gap-1.5 text-sm" style={{ color: "#94a3b8" }}>
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {tag}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {["M", "F", "R", "A", "L"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                    style={{ borderColor: BG, background: [PRIMARY, ACCENT, "#7c3aed", "#059669", "#dc2626"][i] }}>
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: YELLOW }} />)}
                </div>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>+500 assistências já usam</p>
              </div>
            </div>
          </div>

          {/* Formulário de cadastro */}
          <div id="cadastro" className="rounded-2xl p-7 border shadow-2xl" style={{ background: CARD_BG, borderColor: BORDER }}>
            {!trialSuccess ? (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Comece seu trial gratuito</h2>
                <p className="text-sm mb-5" style={{ color: MUTED }}>Preencha abaixo e tenha acesso imediato ao sistema completo.</p>
                <form onSubmit={handleTrialSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs" style={{ color: MUTED }}>Nome completo *</Label>
                      <Input placeholder="João Silva" value={trialForm.name}
                        onChange={e => setTrialForm({ ...trialForm, name: e.target.value })}
                        className="border text-white placeholder:text-gray-600"
                        style={{ background: "#0f1117", borderColor: "#1e2535" }} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs" style={{ color: MUTED }}>Nome da empresa *</Label>
                      <Input placeholder="Brito Assistência Técnica" value={trialForm.companyName}
                        onChange={e => setTrialForm({ ...trialForm, companyName: e.target.value })}
                        className="border text-white placeholder:text-gray-600"
                        style={{ background: "#0f1117", borderColor: "#1e2535" }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: MUTED }}>CPF ou CNPJ *</Label>
                      <Input placeholder="000.000.000-00" value={trialForm.document}
                        onChange={e => setTrialForm({ ...trialForm, document: e.target.value })}
                        className="border text-white placeholder:text-gray-600"
                        style={{ background: "#0f1117", borderColor: "#1e2535" }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" style={{ color: MUTED }}>WhatsApp *</Label>
                      <Input placeholder="(11) 99999-9999" value={trialForm.phone}
                        onChange={e => setTrialForm({ ...trialForm, phone: e.target.value })}
                        className="border text-white placeholder:text-gray-600"
                        style={{ background: "#0f1117", borderColor: "#1e2535" }} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs" style={{ color: MUTED }}>E-mail *</Label>
                      <Input type="email" placeholder="joao@empresa.com" value={trialForm.email}
                        onChange={e => setTrialForm({ ...trialForm, email: e.target.value })}
                        className="border text-white placeholder:text-gray-600"
                        style={{ background: "#0f1117", borderColor: "#1e2535" }} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs" style={{ color: MUTED }}>Senha *</Label>
                      <div className="relative">
                        <Input type={showPw ? "text" : "password"} placeholder="Mínimo 6 caracteres"
                          value={trialForm.password} className="border text-white placeholder:text-gray-600 pr-10"
                          style={{ background: "#0f1117", borderColor: "#1e2535" }}
                          onChange={e => setTrialForm({ ...trialForm, password: e.target.value })} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }}
                          onClick={() => setShowPw(!showPw)}>
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full py-5 font-semibold text-base rounded-xl text-white mt-2"
                    style={{ background: ACCENT }} disabled={registerTrial.isPending}>
                    {registerTrial.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</>
                      : <>Começar agora — grátis por 14 dias <ArrowRight className="ml-2 w-4 h-4" /></>}
                  </Button>
                  <p className="text-xs text-center mt-2" style={{ color: MUTED }}>
                    Sem cartão de crédito · Acesso imediato · Cancele quando quiser
                  </p>
                  <p className="text-xs text-center" style={{ color: "#475569" }}>
                    Já tem conta?{" "}
                    <button type="button" className="underline" style={{ color: PRIMARY }}
                      onClick={() => navigate("/login")}>Entrar</button>
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-white">Conta criada com sucesso!</p>
                <p className="text-sm mt-2" style={{ color: MUTED }}>Redirecionando para o dashboard...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ───────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 border-y" style={{ borderColor: BORDER }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-widest mb-8 uppercase" style={{ color: MUTED }}>
            Confiado por assistências técnicas em todo o Brasil
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {METRICS.map((m, i) => (
              <div key={i}>
                <p className="text-3xl font-extrabold text-white mb-1">{m.value}</p>
                <p className="text-sm" style={{ color: MUTED }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tudo que sua assistência precisa</h2>
            <p className="text-lg" style={{ color: MUTED }}>Módulos integrados que funcionam juntos do primeiro ao último passo.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl p-6 border hover:border-white/20 transition-colors group"
                style={{ background: CARD_BG, borderColor: BORDER }}>
                {f.badge && (
                  <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3"
                    style={{ background: `${ACCENT}20`, color: ACCENT }}>{f.badge}</span>
                )}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${PRIMARY}20` }}>
                  <f.icon className="w-5 h-5" style={{ color: PRIMARY }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCREENSHOT MOCKUP ──────────────────────────────────────────────── */}
      <section id="como-funciona-preview" className="py-20 px-4 border-y" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: PRIMARY }}>Veja como funciona na prática</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Interface moderna e intuitiva</h2>
            <p className="text-lg" style={{ color: MUTED }}>Pensada para o dia a dia da assistência técnica — rápida, clara e sem complicação.</p>
          </div>
          {/* App mockup */}
          <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ borderColor: BORDER }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: "#111", borderColor: BORDER }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs" style={{ background: "#1a1a1a", color: MUTED }}>
                app.assistpro.com.br/dashboard
              </div>
            </div>
            {/* Fake dashboard */}
            <div className="flex" style={{ background: "#0d1117", minHeight: "360px" }}>
              {/* Sidebar */}
              <div className="w-48 border-r p-4 hidden md:block" style={{ borderColor: BORDER }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: PRIMARY }}>
                    <Wrench className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-bold text-white">Assist-Pró</span>
                </div>
                {[
                  { icon: BarChart3, label: "Dashboard", active: true },
                  { icon: ClipboardList, label: "Ordens de Serviço", active: false },
                  { icon: Smartphone, label: "Equipamentos", active: false },
                  { icon: Package, label: "Estoque", active: false },
                  { icon: DollarSign, label: "Caixa", active: false },
                  { icon: Users, label: "Clientes", active: false },
                  { icon: Settings, label: "Configurações", active: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-xs"
                    style={{ background: item.active ? `${PRIMARY}30` : "transparent", color: item.active ? "#fff" : MUTED }}>
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs mb-1" style={{ color: MUTED }}>Painel de Controle</p>
                    <h3 className="text-lg font-bold text-white">Dashboard</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" style={{ color: MUTED }} />
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: PRIMARY }}>J</div>
                  </div>
                </div>
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "OS Abertas", value: "24", color: PRIMARY },
                    { label: "Faturamento Hoje", value: "R$ 1.840", color: "#22c55e" },
                    { label: "Peças Críticas", value: "3", color: "#ef4444" },
                    { label: "Aguard. Retirada", value: "7", color: YELLOW },
                  ].map((kpi, i) => (
                    <div key={i} className="rounded-xl p-3 border" style={{ background: CARD_BG, borderColor: BORDER }}>
                      <p className="text-xs mb-1" style={{ color: MUTED }}>{kpi.label}</p>
                      <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
                {/* OS list preview */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                  <div className="px-4 py-2 border-b text-xs font-semibold" style={{ background: "#111", borderColor: BORDER, color: MUTED }}>
                    Ordens de Serviço Recentes
                  </div>
                  {[
                    { os: "OS-2025-0042", equip: "iPhone 14 Pro", status: "Em reparo", statusColor: "#3b82f6" },
                    { os: "OS-2025-0041", equip: "Samsung S23", status: "Aguard. aprovação", statusColor: YELLOW },
                    { os: "OS-2025-0040", equip: "Notebook Dell", status: "Pronto p/ retirada", statusColor: "#22c55e" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b text-xs last:border-0" style={{ borderColor: BORDER }}>
                      <span className="font-mono text-white">{row.os}</span>
                      <span style={{ color: MUTED }}>{row.equip}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${row.statusColor}20`, color: row.statusColor }}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Feature bullets */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              { icon: Shield, title: "Dados 100% isolados", desc: "Cada assistência tem seu próprio ambiente seguro. Nenhum outro cliente acessa seus dados." },
              { icon: Zap, title: "Acesso em 5 segundos", desc: "Após o cadastro, sua conta está pronta. Sem espera, sem burocracia. Comece a usar agora." },
              { icon: TrendingUp, title: "Relatórios em tempo real", desc: "Dashboard com alertas críticos, OS por status e faturamento atualizado a cada ação." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${PRIMARY}20` }}>
                  <item.icon className="w-4 h-4" style={{ color: PRIMARY }} />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Simples assim</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">3 passos para começar</h2>
          </div>
          <div className="space-y-6">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6 items-start rounded-2xl p-6 border" style={{ background: CARD_BG, borderColor: BORDER }}>
                <div className="text-4xl font-black flex-shrink-0 leading-none" style={{ color: `${PRIMARY}60` }}>{step.num}</div>
                <div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────────────────── */}
      <section id="depoimentos" className="py-20 px-4 border-y" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Depoimentos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">O que dizem nossos clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-6 border" style={{ background: CARD_BG, borderColor: BORDER }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" style={{ color: YELLOW }} />)}
                </div>
                <p className="text-sm leading-relaxed mb-5 italic" style={{ color: "#94a3b8" }}>{t.text}</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ─────────────────────────────────────────────────────────── */}
      <section id="precos" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Preços</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Planos para cada momento da sua assistência</h2>
            <p className="text-lg" style={{ color: MUTED }}>Comece grátis por 14 dias. Sem cartão de crédito.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Mensal", price: "R$ 99", period: "/mês", highlight: false, badge: null,
                features: ["Todas as funcionalidades", "Suporte por WhatsApp", "Trial de 14 dias", "Atualizações incluídas"] },
              { name: "Anual", price: "R$ 799", period: "/ano", highlight: true, badge: "Mais popular",
                features: ["Tudo do Mensal", "Economia de R$ 389", "Suporte prioritário", "Trial de 14 dias"] },
              { name: "Vitalício", price: "R$ 1.499", period: "único", highlight: false, badge: "Melhor custo",
                features: ["Tudo do Anual", "Pagamento único", "Suporte vitalício", "Sem mensalidades"] },
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 relative border ${plan.highlight ? "shadow-2xl" : ""}`}
                style={{
                  background: plan.highlight ? PRIMARY : CARD_BG,
                  borderColor: plan.highlight ? `${PRIMARY}80` : BORDER,
                  transform: plan.highlight ? "scale(1.03)" : "none",
                }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: YELLOW, color: "#1a1a1a" }}>{plan.badge}</span>
                  </div>
                )}
                <h3 className="font-bold text-lg mb-2 text-white">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm mb-1" style={{ color: plan.highlight ? "#bfdbfe" : MUTED }}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />
                      <span style={{ color: plan.highlight ? "#bfdbfe" : "#94a3b8" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleCTA} className="w-full font-semibold py-5 rounded-xl text-white"
                  style={{ background: plan.highlight ? ACCENT : PRIMARY }}>
                  Começar grátis
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-8" style={{ color: MUTED }}>
            Todos os planos incluem 14 dias de trial grátis. Cancele a qualquer momento.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>FAQ</p>
            <h2 className="text-3xl font-bold text-white">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                <button className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm leading-relaxed border-t pt-4" style={{ color: MUTED, borderColor: BORDER }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: ACCENT }}>14 dias grátis · Sem cartão de crédito</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pronto para organizar sua assistência?</h2>
          <p className="text-lg mb-8" style={{ color: MUTED }}>
            Junte-se a mais de 500 assistências técnicas que já transformaram sua gestão. Acesso imediato, sem burocracia.
          </p>
          <Button size="lg" onClick={handleCTA} className="text-white font-semibold px-10 py-6 text-base rounded-xl"
            style={{ background: ACCENT }}>
            Começar agora — grátis por 14 dias <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 border-t text-sm" style={{ borderColor: BORDER, color: MUTED }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}>
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white">Assist-Pró</span>
          </div>
          <p>© {new Date().getFullYear()} Assist-Pró. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
