import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Smartphone, Tablet, Laptop, Wrench, BarChart3, Package, DollarSign,
  Users, Shield, CheckCircle, ChevronDown, ChevronUp, Star, ArrowRight,
  Clock, AlertTriangle, TrendingUp, Zap, Menu, X, Eye, EyeOff, Loader2
} from "lucide-react";
import { Label } from "@/components/ui/label";

const PRIMARY = "#1B4F8A";
const ACCENT = "#C4733A";
const YELLOW = "#E8C547";

const FEATURES = [
  { icon: Wrench, title: "Ordens de Serviço Inteligentes", desc: "Fluxo completo com checklist de entrada, histórico de status, prazo de orçamento e notificação automática ao cliente." },
  { icon: Smartphone, title: "Gestão de Equipamentos", desc: "Cadastro por categoria (smartphone, tablet, notebook...) com validação de IMEI, número de série e vínculo com cliente." },
  { icon: Package, title: "Controle de Estoque", desc: "Saída automática de peças ao concluir OS, alertas de estoque mínimo e movimentações rastreadas." },
  { icon: DollarSign, title: "Financeiro Completo", desc: "Caixa, lançamentos por forma de pagamento, comissões automáticas por técnico e categoria de equipamento." },
  { icon: BarChart3, title: "Dashboard e Relatórios", desc: "Alertas críticos, OS por status, faturamento do dia/mês e exportação em CSV para análise externa." },
  { icon: Users, title: "Multi-tenancy e Equipe", desc: "Cada assistência tem seu ambiente isolado. Gerencie técnicos, roles e permissões por perfil." },
];

const FAQS = [
  { q: "Posso usar em mais de uma assistência técnica?", a: "Sim! O Assist-Pró é multi-tenant: cada assistência tem seu ambiente completamente isolado, com dados, equipe e configurações independentes." },
  { q: "O trial de 14 dias exige cartão de crédito?", a: "Não. Você começa a usar imediatamente sem precisar cadastrar nenhum meio de pagamento. Só pedimos CPF/CNPJ e WhatsApp para contato." },
  { q: "Como funciona o cálculo de comissão dos técnicos?", a: "Você configura o percentual por técnico e por categoria de equipamento. Ao marcar a OS como concluída, o sistema calcula e registra a comissão automaticamente." },
  { q: "O sistema funciona no celular?", a: "Sim. O Assist-Pró é totalmente responsivo e funciona em qualquer dispositivo — computador, tablet ou smartphone." },
  { q: "Posso migrar meus dados de outro sistema?", a: "Nossa equipe oferece suporte para importação de dados. Entre em contato pelo WhatsApp para verificar a compatibilidade com seu sistema atual." },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [trialForm, setTrialForm] = useState({
    name: "", email: "", password: "",
    companyName: "", phone: "", document: "",
  });
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
    <div className="min-h-screen bg-white font-sans">
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: PRIMARY }}>
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: PRIMARY }}>Assist-Pró</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#funcionalidades" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-gray-900 transition-colors">Preços</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} style={{ background: PRIMARY }}>
                Acessar Sistema
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-sm" onClick={() => navigate("/login")}>Entrar</Button>
                <Button onClick={handleCTA} style={{ background: ACCENT }} className="text-white">
                  Começar grátis
                </Button>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
            <a href="#funcionalidades" className="block text-sm text-gray-600">Funcionalidades</a>
            <a href="#precos" className="block text-sm text-gray-600">Preços</a>
            <a href="#faq" className="block text-sm text-gray-600">FAQ</a>
            <Button onClick={handleCTA} className="w-full" style={{ background: ACCENT }}>Começar grátis</Button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="pt-24 pb-20 px-4" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #2563a8 60%, #1e3a5f 100%)` }}>
        <div className="max-w-5xl mx-auto text-center text-white">
          <Badge className="mb-4 text-xs font-medium px-3 py-1" style={{ background: YELLOW, color: "#1a1a1a" }}>
            14 dias grátis · Sem cartão de crédito
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Gestão completa para<br />
            <span style={{ color: YELLOW }}>assistências técnicas</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Do recebimento do equipamento ao encerramento da OS — controle de ordens de serviço, estoque, financeiro e comissões em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleCTA} className="text-base font-semibold px-8 py-6 rounded-xl shadow-lg"
              style={{ background: ACCENT, color: "white" }}>
              Começar 14 dias grátis <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base font-semibold px-8 py-6 rounded-xl border-white/40 text-white bg-white/10 hover:bg-white/20">
              Ver demonstração
            </Button>
          </div>
          <div className="flex justify-center gap-8 mt-12 text-blue-200 text-sm">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />Multi-tenancy</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />IMEI validado</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />Comissão automática</div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Você ainda gerencia sua assistência em planilhas?
          </h2>
          <p className="text-gray-500 text-lg mb-10">Isso custa caro — em tempo, erros e clientes perdidos.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Clock, color: "text-red-500", bg: "bg-red-50", title: "Prazo perdido", desc: "Sem controle de prazo, o cliente liga antes de você lembrar." },
              { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", title: "Peça em falta", desc: "Você só descobre que o estoque acabou quando já prometeu ao cliente." },
              { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50", title: "Comissão errada", desc: "Calcular comissão manualmente gera conflito com a equipe todo mês." },
            ].map((item, i) => (
              <div key={i} className={`rounded-xl p-6 ${item.bg}`}>
                <item.icon className={`w-8 h-8 ${item.color} mb-3`} />
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tudo que sua assistência precisa</h2>
            <p className="text-gray-500 text-lg">Módulos integrados que funcionam juntos do primeiro ao último passo.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${PRIMARY}15` }}>
                    <f.icon className="w-6 h-6" style={{ color: PRIMARY }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ── */}
      <section id="precos" className="py-20 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planos simples, sem surpresas</h2>
            <p className="text-gray-500 text-lg">Todos os planos incluem 14 dias de trial gratuito.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Mensal", price: "R$ 99", period: "/mês", highlight: false, badge: null, features: ["Todas as funcionalidades", "Suporte por WhatsApp", "Trial de 14 dias", "Atualizações incluídas"] },
              { name: "Anual", price: "R$ 799", period: "/ano", highlight: true, badge: "Mais popular", features: ["Tudo do Mensal", "Economia de R$ 389", "Suporte prioritário", "Trial de 14 dias"] },
              { name: "Vitalício", price: "R$ 1.499", period: "único", highlight: false, badge: "Melhor custo", features: ["Tudo do Anual", "Pagamento único", "Suporte vitalício", "Sem mensalidades"] },
            ].map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 relative ${plan.highlight ? "shadow-2xl scale-105" : "shadow-md"}`}
                style={{ background: plan.highlight ? PRIMARY : "white", color: plan.highlight ? "white" : "inherit" }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1 text-xs font-semibold" style={{ background: YELLOW, color: "#1a1a1a" }}>{plan.badge}</Badge>
                  </div>
                )}
                <h3 className={`font-bold text-lg mb-2 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-green-300" : "text-green-500"}`} />
                      <span className={plan.highlight ? "text-blue-100" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleCTA} className="w-full font-semibold py-5 rounded-xl"
                  style={{ background: plan.highlight ? ACCENT : PRIMARY, color: "white" }}>
                  Começar grátis
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #1e3a5f 100%)` }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <Zap className="w-12 h-12 mx-auto mb-4" style={{ color: YELLOW }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para organizar sua assistência?</h2>
          <p className="text-blue-200 text-lg mb-8">Comece agora com 14 dias grátis. Sem cartão de crédito.</p>
          {!trialSuccess ? (
            <form id="cadastro" onSubmit={handleTrialSubmit}
              className="bg-white rounded-2xl p-6 max-w-lg mx-auto text-left shadow-2xl">
              <h3 className="text-xl font-bold mb-1" style={{ color: PRIMARY }}>Criar conta grátis</h3>
              <p className="text-sm text-gray-500 mb-5">14 dias de trial · Sem cartão de crédito</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-gray-700 text-xs">Nome completo *</Label>
                  <Input placeholder="João Silva" value={trialForm.name}
                    onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })} required />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-gray-700 text-xs">Nome da empresa *</Label>
                  <Input placeholder="Brito Assistência Técnica" value={trialForm.companyName}
                    onChange={(e) => setTrialForm({ ...trialForm, companyName: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-700 text-xs">CPF ou CNPJ *</Label>
                  <Input placeholder="000.000.000-00" value={trialForm.document}
                    onChange={(e) => setTrialForm({ ...trialForm, document: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-700 text-xs">WhatsApp *</Label>
                  <Input placeholder="(11) 99999-9999" value={trialForm.phone}
                    onChange={(e) => setTrialForm({ ...trialForm, phone: e.target.value })} required />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-gray-700 text-xs">E-mail *</Label>
                  <Input type="email" placeholder="joao@empresa.com" value={trialForm.email}
                    onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })} required />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-gray-700 text-xs">Senha *</Label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} placeholder="Mínimo 6 caracteres"
                      value={trialForm.password} className="pr-10"
                      onChange={(e) => setTrialForm({ ...trialForm, password: e.target.value })} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full mt-4 py-5 font-semibold text-base rounded-xl"
                style={{ background: ACCENT }} disabled={registerTrial.isPending}>
                {registerTrial.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</>
                  : "Começar 14 dias grátis"}
              </Button>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Já tem conta?{" "}
                <button type="button" className="underline" style={{ color: PRIMARY }}
                  onClick={() => navigate("/login")}>Entrar</button>
              </p>
            </form>
          ) : (
            <div className="bg-white/10 rounded-2xl p-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-semibold">Conta criada com sucesso!</p>
              <p className="text-blue-200 text-sm mt-2">Redirecionando para o dashboard...</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 bg-gray-900 text-gray-400 text-sm">
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
