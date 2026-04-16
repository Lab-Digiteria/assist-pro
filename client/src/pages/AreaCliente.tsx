import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, Clock, Wrench, Package, AlertTriangle, XCircle,
  ThumbsUp, ThumbsDown, MessageSquare, Camera,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

// Status da OS em ordem cronológica
const STATUS_TIMELINE = [
  { key: "recebido", label: "Recebido", icon: Package, description: "Equipamento recebido pela assistência" },
  { key: "em_diagnostico", label: "Em Diagnóstico", icon: Wrench, description: "Técnico analisando o equipamento" },
  { key: "aguardando_aprovacao", label: "Aguardando Aprovação", icon: Clock, description: "Orçamento enviado para aprovação" },
  { key: "em_reparo", label: "Em Reparo", icon: Wrench, description: "Reparo em andamento" },
  { key: "concluido", label: "Concluído", icon: CheckCircle2, description: "Reparo finalizado" },
  { key: "pronto_aguardando_retirada", label: "Pronto para Retirada", icon: CheckCircle2, description: "Equipamento pronto para retirada" },
  { key: "encerrado", label: "Encerrado", icon: CheckCircle2, description: "OS encerrada" },
];

const TERMINAL_STATUSES: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  cancelado: { label: "Cancelado", color: "text-red-600", icon: XCircle },
  devolvido_sem_reparo: { label: "Devolvido sem Reparo", color: "text-orange-600", icon: AlertTriangle },
};

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const terminal = TERMINAL_STATUSES[currentStatus];
  if (terminal) {
    const Icon = terminal.icon;
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed ${terminal.color === "text-red-600" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
        <Icon className={`w-6 h-6 ${terminal.color}`} />
        <div>
          <p className={`font-semibold ${terminal.color}`}>{terminal.label}</p>
          <p className="text-sm text-muted-foreground">Esta OS foi encerrada sem reparo.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_TIMELINE.findIndex(s => s.key === currentStatus);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {STATUS_TIMELINE.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-start gap-4 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                isDone ? "bg-green-500 border-green-500 text-white" :
                isCurrent ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" :
                "bg-white border-gray-200 text-gray-400"
              }`}>
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className={`flex-1 pb-2 ${isPending ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${isCurrent ? "text-blue-700" : ""}`}>{step.label}</p>
                  {isCurrent && <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0">Atual</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AreaCliente() {
  const { token } = useParams<{ token: string }>();
  const [openReject, setOpenReject] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [openObs, setOpenObs] = useState(false);
  const [observacao, setObservacao] = useState("");

  const { data: os, isLoading, error, refetch } = trpc.os.getByClientToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token, retry: false }
  );

  const { data: photos = [] } = trpc.os.photos.useQuery(
    { osId: os?.id ?? 0 },
    { enabled: !!os?.id }
  );

  const approve = trpc.os.clientApproveQuote.useMutation({
    onSuccess: () => { toast.success("Orçamento aprovado! A assistência foi notificada."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const reject = trpc.os.clientRejectQuote.useMutation({
    onSuccess: () => { toast.success("Orçamento reprovado. A assistência foi notificada."); setOpenReject(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const addObs = trpc.os.clientAddObservation.useMutation({
    onSuccess: () => { toast.success("Observação enviada!"); setOpenObs(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !os) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link inválido ou expirado</h1>
          <p className="text-gray-500 text-sm">Este link de acompanhamento não é mais válido. Entre em contato com a assistência técnica para obter um novo link.</p>
        </div>
      </div>
    );
  }

  const totalOS = parseFloat(String(os.valorTotal ?? 0));
  const desconto = parseFloat(String(os.descontoValor ?? 0));
  const totalComDesconto = totalOS - desconto;
  const photosByType = {
    entrada: photos.filter(p => p.tipo === "entrada"),
    saida: photos.filter(p => p.tipo === "saida"),
    laudo: photos.filter(p => p.tipo === "laudo"),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Acompanhamento de OS</p>
            <p className="font-bold text-lg font-mono">{os.numero}</p>
          </div>
          <Badge className={`text-sm px-3 py-1 ${
            os.status === "encerrado" || os.status === "pronto_aguardando_retirada" ? "bg-green-100 text-green-700" :
            os.status === "cancelado" ? "bg-red-100 text-red-700" :
            "bg-blue-100 text-blue-700"
          }`}>
            {STATUS_TIMELINE.find(s => s.key === os.status)?.label ?? os.status}
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Aprovação de orçamento */}
        {os.statusOrcamento === "pendente" && os.status === "aguardando_aprovacao" && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-5">
              <h2 className="font-bold text-blue-800 text-lg mb-1">Orçamento aguardando sua aprovação</h2>
              <p className="text-blue-700 text-sm mb-4">Revise os valores abaixo e aprove ou reprove o orçamento.</p>
              <div className="bg-white rounded-lg p-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Valor total</span><span className="font-semibold">R$ {totalOS.toFixed(2)}</span></div>
                {desconto > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>- R$ {desconto.toFixed(2)}</span></div>}
                <div className="flex justify-between border-t pt-1 font-bold"><span>Total a pagar</span><span>R$ {totalComDesconto.toFixed(2)}</span></div>
                {os.prazoEstimadoConclusao && <div className="flex justify-between text-muted-foreground"><span>Prazo estimado</span><span>{new Date(os.prazoEstimadoConclusao).toLocaleDateString("pt-BR")}</span></div>}
                {os.validadeOrcamento && <div className="flex justify-between text-muted-foreground"><span>Validade do orçamento</span><span>{new Date(os.validadeOrcamento).toLocaleDateString("pt-BR")}</span></div>}
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate({ token })}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {approve.isPending ? "Aprovando..." : "Aprovar Orçamento"}
                </Button>
                <Dialog open={openReject} onOpenChange={setOpenReject}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                      <ThumbsDown className="w-4 h-4 mr-2" />Reprovar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Reprovar Orçamento</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Por favor, informe o motivo da reprovação para que possamos entrar em contato.</p>
                      <div>
                        <Label>Motivo *</Label>
                        <Textarea
                          value={motivo}
                          onChange={e => setMotivo(e.target.value)}
                          rows={4}
                          placeholder="Ex: Valor acima do esperado, prefiro não realizar o reparo..."
                          className="mt-1"
                        />
                      </div>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        disabled={reject.isPending || motivo.length < 5}
                        onClick={() => reject.mutate({ token, motivo })}
                      >
                        {reject.isPending ? "Enviando..." : "Confirmar Reprovação"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado do orçamento */}
        {os.statusOrcamento && os.statusOrcamento !== "pendente" && (
          <Card className={`border-2 ${os.statusOrcamento === "aprovado" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {os.statusOrcamento === "aprovado" ? (
                <><CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" /><div><p className="font-semibold text-green-800">Orçamento aprovado</p><p className="text-sm text-green-700">Reparo em andamento.</p></div></>
              ) : (
                <><XCircle className="w-6 h-6 text-red-600 flex-shrink-0" /><div><p className="font-semibold text-red-800">Orçamento reprovado</p>{os.motivoReprovacao && <p className="text-sm text-red-700">{os.motivoReprovacao}</p>}</div></>
              )}
            </CardContent>
          </Card>
        )}

        {/* Linha do tempo */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Acompanhamento</CardTitle></CardHeader>
          <CardContent>
            <StatusTimeline currentStatus={os.status} />
          </CardContent>
        </Card>

        {/* Laudo técnico */}
        {os.laudoTecnico && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Wrench className="w-4 h-4" />Laudo Técnico</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{os.laudoTecnico}</p>
            </CardContent>
          </Card>
        )}

        {/* Fotos */}
        {photos.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Camera className="w-4 h-4" />Fotos do Equipamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(["entrada", "saida", "laudo"] as const).map(tipo => (
                photosByType[tipo].length > 0 && (
                  <div key={tipo}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      {tipo === "entrada" ? "Recebimento" : tipo === "saida" ? "Entrega" : "Laudo"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {photosByType[tipo].map(p => (
                        <img key={p.id} src={p.url} alt={`Foto ${tipo}`} className="w-full h-32 object-cover rounded-lg border" />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        )}

        {/* Observação do cliente */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" />Enviar Informação</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {os.clientObservacoes ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-800 mb-1">Sua última mensagem</p>
                  <p className="text-blue-700">{os.clientObservacoes}</p>
                </div>
                <Dialog open={openObs} onOpenChange={setOpenObs}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">Atualizar mensagem</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Enviar informação</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Use este campo para informar senhas, informações adicionais ou dúvidas.</p>
                      <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} placeholder="Ex: A senha de desbloqueio é 1234..." />
                      <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addObs.isPending || !observacao.trim()}
                        onClick={() => addObs.mutate({ token, observacao })}>
                        {addObs.isPending ? "Enviando..." : "Enviar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Dialog open={openObs} onOpenChange={setOpenObs}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />Enviar informação para a assistência
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Enviar informação</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Use este campo para informar senhas, informações adicionais ou dúvidas.</p>
                    <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={4} placeholder="Ex: A senha de desbloqueio é 1234..." />
                    <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addObs.isPending || !observacao.trim()}
                      onClick={() => addObs.mutate({ token, observacao })}>
                      {addObs.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Powered by Assist-Pró · Este link é válido por 30 dias
        </p>
      </div>
    </div>
  );
}
