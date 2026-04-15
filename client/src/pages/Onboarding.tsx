import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", cpfCnpj: "", whatsapp: "", email: "" });

  const createTenant = trpc.tenants.create.useMutation({
    onSuccess: () => {
      toast.success("Empresa cadastrada! Bem-vindo ao Assist-Pró.");
      navigate("/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return null;
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.cpfCnpj || !form.whatsapp) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createTenant.mutate(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "#1B4F8A" }}>
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Assist-Pró</CardTitle>
          <CardDescription>
            Configure sua assistência técnica para começar o trial de 14 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da empresa *</Label>
              <Input
                id="name"
                placeholder="Ex: Tech Repair Center"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
              <Input
                id="cpfCnpj"
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                value={form.cpfCnpj}
                onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@suaempresa.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createTenant.isPending}
              style={{ background: "#1B4F8A" }}
            >
              {createTenant.isPending ? "Cadastrando..." : "Começar Trial de 14 dias"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
