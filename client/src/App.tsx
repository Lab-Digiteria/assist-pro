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

// Control Plane — /admin (completamente separado da área do tenant)
import { AdminGuard } from "./components/AdminGuard";
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
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/equipamentos" component={Equipamentos} />
      <Route path="/ordens-servico" component={OrdensServico} />
      <Route path="/ordens-servico/:id" component={OrdemServicoDetalhe} />
      <Route path="/estoque" component={Estoque} />
      <Route path="/caixa" component={Caixa} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/configuracoes" component={Configuracoes} />

      {/* ── Control Plane (/admin) — separado da área do tenant */}
      {/* Acesso restrito a usuários com role=admin via AdminGuard  */}
      <Route path="/admin">{() => <AdminGuard><AdminDashboard /></AdminGuard>}</Route>
      <Route path="/admin/tenants">{() => <AdminGuard><AdminTenants /></AdminGuard>}</Route>
      <Route path="/admin/plans">{() => <AdminGuard><AdminPlans /></AdminGuard>}</Route>
      <Route path="/admin/subscriptions">{() => <AdminGuard><AdminSubscriptions /></AdminGuard>}</Route>
      <Route path="/admin/billing">{() => <AdminGuard><AdminBilling /></AdminGuard>}</Route>
      <Route path="/admin/audit-logs">{() => <AdminGuard><AdminAuditLogs /></AdminGuard>}</Route>
      <Route path="/admin/webhooks">{() => <AdminGuard><AdminWebhooks /></AdminGuard>}</Route>
      <Route path="/admin/leads">{() => <AdminGuard><AdminLeads /></AdminGuard>}</Route>
      <Route path="/admin/communication">{() => <AdminGuard><AdminCommunication /></AdminGuard>}</Route>
      <Route path="/admin/trials">{() => <AdminGuard><AdminTrialMonitor /></AdminGuard>}</Route>
      <Route path="/admin/campaigns">{() => <AdminGuard><AdminEmailCampaigns /></AdminGuard>}</Route>
      <Route path="/admin/resale">{() => <AdminGuard><AdminResale /></AdminGuard>}</Route>
      <Route path="/admin/playbook">{() => <AdminGuard><AdminPlaybook /></AdminGuard>}</Route>

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
