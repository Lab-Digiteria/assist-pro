import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Users, CreditCard, Building2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SUBSCRIPTION_STATUS_LABELS, PLANS } from "../../../shared/utils";

function StripeCheckoutButton({ planKey }: { planKey: "mensal" | "anual" | "vitalicio" }) {
  const checkout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Button size="sm" className="w-full mt-2 text-xs" style={{ background: "#C4733A" }}
      disabled={checkout.isPending}
      onClick={() => checkout.mutate({ planSlug: planKey, origin: window.location.origin })}>
      {checkout.isPending ? "Aguarde..." : <><ExternalLink className="w-3 h-3 mr-1" />Assinar</>}
    </Button>
  );
}

export default function Configuracoes() {
  const { data: tenant } = trpc.tenants.mine.useQuery();
  const { data: members = [] } = trpc.tenants.members.useQuery();
  const [comissaoForm, setComissaoForm] = useState({ tecnicoId: 0, categoria: "smartphone" as any, percentual: 10 });
  const upsertComissao = trpc.financeiro.upsertComissao.useMutation({
    onSuccess: () => toast.success("Comissão atualizada!"),
    onError: (e) => toast.error(e.message),
  });

  if (!tenant) {
    return (
      <AppLayout title="Configurações">
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  const trialEndsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;

  return (
    <AppLayout title="Configurações">
      <div className="space-y-4">
        {/* Empresa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />Minha Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{tenant.name}</span></div>
            {tenant.cpfCnpj && <div className="flex justify-between"><span className="text-muted-foreground">CPF/CNPJ</span><span>{tenant.cpfCnpj}</span></div>}
            {tenant.whatsapp && <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp</span><span>{tenant.whatsapp}</span></div>}
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" />Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className={
                tenant.subscriptionStatus === "active" ? "bg-green-100 text-green-700" :
                tenant.subscriptionStatus === "trial" ? "bg-blue-100 text-blue-700" :
                "bg-red-100 text-red-700"
              }>
                {SUBSCRIPTION_STATUS_LABELS[tenant.subscriptionStatus ?? "trial"] ?? tenant.subscriptionStatus}
              </Badge>
              {tenant.subscriptionStatus === "trial" && (
                <span className="text-sm text-muted-foreground">{daysLeft} dias restantes no trial</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {Object.entries(PLANS).map(([key, plan]) => (
                <div key={key} className="border rounded-lg p-3 text-center">
                  <p className="font-semibold text-sm">{plan.name}</p>
                  <p className="text-primary font-bold mt-1 text-sm">{plan.priceLabel}</p>
                  {plan.trialDays > 0 && <p className="text-xs text-muted-foreground mt-1">{plan.trialDays} dias grátis</p>}
                  <StripeCheckoutButton planKey={key as any} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipe */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />Equipe ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro adicionado.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{m.userName ?? "Usuário"}</p>
                      <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comissões */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Configurar Comissões de Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>ID do Técnico</Label>
                <Input type="number" value={comissaoForm.tecnicoId}
                  onChange={(e) => setComissaoForm({ ...comissaoForm, tecnicoId: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={comissaoForm.categoria} onValueChange={(v) => setComissaoForm({ ...comissaoForm, categoria: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["smartphone", "tablet", "notebook", "desktop", "smartwatch", "console", "tv", "outro"].map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>% Comissão</Label>
                <Input type="number" min={0} max={100} value={comissaoForm.percentual}
                  onChange={(e) => setComissaoForm({ ...comissaoForm, percentual: parseFloat(e.target.value) })} />
              </div>
            </div>
            <Button className="mt-3" style={{ background: "#1B4F8A" }}
              onClick={() => upsertComissao.mutate(comissaoForm)} disabled={upsertComissao.isPending}>
              {upsertComissao.isPending ? "Salvando..." : "Salvar Comissão"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
