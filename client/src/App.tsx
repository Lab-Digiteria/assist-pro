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

// Control Plane — /admin (completamente separado da área do tenant)
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
      {/* Acesso restrito a usuários com role=admin              */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/tenants" component={AdminTenants} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/billing" component={AdminBilling} />
      <Route path="/admin/audit-logs" component={AdminAuditLogs} />
      <Route path="/admin/webhooks" component={AdminWebhooks} />
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/communication" component={AdminCommunication} />
      <Route path="/admin/trials" component={AdminTrialMonitor} />
      <Route path="/admin/campaigns" component={AdminEmailCampaigns} />
      <Route path="/admin/resale" component={AdminResale} />
      <Route path="/admin/playbook" component={AdminPlaybook} />

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
