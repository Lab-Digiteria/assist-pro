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
import AdminPanel from "./pages/AdminPanel";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Planos from "./pages/Planos";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      {/* Auth */}
      <Route path="/login" component={Login} />
      {/* Onboarding */}
      <Route path="/onboarding" component={Onboarding} />
      {/* Planos */}
      <Route path="/planos" component={Planos} />
      {/* App */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/equipamentos" component={Equipamentos} />
      <Route path="/ordens-servico" component={OrdensServico} />
      <Route path="/ordens-servico/:id" component={OrdemServicoDetalhe} />
      <Route path="/estoque" component={Estoque} />
      <Route path="/caixa" component={Caixa} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/configuracoes" component={Configuracoes} />
      {/* Admin */}
      <Route path="/admin" component={AdminPanel} />
      {/* 404 */}
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
