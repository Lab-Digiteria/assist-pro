import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Equipamentos from "./pages/Equipamentos";
import OrdensServico from "./pages/OrdensServico";
import OrdemServicoDetalhe from "./pages/OrdemServicoDetalhe";
import Estoque from "./pages/Estoque";
import Caixa from "./pages/Caixa";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Planos from "./pages/Planos";
import AreaCliente from "./pages/AreaCliente";

// Control Plane — /super-admin (completamente isolado da área do tenant)
// Acesso exclusivo via URL direta. Nunca aparece na navegação do tenant.
import { SuperAdminGuard } from "./components/SuperAdminGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminCommunication from "./pages/admin/AdminCommunication";
import AdminTrialMonitor from "./pages/admin/AdminTrialMonitor";
import AdminEmailCampaigns from "./pages/admin/AdminEmailCampaigns";
import AdminResale from "./pages/admin/AdminResale";
import AdminPlaybook from "./pages/admin/AdminPlaybook";
import AdminRevendedores from "./pages/admin/AdminRevendedores";

function Router() {
  return (
    <Switch>
      {/* ── Público ─────────────────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/planos" component={Planos} />

      {/* ── Área do Cliente (público, sem auth) ──────────── */}
      <Route path="/cliente/os/:token" component={AreaCliente} />

      {/* ── Onboarding ──────────────────────────────────────── */}
      <Route path="/onboarding" component={Onboarding} />

      {/* ── App (área do tenant) ────────────────────────────── */}
      {/* Nenhum link para /super-admin aqui — área completamente isolada */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/equipamentos" component={Equipamentos} />
      <Route path="/ordens-servico" component={OrdensServico} />
      <Route path="/ordens-servico/:id" component={OrdemServicoDetalhe} />
      <Route path="/estoque" component={Estoque} />
      <Route path="/caixa" component={Caixa} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/configuracoes" component={Configuracoes} />

      {/* ── Control Plane (/super-admin) — ISOLADO da área do tenant ── */}
      {/* Acesso via URL direta apenas. Guard verifica isPlatformAdmin=true. */}
      {/* Tenants são redirecionados para /dashboard mesmo digitando a URL. */}
      <Route path="/super-admin">{() => <SuperAdminGuard><AdminDashboard /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/tenants">{() => <SuperAdminGuard><AdminTenants /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/plans">{() => <SuperAdminGuard><AdminPlans /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/subscriptions">{() => <SuperAdminGuard><AdminSubscriptions /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/billing">{() => <SuperAdminGuard><AdminBilling /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/audit-logs">{() => <SuperAdminGuard><AdminAuditLogs /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/webhooks">{() => <SuperAdminGuard><AdminWebhooks /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/leads">{() => <SuperAdminGuard><AdminLeads /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/communication">{() => <SuperAdminGuard><AdminCommunication /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/trials">{() => <SuperAdminGuard><AdminTrialMonitor /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/campaigns">{() => <SuperAdminGuard><AdminEmailCampaigns /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/resale">{() => <SuperAdminGuard><AdminResale /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/revendedores">{() => <SuperAdminGuard><AdminRevendedores /></SuperAdminGuard>}</Route>
      <Route path="/super-admin/playbook">{() => <SuperAdminGuard><AdminPlaybook /></SuperAdminGuard>}</Route>

      {/* ── 404 ─────────────────────────────────────────────── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
