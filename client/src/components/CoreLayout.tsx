/**
 * CoreLayout — Layout do Control Plane do Assist-Pró.
 * Área exclusiva do dono da plataforma. Completamente separada da área do tenant.
 * Acesso via /admin — nunca aparece na navegação do tenant.
 */
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  FileText,
  Activity,
  Webhook,
  Package,
  LogOut,
  ClipboardList,
  UserPlus,
  Mail,
  Handshake,
  Eye,
  Send,
  Shield,
  Wrench,
  DollarSign,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

const navItems = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/tenants", label: "Assinantes", icon: Building2 },
  { href: "/super-admin/plans", label: "Planos", icon: Package },
  { href: "/super-admin/subscriptions", label: "Assinaturas", icon: CreditCard },
  { href: "/super-admin/billing", label: "Billing", icon: FileText },
  { href: "/super-admin/audit-logs", label: "Audit Logs", icon: Activity },
  { href: "/super-admin/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/super-admin/leads", label: "Leads", icon: UserPlus },
  { href: "/super-admin/communications", label: "Comunicação", icon: Mail },
  { href: "/super-admin/revendedores", label: "Revendedores", icon: Handshake },
  { href: "/super-admin/comissoes", label: "Comissões", icon: DollarSign },
  { href: "/super-admin/trials", label: "Monitoramento Trials", icon: Eye },
  { href: "/super-admin/campaigns", label: "Campanhas Email", icon: Send },
  { href: "/super-admin/playbook", label: "Roteiro do Sistema", icon: ClipboardList },
];

interface CoreLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function CoreLayout({ children, title }: CoreLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Sessão encerrada");
      window.location.href = "/login";
    },
  });

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0f1117", color: "#e2e8f0" }}
    >
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{ background: "#161b27", borderColor: "#1e2535" }}
      >
        {/* Logo / Brand */}
        <div className="p-5 border-b" style={{ borderColor: "#1e2535" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#1B4F8A" }}
            >
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Assist-Pró</p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Control Plane
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/super-admin"
                ? location === "/super-admin"
                : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "text-white"
                    : "hover:text-white"
                )}
                style={
                  active
                    ? { background: "#1B4F8A", color: "#fff" }
                    : { color: "#94a3b8" }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "#1e2535";
                    (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  }
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t" style={{ borderColor: "#1e2535" }}>
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || user.email}
                </p>
                <Badge
                  variant="outline"
                  className="text-xs mt-0.5 border-none px-0"
                  style={{ color: "#64748b" }}
                >
                  {user.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                className="flex-shrink-0 hover:bg-red-500/10"
                style={{ color: "#64748b" }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "#64748b" }}>
              Não autenticado
            </p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {title && (
          <header
            className="px-8 py-5 border-b flex-shrink-0"
            style={{ background: "#161b27", borderColor: "#1e2535" }}
          >
            <h1 className="text-xl font-semibold text-white">{title}</h1>
          </header>
        )}
        <div
          className="flex-1 overflow-y-auto p-8"
          style={{ background: "#0f1117" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
