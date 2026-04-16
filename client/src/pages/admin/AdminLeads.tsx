/**
 * Control Plane — Leads
 * Rota: /admin/leads
 */
import { useState } from "react";
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, RefreshCw, Phone, Mail, Building2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LEAD_STATUS: Record<string, { label: string; color: string }> = {
  new:       { label: "Novo",       color: "#3b82f6" },
  contacted: { label: "Contactado", color: "#eab308" },
  converted: { label: "Convertido", color: "#22c55e" },
  lost:      { label: "Perdido",    color: "#ef4444" },
};

export default function AdminLeads() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const leadsQuery = trpc.tenants.adminListLeads.useQuery();

  const filtered = (leadsQuery.data ?? []).filter((l: any) =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CoreLayout title="Leads">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748b" }} />
            <Input
              placeholder="Buscar por nome, e-mail ou empresa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              style={{ background: "#161b27", borderColor: "#1e2535", color: "#e2e8f0" }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => utils.tenants.adminListLeads.invalidate()}
            style={{ borderColor: "#1e2535", color: "#94a3b8", background: "transparent" }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(LEAD_STATUS).map(([status, cfg]) => {
            const count = (leadsQuery.data ?? []).filter((l: any) => l.status === status).length;
            return (
              <Card key={status} style={{ background: "#161b27", borderColor: "#1e2535" }}>
                <CardContent className="pt-4">
                  <p className="text-xs mb-1" style={{ color: "#64748b" }}>{cfg.label}</p>
                  <p className="text-xl font-bold" style={{ color: cfg.color }}>{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "#1e2535" }}>
                  {["Nome", "Empresa", "CPF/CNPJ", "WhatsApp", "E-mail", "Status", "Origem", "Cadastro"].map(h => (
                    <TableHead key={h} style={{ color: "#64748b" }}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8" style={{ color: "#64748b" }}>Carregando…</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8" style={{ color: "#64748b" }}>
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : filtered.map((l: any) => {
                  const cfg = LEAD_STATUS[l.status] ?? LEAD_STATUS["new"];
                  return (
                    <TableRow key={l.id} style={{ borderColor: "#1e2535" }}>
                      <TableCell className="text-white font-medium">{l.name}</TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" style={{ color: "#64748b" }} />
                          {l.companyName || "—"}
                        </div>
                      </TableCell>
                      <TableCell style={{ color: "#64748b" }} className="font-mono text-xs">{l.document || "—"}</TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>
                        {l.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" style={{ color: "#64748b" }} />
                            {l.phone}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>
                        {l.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" style={{ color: "#64748b" }} />
                            {l.email}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border"
                          style={{ color: cfg.color, borderColor: cfg.color + "40", background: cfg.color + "15" }}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: "#64748b" }} className="text-xs">{l.source || "landing"}</TableCell>
                      <TableCell style={{ color: "#64748b" }}>
                        {new Date(l.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </CoreLayout>
  );
}
