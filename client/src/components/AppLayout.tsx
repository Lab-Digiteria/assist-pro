import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { SubscriptionGuard } from "./SubscriptionGuard";
import { TrialBanner } from "./TrialBanner";
import { ImpersonationBanner } from "./ImpersonationBanner";
import {
  BarChart3,
  Box,
  ChevronLeft,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingCart,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
  BookOpen,
  ArrowDownCircle,
  ArrowUpCircle,
  LineChart,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/equipamentos", label: "Equipamentos", icon: Smartphone },
  { href: "/estoque", label: "Estoque", icon: Box, exact: true },
  { href: "/estoque/lista-compras", label: "Lista de Compras", icon: ShoppingCart, indent: true },
  { href: "/caixa", label: "Caixa", icon: CreditCard },
];

const financeiroItems = [
  { href: "/financeiro", label: "Dashboard Financeiro", icon: Wallet, exact: true },
  { href: "/financeiro/contas-receber", label: "A Receber", icon: ArrowDownCircle },
  { href: "/financeiro/contas-pagar", label: "A Pagar", icon: ArrowUpCircle },
  { href: "/financeiro/fluxo-caixa", label: "Fluxo de Caixa", icon: LineChart },
  { href: "/financeiro/dre", label: "DRE", icon: BarChart3 },
  { href: "/financeiro/plano-contas", label: "Plano de Contas", icon: BookOpen },
];

const bottomNavItems = [
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => (window.location.href = "/"),
  });
  const { data: tenant } = trpc.tenants.mine.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Redirect to onboarding if no tenant
  if (tenant === null && !loading) {
    window.location.href = "/onboarding";
    return null;
  }

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  const isFinanceiroActive = location.startsWith("/financeiro");
  const [financeiroOpen, setFinanceiroOpen] = useState(isFinanceiroActive);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#C4733A" }}>
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">Assist-Pró</span>
        </Link>
        {tenant && (
          <p className="text-xs text-sidebar-foreground/60 mt-1 truncate">{tenant.name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? location === item.href : location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                item.indent && "pl-7",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Financeiro — grupo colapsável */}
        <div>
          <button
            onClick={() => setFinanceiroOpen(v => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isFinanceiroActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Wallet className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Financeiro</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", financeiroOpen && "rotate-180")} />
          </button>
          {financeiroOpen && (
            <div className="mt-1 space-y-0.5">
              {financeiroItems.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? location === item.href : location === item.href || location.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Painel Admin removido do menu do tenant.
             Acesso ao Control Plane exclusivamente via /super-admin (URL direta). */}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => logout.mutate()}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col">
            <button
              className="absolute top-4 right-4 text-sidebar-foreground/60"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Impersonation Banner — exibido quando admin acessa como tenant */}
        <ImpersonationBanner />
        {/* Trial Banner */}
        <TrialBanner />

        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-white">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">{title ?? "Assist-Pró"}</span>
        </header>

        {/* Page Content — bloqueado se subscription inativa */}
        <SubscriptionGuard>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {title && (
              <h1 className="text-xl font-bold text-foreground mb-6 hidden lg:block">{title}</h1>
            )}
            {children}
          </main>
        </SubscriptionGuard>
      </div>
    </div>
  );
}
