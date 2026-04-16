/**
 * Control Plane — Revenda
 * Rota: /admin/resale
 */
import { CoreLayout } from "@/components/CoreLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Clock } from "lucide-react";

export default function AdminResale() {
  return (
    <CoreLayout title="Revenda">
      <div className="space-y-6">
        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Store className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              Programa de Revenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(27,79,138,0.15)" }}>
                <Clock className="w-8 h-8" style={{ color: "#1B4F8A" }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Em desenvolvimento</h3>
              <p className="text-sm max-w-md" style={{ color: "#64748b" }}>
                O módulo de revenda permitirá que parceiros revendam o Assist-Pró com sua própria marca
                (white-label), gerenciem seus clientes e recebam comissões automáticas. Disponível em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CoreLayout>
  );
}
