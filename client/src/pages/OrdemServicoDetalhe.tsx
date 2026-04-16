import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Plus, DollarSign, History, Package, Camera, PenLine,
  Shield, Link2, Copy, ClipboardList, AlertTriangle, Eye, Trash2, Mail,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { OS_STATUS_LABELS, OS_STATUS_COLORS, FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";

const STATUS_FLOW = ["recebido","em_diagnostico","aguardando_aprovacao","em_reparo","concluido","pronto_aguardando_retirada","encerrado"] as const;

// ── Signature Canvas ──────────────────────────────────────────────────────────
function SignatureCanvas({ onSave }: { onSave: (base64: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stop = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    onSave(base64);
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={stop}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={clear} className="flex-1">Limpar</Button>
        <Button size="sm" style={{ background: "#1B4F8A" }} onClick={save} className="flex-1">Salvar Assinatura</Button>
      </div>
    </div>
  );
}

// ── Photo Upload ──────────────────────────────────────────────────────────────
function PhotoUploader({ osId, tipo, onDone }: { osId: number; tipo: "entrada" | "saida" | "laudo"; onDone: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = trpc.os.uploadPhoto.useMutation({
    onSuccess: () => { toast.success("Foto salva!"); onDone(); setPreview(null); setBase64(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem muito grande (máx 10MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      setBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {preview ? (
        <div className="space-y-2">
          <img src={preview} alt="preview" className="w-full max-h-48 object-contain rounded-lg border" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setPreview(null); setBase64(null); }}>Trocar</Button>
            <Button size="sm" style={{ background: "#1B4F8A" }} className="flex-1" disabled={upload.isPending}
              onClick={() => base64 && upload.mutate({ osId, tipo, base64, mimeType: "image/jpeg" })}>
              {upload.isPending ? "Enviando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full h-24 flex-col gap-2" onClick={() => inputRef.current?.click()}>
          <Camera className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Selecionar foto</span>
        </Button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrdemServicoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const osId = Number(id);
  const isValidId = !isNaN(osId) && osId > 0;
  const utils = trpc.useUtils();

  const { data: os, isLoading } = trpc.os.get.useQuery({ id: osId }, { enabled: isValidId });
  const { data: itens = [] } = trpc.os.itens.useQuery({ osId }, { enabled: isValidId });
  const { data: lancamentos = [] } = trpc.os.lancamentos.useQuery({ osId }, { enabled: isValidId });
  const { data: history = [] } = trpc.os.history.useQuery({ osId }, { enabled: isValidId });
  const { data: photos = [], refetch: refetchPhotos } = trpc.os.photos.useQuery({ osId }, { enabled: isValidId });
  const { data: auditLog = [] } = trpc.os.fieldAudit.useQuery({ osId }, { enabled: isValidId });

  const [itemForm, setItemForm] = useState({ tipo: "servico" as "servico"|"peca", descricao: "", descricaoTecnica: "", quantidade: 1, valorUnitario: 0, valorCusto: 0 });
  const [lancForm, setLancForm] = useState({ tipo: "pagamento_final" as any, formaPagamento: "pix" as any, valor: 0, observacao: "" });
  const [statusObs, setStatusObs] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [openItem, setOpenItem] = useState(false);
  const [openLanc, setOpenLanc] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openPhoto, setOpenPhoto] = useState(false);
  const [photoTipo, setPhotoTipo] = useState<"entrada"|"saida"|"laudo">("entrada");
  const [openSignature, setOpenSignature] = useState(false);
  const [editLaudo, setEditLaudo] = useState(false);
  const [laudoText, setLaudoText] = useState("");
  const [lacreText, setLacreText] = useState("");
  const [semSolucao, setSemSolucao] = useState(false);
  const [justificativa, setJustificativa] = useState("");

  useEffect(() => {
    if (os) {
      setLaudoText((os as any).laudoTecnico ?? "");
      setLacreText((os as any).numeroLacre ?? "");
      setSemSolucao((os as any).semSolucaoPossivel ?? false);
      setJustificativa((os as any).justificativaSemSolucao ?? "");
    }
  }, [os?.id]);

  const addItem = trpc.os.addItem.useMutation({ onSuccess: () => { toast.success("Item adicionado!"); setOpenItem(false); utils.os.itens.invalidate(); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const addLanc = trpc.os.addLancamento.useMutation({ onSuccess: () => { toast.success("Lançamento registrado!"); setOpenLanc(false); utils.os.lancamentos.invalidate(); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const updateStatus = trpc.os.updateStatus.useMutation({ onSuccess: () => { toast.success("Status atualizado!"); setOpenStatus(false); utils.os.get.invalidate(); utils.os.history.invalidate(); }, onError: e => toast.error(e.message) });
  const removeItem = trpc.os.removeItem.useMutation({ onSuccess: () => { utils.os.itens.invalidate(); utils.os.get.invalidate(); } });
  const deletePhoto = trpc.os.deletePhoto.useMutation({ onSuccess: () => { refetchPhotos(); toast.success("Foto removida"); } });
  const saveSignature = trpc.os.saveSignature.useMutation({ onSuccess: () => { toast.success("Assinatura salva!"); setOpenSignature(false); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const updateOS = trpc.os.update.useMutation({ onSuccess: () => { toast.success("OS atualizada!"); setEditLaudo(false); utils.os.get.invalidate(); utils.os.fieldAudit.invalidate(); }, onError: e => toast.error(e.message) });
  const regenToken = trpc.os.regenerateClientToken.useMutation({ onSuccess: () => { toast.success("Link regenerado!"); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const reenviarEmail = trpc.os.reenviarEmailOrcamento.useMutation({ onSuccess: (r) => toast.success(`E-mail de orçamento enviado para ${r.sentTo}`), onError: e => toast.error(e.message) });

  const clientLink = os?.clientToken
    ? `${window.location.origin}/cliente/os/${(os as any).clientToken}`
    : null;

  function copyLink() {
    if (clientLink) { navigator.clipboard.writeText(clientLink); toast.success("Link copiado!"); }
  }

  function saveLaudo() {
    updateOS.mutate({
      id: osId,
      laudoTecnico: laudoText,
      numeroLacre: lacreText,
      semSolucaoPossivel: semSolucao,
      justificativaSemSolucao: semSolucao ? justificativa : undefined,
    });
  }

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AppLayout>;
  if (!os) return <AppLayout><div className="text-center py-12">OS não encontrada.</div></AppLayout>;

  const curIdx = STATUS_FLOW.indexOf(os.status as any);
  const availableNext = STATUS_FLOW.slice(curIdx + 1);
  const totalPago = parseFloat(String(os.valorPago ?? 0));
  const totalOS = parseFloat(String(os.valorTotal ?? 0));
  const saldo = totalOS - totalPago;

  const photosByType = {
    entrada: photos.filter(p => p.tipo === "entrada"),
    saida: photos.filter(p => p.tipo === "saida"),
    laudo: photos.filter(p => p.tipo === "laudo"),
  };

  return (
    <AppLayout title={`OS ${os.numero}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/ordens-servico">
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
          </Link>
          <Badge className={`${OS_STATUS_COLORS[os.status] ?? "bg-gray-100 text-gray-700"}`}>
            {OS_STATUS_LABELS[os.status] ?? os.status}
          </Badge>
          {(availableNext.length > 0 || !["encerrado","cancelado","devolvido_sem_reparo"].includes(os.status)) && (
            <Dialog open={openStatus} onOpenChange={setOpenStatus}>
              <DialogTrigger asChild>
                <Button size="sm" style={{ background: "#C4733A" }}>Avançar Status</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Avançar Status</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Novo status</Label>
                    <Select value={nextStatus} onValueChange={setNextStatus}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {availableNext.map(s => <SelectItem key={s} value={s}>{OS_STATUS_LABELS[s]}</SelectItem>)}
                        {!["encerrado","cancelado","devolvido_sem_reparo"].includes(os.status) && (
                          <>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                            <SelectItem value="devolvido_sem_reparo">Devolvido sem Reparo</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Observação</Label><Textarea value={statusObs} onChange={e => setStatusObs(e.target.value)} rows={2} /></div>
                  <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={!nextStatus || updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: osId, status: nextStatus as any, observacao: statusObs })}>
                    {updateStatus.isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
            <TabsTrigger value="laudo" className="flex-1">Laudo Técnico</TabsTrigger>
            <TabsTrigger value="fotos" className="flex-1">Fotos</TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-1">Financeiro</TabsTrigger>
            <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
          </TabsList>

          {/* ── ABA INFORMAÇÕES ── */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Dados da OS</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Número</span><span className="font-mono font-semibold">{os.numero}</span></div>
                  {os.prazoOrcamento && <div className="flex justify-between"><span className="text-muted-foreground">Prazo orçamento</span><span>{new Date(os.prazoOrcamento).toLocaleDateString("pt-BR")}</span></div>}
                  {os.senhaDesbloqueio && <div className="flex justify-between"><span className="text-muted-foreground">Senha</span><span className="font-mono">{os.senhaDesbloqueio}</span></div>}
                  {(os as any).numeroLacre && <div className="flex justify-between"><span className="text-muted-foreground">Lacre nº</span><span className="font-mono font-semibold text-orange-600">{(os as any).numeroLacre}</span></div>}
                  {os.descricaoProblema && <div className="pt-2"><p className="text-muted-foreground text-xs mb-1">Problema relatado</p><p>{os.descricaoProblema}</p></div>}
                  {(os as any).semSolucaoPossivel && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-red-700 font-medium text-xs">Equipamento sem solução possível</p>
                        {(os as any).justificativaSemSolucao && <p className="text-red-600 text-xs">{(os as any).justificativaSemSolucao}</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Link do cliente */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Link2 className="w-4 h-4" />Área do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clientLink ? (
                    <>
                      <div className="bg-muted rounded-lg p-2 text-xs font-mono break-all">{clientLink}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={copyLink}>
                          <Copy className="w-3 h-3 mr-1" />Copiar link
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(clientLink, "_blank")}>
                          <Eye className="w-3 h-3 mr-1" />Visualizar
                        </Button>
                      </div>
                      <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => regenToken.mutate({ osId })}>
                        Regenerar link
                      </Button>
                      {(os as any).statusOrcamento === "pendente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                          disabled={reenviarEmail.isPending}
                          onClick={() => reenviarEmail.mutate({ osId, origin: window.location.origin })}
                        >
                          <Mail className="w-3 h-3" />
                          {reenviarEmail.isPending ? "Enviando..." : "Enviar orçamento por e-mail"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Link não disponível.</p>
                  )}
                  {(os as any).statusOrcamento && (os as any).statusOrcamento !== "pendente" && (
                    <div className={`p-2 rounded-lg text-sm font-medium ${(os as any).statusOrcamento === "aprovado" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      Orçamento: {(os as any).statusOrcamento === "aprovado" ? "✅ Aprovado pelo cliente" : "❌ Reprovado pelo cliente"}
                      {(os as any).motivoReprovacao && <p className="text-xs mt-1 font-normal">{(os as any).motivoReprovacao}</p>}
                    </div>
                  )}
                  {(os as any).clientObservacoes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
                      <p className="font-medium text-blue-800 text-xs mb-1">Observação do cliente</p>
                      <p className="text-blue-700 text-xs">{(os as any).clientObservacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assinatura */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2"><PenLine className="w-4 h-4" />Assinatura Digital</CardTitle>
                  <Dialog open={openSignature} onOpenChange={setOpenSignature}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        {(os as any).assinaturaClienteUrl ? "Reasinar" : "Coletar Assinatura"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Assinatura do Cliente</DialogTitle></DialogHeader>
                      <p className="text-sm text-muted-foreground mb-3">O cliente deve assinar abaixo confirmando o recebimento do equipamento.</p>
                      <SignatureCanvas onSave={(b64) => saveSignature.mutate({ osId, base64: b64 })} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {(os as any).assinaturaClienteUrl ? (
                  <img src={(os as any).assinaturaClienteUrl} alt="Assinatura" className="max-h-24 border rounded-lg bg-white p-2" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma assinatura coletada.</p>
                )}
              </CardContent>
            </Card>

            {/* Itens */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4" />Serviços e Peças</CardTitle>
                  <Dialog open={openItem} onOpenChange={setOpenItem}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" />Adicionar</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Tipo</Label>
                          <Select value={itemForm.tipo} onValueChange={v => setItemForm({...itemForm, tipo: v as any})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="servico">Serviço</SelectItem><SelectItem value="peca">Peça</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div><Label>Descrição *</Label><Input value={itemForm.descricao} onChange={e => setItemForm({...itemForm, descricao: e.target.value})} /></div>
                        <div><Label>Descrição técnica <span className="text-xs text-muted-foreground">(opcional, visível no laudo)</span></Label>
                          <Textarea value={itemForm.descricaoTecnica} onChange={e => setItemForm({...itemForm, descricaoTecnica: e.target.value})} rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label>Qtd</Label><Input type="number" min={1} value={itemForm.quantidade} onChange={e => setItemForm({...itemForm, quantidade: parseInt(e.target.value)})} /></div>
                          <div><Label>Valor Unit. (R$)</Label><Input type="number" step="0.01" value={itemForm.valorUnitario} onChange={e => setItemForm({...itemForm, valorUnitario: parseFloat(e.target.value)})} /></div>
                        </div>
                        {itemForm.tipo === "peca" && (
                          <div><Label>Custo (R$) <span className="text-xs text-muted-foreground">(interno)</span></Label>
                            <Input type="number" step="0.01" value={itemForm.valorCusto} onChange={e => setItemForm({...itemForm, valorCusto: parseFloat(e.target.value)})} />
                          </div>
                        )}
                        <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addItem.isPending}
                          onClick={() => addItem.mutate({ osId, ...itemForm, valorCusto: itemForm.tipo === "peca" ? itemForm.valorCusto : undefined })}>
                          {addItem.isPending ? "Salvando..." : "Adicionar"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {itens.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado.</p> :
                  <div className="space-y-1">
                    {itens.map(i => (
                      <div key={i.id} className="flex items-start justify-between py-1.5 border-b last:border-0 text-sm gap-2">
                        <div className="flex-1">
                          <span className="font-medium">{i.descricao}</span>
                          <span className="text-muted-foreground ml-2">x{i.quantidade}</span>
                          {(i as any).descricaoTecnica && <p className="text-xs text-muted-foreground mt-0.5">{(i as any).descricaoTecnica}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-semibold">R$ {parseFloat(String(i.valorTotal)).toFixed(2)}</span>
                          <button onClick={() => removeItem.mutate({ itemId: i.id })} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ABA LAUDO TÉCNICO ── */}
          <TabsContent value="laudo" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4" />Laudo Técnico</CardTitle>
                  {!editLaudo && (
                    <Button size="sm" variant="outline" onClick={() => setEditLaudo(true)}>Editar</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editLaudo ? (
                  <>
                    <div>
                      <Label>Diagnóstico / Laudo técnico</Label>
                      <Textarea
                        value={laudoText}
                        onChange={e => setLaudoText(e.target.value)}
                        rows={6}
                        placeholder="Descreva o diagnóstico técnico detalhado do equipamento..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Número do lacre físico</Label>
                      <Input value={lacreText} onChange={e => setLacreText(e.target.value)} placeholder="Ex: LC-00123" className="mt-1 font-mono" />
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-red-50">
                      <Switch
                        checked={semSolucao}
                        onCheckedChange={setSemSolucao}
                        id="sem-solucao"
                      />
                      <Label htmlFor="sem-solucao" className="text-red-700 font-medium cursor-pointer">
                        Equipamento sem solução possível
                      </Label>
                    </div>
                    {semSolucao && (
                      <div>
                        <Label>Justificativa técnica obrigatória *</Label>
                        <Textarea
                          value={justificativa}
                          onChange={e => setJustificativa(e.target.value)}
                          rows={3}
                          placeholder="Descreva o motivo técnico pelo qual o equipamento não tem solução..."
                          className="mt-1"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setEditLaudo(false)}>Cancelar</Button>
                      <Button style={{ background: "#1B4F8A" }} className="flex-1" disabled={updateOS.isPending || (semSolucao && !justificativa)}
                        onClick={saveLaudo}>
                        {updateOS.isPending ? "Salvando..." : "Salvar Laudo"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {(os as any).laudoTecnico ? (
                      <div className="bg-muted/40 rounded-lg p-4 text-sm whitespace-pre-wrap">{(os as any).laudoTecnico}</div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum laudo registrado ainda.</p>
                    )}
                    {(os as any).numeroLacre && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-orange-500" />
                        <span className="text-muted-foreground">Lacre nº</span>
                        <span className="font-mono font-semibold text-orange-600">{(os as any).numeroLacre}</span>
                      </div>
                    )}
                    {(os as any).semSolucaoPossivel && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-red-700 font-medium text-sm">Equipamento sem solução possível</p>
                          {(os as any).justificativaSemSolucao && <p className="text-red-600 text-xs mt-1">{(os as any).justificativaSemSolucao}</p>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Auditoria de campos */}
            {auditLog.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" />Auditoria de Alterações</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {auditLog.map(a => (
                      <div key={a.id} className="flex gap-3 text-xs border-b last:border-0 pb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">{a.campo}</span>
                          {a.userName && <span className="text-muted-foreground"> por {a.userName}</span>}
                          {a.valorAnterior && <p className="text-muted-foreground line-through">{a.valorAnterior?.slice(0, 60)}</p>}
                          {a.valorNovo && <p className="text-green-700">{a.valorNovo?.slice(0, 60)}</p>}
                          <p className="text-muted-foreground">{new Date(a.createdAt).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── ABA FOTOS ── */}
          <TabsContent value="fotos" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={openPhoto} onOpenChange={setOpenPhoto}>
                <DialogTrigger asChild>
                  <Button style={{ background: "#1B4F8A" }}><Camera className="w-4 h-4 mr-2" />Adicionar Foto</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Foto</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Tipo de foto</Label>
                      <Select value={photoTipo} onValueChange={v => setPhotoTipo(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada (recebimento)</SelectItem>
                          <SelectItem value="saida">Saída (entrega)</SelectItem>
                          <SelectItem value="laudo">Laudo técnico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <PhotoUploader osId={osId} tipo={photoTipo} onDone={() => { setOpenPhoto(false); refetchPhotos(); }} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {(["entrada", "saida", "laudo"] as const).map(tipo => (
              photosByType[tipo].length > 0 && (
                <Card key={tipo}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm capitalize">{tipo === "entrada" ? "Fotos de Entrada" : tipo === "saida" ? "Fotos de Saída" : "Fotos do Laudo"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photosByType[tipo].map(p => (
                        <div key={p.id} className="relative group">
                          <img src={p.url} alt={`Foto ${tipo}`} className="w-full h-28 object-cover rounded-lg border" />
                          <button
                            onClick={() => deletePhoto.mutate({ photoId: p.id })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}

            {photos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Nenhuma foto adicionada ainda.</p>
              </div>
            )}
          </TabsContent>

          {/* ── ABA FINANCEIRO ── */}
          <TabsContent value="financeiro" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
                  <Dialog open={openLanc} onOpenChange={setOpenLanc}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><DollarSign className="w-3 h-3 mr-1" />Registrar Pagamento</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Tipo</Label>
                          <Select value={lancForm.tipo} onValueChange={v => setLancForm({...lancForm, tipo: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sinal">Sinal</SelectItem>
                              <SelectItem value="antecipacao">Antecipação</SelectItem>
                              <SelectItem value="pagamento_final">Pagamento Final</SelectItem>
                              <SelectItem value="estorno">Estorno</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Forma de Pagamento</Label>
                          <Select value={lancForm.formaPagamento} onValueChange={v => setLancForm({...lancForm, formaPagamento: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(FORMA_PAGAMENTO_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={lancForm.valor} onChange={e => setLancForm({...lancForm, valor: parseFloat(e.target.value)})} /></div>
                        <div><Label>Observação</Label><Input value={lancForm.observacao} onChange={e => setLancForm({...lancForm, observacao: e.target.value})} /></div>
                        <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addLanc.isPending} onClick={() => addLanc.mutate({ osId, ...lancForm })}>
                          {addLanc.isPending ? "Salvando..." : "Registrar"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total OS</span><span className="font-semibold">R$ {totalOS.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span className="text-green-600 font-semibold">R$ {totalPago.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-medium">Saldo</span><span className={`font-bold ${saldo > 0 ? "text-destructive" : "text-green-600"}`}>R$ {saldo.toFixed(2)}</span></div>
                {lancamentos.map(l => (
                  <div key={l.id} className="flex justify-between text-xs text-muted-foreground">
                    <span>{FORMA_PAGAMENTO_LABELS[l.formaPagamento ?? ""] ?? l.formaPagamento} — {l.tipo}</span>
                    <span>R$ {parseFloat(String(l.valor)).toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ABA HISTÓRICO ── */}
          <TabsContent value="historico" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" />Histórico de Status</CardTitle></CardHeader>
              <CardContent>
                {history.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sem histórico.</p> :
                  <div className="space-y-2">
                    {history.map(h => (
                      <div key={h.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{OS_STATUS_LABELS[h.statusNovo] ?? h.statusNovo}</span>
                          {h.observacao && <p className="text-muted-foreground text-xs">{h.observacao}</p>}
                          <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
