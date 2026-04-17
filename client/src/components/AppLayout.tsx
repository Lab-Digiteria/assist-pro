import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { SubscriptionGuard } from "./SubscriptionGuard";
import { TrialBanner } from "./TrialBanner";
import { ImpersonationBanner } from "./ImpersonationBanner";
import {
  BarChart3,
  Box,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShoppingCart,
  Smartphone,
  Users,
  Wallet,
  X,
  BookOpen,
  ArrowDownCircle,
  ArrowUpCircle,
  LineChart,
  Upload,
  Search,
  Building2,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

// ── Nav structure ────────────────────────────────────────────────────────────
const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/equipamentos", label: "Equipamentos", icon: Smartphone },
];

const estoqueNavItems = [
  { href: "/estoque", label: "Estoque", icon: Box, exact: true },
  { href: "/estoque/lista-compras", label: "Lista de Compras", icon: ShoppingCart },
  { href: "/busca-peca", label: "Busca Nexar", icon: Search },
  { href: "/fornecedores", label: "Fornecedores", icon: Building2 },
];

const financeiroItems = [
  { href: "/financeiro", label: "Dashboard Financeiro", icon: Wallet, exact: true },
  { href: "/financeiro/contas-receber", label: "A Receber", icon: ArrowDownCircle },
  { href: "/financeiro/contas-pagar", label: "A Pagar", icon: ArrowUpCircle },
  { href: "/financeiro/fluxo-caixa", label: "Fluxo de Caixa", icon: LineChart },
  { href: "/financeiro/dre", label: "DRE", icon: BarChart3 },
  { href: "/financeiro/plano-contas", label: "Plano de Contas", icon: BookOpen },
  { href: "/financeiro/importar-extrato", label: "Importar Extrato", icon: Upload },
];

const caixaNavItems = [
  { href: "/caixa", label: "Caixa", icon: CreditCard },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

const configNavItems = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  indent,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  indent?: boolean;
  onClick?: () => void;
}) {
  const [location] = useLocation();
  const active = exact
    ? location === href
    : location === href || location.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "nav-item",
        indent && "pl-8",
        active && "active"
      )}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavGroupLabel({ children }: { children: React.ReactNode }) {
  return <div className="nav-group-label">{children}</div>;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [financeiroOpen, setFinanceiroOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => (window.location.href = "/"),
  });
  const { data: tenant } = trpc.tenants.mine.useQuery(undefined, { enabled: isAuthenticated });

  const isFinanceiroActive = location.startsWith("/financeiro");

  useEffect(() => {
    if (isFinanceiroActive) setFinanceiroOpen(true);
  }, [isFinanceiroActive]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (!loading && tenant === null) {
      window.location.href = "/onboarding";
    }
  }, [loading, tenant]);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-base)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#C4733A" }}>
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--brand-primary)",
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || tenant === null) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "var(--surface-1)" }}>
      {/* Logo */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--surface-border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#C4733A" }}>
            <Smartphone size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm block" style={{ color: "var(--text-primary)" }}>Assist-Pró</span>
            {tenant && (
              <span className="text-xs truncate block" style={{ color: "var(--text-muted)" }}>{tenant.name}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {/* Principal */}
        <NavGroupLabel>Principal</NavGroupLabel>
        {mainNavItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}

        {/* Estoque */}
        <NavGroupLabel>Estoque</NavGroupLabel>
        {estoqueNavItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}

        {/* Financeiro — colapsável */}
        <NavGroupLabel>Financeiro</NavGroupLabel>
        <button
          onClick={() => setFinanceiroOpen(v => !v)}
          className={cn(
            "nav-item w-full",
            isFinanceiroActive && "active"
          )}
        >
          <Wallet size={15} className="flex-shrink-0" />
          <span className="flex-1 text-left truncate">Financeiro</span>
          <ChevronDown
            size={13}
            className="flex-shrink-0 transition-transform duration-150"
            style={{ transform: financeiroOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {financeiroOpen && (
          <div className="space-y-0.5 mt-0.5">
            {financeiroItems.map((item) => (
              <NavItem key={item.href} {...item} indent onClick={() => setSidebarOpen(false)} />
            ))}
          </div>
        )}

        {/* Caixa */}
        <NavGroupLabel>Gestão</NavGroupLabel>
        {caixaNavItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}

        {/* Config */}
        <NavGroupLabel>Sistema</NavGroupLabel>
        {configNavItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}
      </nav>

      {/* User footer */}
      <div className="px-2 py-3" style={{ borderTop: "1px solid var(--surface-border)" }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md" style={{ background: "var(--surface-2)" }}>
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarFallback className="text-xs font-semibold" style={{ background: "var(--brand-primary)", color: "#fff" }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="p-1 rounded transition-colors hover:bg-white/10"
            title="Sair"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-base)" }}>
      {/* Desktop Sidebar — 220px */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{ width: 220, borderRight: "1px solid var(--surface-border)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: 220, borderRight: "1px solid var(--surface-border)" }}>
            <button
              className="absolute top-3 right-3 p-1 rounded"
              style={{ color: "var(--text-muted)" }}
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ImpersonationBanner />
        <TrialBanner />

        {/* Topbar — 48px desktop */}
        <header
          className="flex items-center px-4 lg:px-6 flex-shrink-0"
          style={{
            height: 48,
            background: "var(--surface-1)",
            borderBottom: "1px solid var(--surface-border)",
          }}
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden mr-3 p-1 rounded"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb / page name */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>
              {title ?? "Assist-Pró"}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-md transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
              title="Notificações"
            >
              <Bell size={16} />
            </button>
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs font-semibold" style={{ background: "var(--brand-primary)", color: "#fff" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Header */}
        {title && (
          <div
            className="px-6 pt-5 pb-0 flex-shrink-0"
          >
            <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
        )}

        {/* Page Content */}
        <SubscriptionGuard>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </SubscriptionGuard>
      </div>
    </div>
  );
}
