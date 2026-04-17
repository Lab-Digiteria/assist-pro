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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, DollarSign, History, Package, Camera, PenLine,
  Shield, Link2, Copy, ClipboardList, AlertTriangle, Eye, Trash2,
  Mail, Printer, ChevronDown, User, Smartphone, Lock, Wrench,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { OS_STATUS_LABELS, OS_STATUS_COLORS, FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";

const STATUS_FLOW = ["recebido","em_diagnostico","aguardando_aprovacao","em_reparo","concluido","pronto_aguardando_retirada","encerrado"] as const;

const CHECKLIST_LABELS: Record<string, string> = {
  tela: "Tela", carcaca: "Carcaça", parafusos: "Parafusos", botoes: "Botões",
  conector: "Conector", jack: "Jack P2", slot_sim: "Slot SIM",
  lente_camera: "Câmera", tampa_traseira: "Tampa", indicios_liquido: "Líquido", bateria: "Bateria",
};
const CHECKLIST_STATUS_LABELS: Record<string, string> = { ok: "OK", danificado: "Dan.", ausente: "Aus." };
const CHECKLIST_STATUS_COLORS: Record<string, string> = { ok: "bg-green-100 text-green-700", danificado: "bg-yellow-100 text-yellow-700", ausente: "bg-red-100 text-red-700" };

// ── Signature Canvas ──────────────────────────────────────────────────────────
function SignatureCanvas({ onSave }: { onSave: (base64: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };
  const stop = () => { drawing.current = false; };
  const clear = () => canvasRef.current!.getContext("2d")!.clearRect(0, 0, 400, 150);
  const save = () => { const b64 = canvasRef.current!.toDataURL("image/png").split(",")[1]; onSave(b64); };
  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} width={400} height={150} className="w-full touch-none cursor-crosshair"
          onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
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
    reader.onload = (ev) => { const d = ev.target?.result as string; setPreview(d); setBase64(d.split(",")[1]); };
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

// ── Print Modal ───────────────────────────────────────────────────────────────
function PrintModal({ os, itens, lancamentos, companySettings, employees }: { os: any; itens: any[]; lancamentos: any[]; companySettings?: any; employees?: any[] }) {
  const [open, setOpen] = useState(false);

  const totalOS = parseFloat(String(os.valorTotal ?? 0));
  const totalPago = parseFloat(String(os.valorPago ?? 0));
  const saldo = totalOS - totalPago;

  const printA4 = useCallback(() => {
    const win = window.open("", "_blank");
    if (!win) return;
    const cs = companySettings;
    const primaryColor = cs?.primaryColor ?? "#1B4F8A";
    const secondaryColor = cs?.secondaryColor ?? "#C4733A";
    const companyName = cs?.tradeName || cs?.companyName || "Assistência Técnica";
    const companyAddress = [cs?.street, cs?.number, cs?.neighborhood, cs?.city, cs?.state].filter(Boolean).join(", ");
    const companyPhone = cs?.phonePrimary ?? "";
    const companyWhatsapp = cs?.whatsapp ?? "";
    const companyEmail = cs?.emailPrimary ?? "";
    const companyWebsite = cs?.website ?? "";
    const companyCnpj = cs?.cnpj ?? "";
    const logoUrl = cs?.logoUrl ?? "";
    const headerText = cs?.documentHeaderText ?? "";
    const footerText = cs?.documentFooterText ?? "";
    const warrantyText = cs?.warrantyText ?? "";
    const osTerms = cs?.osTerms ?? "";
    const techName = employees?.find((e: any) => e.id === os.tecnicoId)?.fullName ?? "";
    const attendantName = employees?.find((e: any) => e.id === os.attendantId)?.fullName ?? "";

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>OS ${os.numero}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
  @page { size: A4; margin: 12mm 14mm; }
  @media print { body { margin: 0; } .no-print { display: none; } }

  /* HEADER */
  .doc-header { background: ${primaryColor}; color: #fff; padding: 14px 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 0; }
  .doc-header img { height: 52px; width: auto; object-fit: contain; background: rgba(255,255,255,0.15); border-radius: 4px; padding: 3px; }
  .doc-header .company-info h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
  .doc-header .company-info p { font-size: 10px; opacity: 0.88; margin-top: 2px; }
  .doc-header .os-badge { margin-left: auto; text-align: right; }
  .doc-header .os-badge .os-num { font-size: 20px; font-weight: 800; font-family: 'Courier New', monospace; }
  .doc-header .os-badge .os-date { font-size: 10px; opacity: 0.85; }

  /* STATUS BAR */
  .status-bar { background: ${secondaryColor}; color: #fff; padding: 5px 16px; font-size: 11px; font-weight: 600; display: flex; justify-content: space-between; }

  /* BODY */
  .doc-body { padding: 12px 0; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${primaryColor}; border-bottom: 1.5px solid ${primaryColor}; padding-bottom: 3px; margin-bottom: 8px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .field { margin-bottom: 6px; }
  .field-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
  .field-value { font-size: 11px; font-weight: 500; }

  /* TABLE */
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  thead tr { background: ${primaryColor}; color: #fff; }
  th { padding: 5px 7px; text-align: left; font-size: 10px; }
  td { padding: 4px 7px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .total-row td { font-weight: 700; border-top: 2px solid ${primaryColor}; background: #f3f4f6 !important; }
  .saldo-row td { font-weight: 700; color: ${saldo > 0 ? "#dc2626" : "#16a34a"}; }

  /* FINANCIAL SUMMARY */
  .fin-summary { border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
  .fin-row { display: flex; justify-content: space-between; padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
  .fin-row:last-child { border-bottom: none; }
  .fin-row.total { background: ${primaryColor}; color: #fff; font-weight: 700; }
  .fin-row.saldo { background: ${saldo > 0 ? "#fef2f2" : "#f0fdf4"}; color: ${saldo > 0 ? "#dc2626" : "#16a34a"}; font-weight: 700; }

  /* SIGNATURE */
  .sig-box { border: 1px solid #d1d5db; border-radius: 4px; height: 56px; display: flex; align-items: flex-end; padding: 4px 8px; }
  .sig-box img { max-height: 50px; }

  /* WARRANTY / TERMS */
  .terms-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 10px; font-size: 9.5px; color: #4b5563; line-height: 1.5; white-space: pre-wrap; }

  /* FOOTER */
  .doc-footer { border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 14px; font-size: 9.5px; color: #6b7280; text-align: center; }
</style></head><body>

<!-- HEADER -->
<div class="doc-header">
  ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : ""}
  <div class="company-info">
    <h1>${companyName}</h1>
    ${headerText ? `<p>${headerText}</p>` : ""}
    <p>${[companyAddress, companyPhone && `Tel: ${companyPhone}`, companyWhatsapp && `WhatsApp: ${companyWhatsapp}`, companyEmail, companyWebsite].filter(Boolean).join(" &nbsp;·&nbsp; ")}</p>
    ${companyCnpj ? `<p>CNPJ: ${companyCnpj}</p>` : ""}
  </div>
  <div class="os-badge">
    <div class="os-num">${os.numero}</div>
    <div class="os-date">Abertura: ${new Date(os.createdAt).toLocaleDateString("pt-BR")}</div>
    ${os.prazoOrcamento ? `<div class="os-date">Prazo: ${new Date(os.prazoOrcamento).toLocaleDateString("pt-BR")}</div>` : ""}
  </div>
</div>
<div class="status-bar">
  <span>Status: ${OS_STATUS_LABELS[os.status] ?? os.status}</span>
  ${techName ? `<span>Técnico: ${techName}</span>` : ""}
  ${attendantName ? `<span>Atendente: ${attendantName}</span>` : ""}
</div>

<div class="doc-body">

<!-- CLIENTE E EQUIPAMENTO -->
<div class="two-col section">
  <div>
    <div class="section-title">Cliente</div>
    <div class="field"><div class="field-label">Nome</div><div class="field-value">${os.clienteNome ?? "—"}</div></div>
    <div class="field"><div class="field-label">Telefone / WhatsApp</div><div class="field-value">${os.clienteWhatsapp ?? "—"}</div></div>
    ${os.clienteEmail ? `<div class="field"><div class="field-label">E-mail</div><div class="field-value">${os.clienteEmail}</div></div>` : ""}
  </div>
  <div>
    <div class="section-title">Equipamento</div>
    <div class="field"><div class="field-label">Aparelho</div><div class="field-value">${os.equipamentoMarca ?? ""} ${os.equipamentoModelo ?? ""}</div></div>
    ${os.equipamentoCor ? `<div class="field"><div class="field-label">Cor</div><div class="field-value">${os.equipamentoCor}</div></div>` : ""}
    ${os.equipamentoImei ? `<div class="field"><div class="field-label">IMEI / Série</div><div class="field-value" style="font-family:monospace">${os.equipamentoImei}</div></div>` : ""}
    ${os.numeroLacre ? `<div class="field"><div class="field-label">Lacre</div><div class="field-value" style="font-family:monospace;color:${secondaryColor}">${os.numeroLacre}</div></div>` : ""}
  </div>
</div>

${os.descricaoProblema ? `
<div class="section">
  <div class="section-title">Problema Relatado pelo Cliente</div>
  <p style="font-size:11px;line-height:1.5">${os.descricaoProblema}</p>
</div>` : ""}

${os.laudoTecnico ? `
<div class="section">
  <div class="section-title">Laudo Técnico</div>
  <p style="font-size:11px;line-height:1.5;white-space:pre-wrap">${os.laudoTecnico}</p>
</div>` : ""}

<!-- SERVIÇOS E PEÇAS -->
<div class="section">
  <div class="section-title">Serviços e Peças</div>
  <table>
    <thead><tr><th style="width:50%">Descrição</th><th>Tipo</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead>
    <tbody>
      ${itens.map(i => `<tr><td>${i.descricao}</td><td>${i.tipo === "peca" ? "Peça" : "Serviço"}</td><td>${i.quantidade}</td><td>R$ ${parseFloat(String(i.valorUnitario)).toFixed(2)}</td><td>R$ ${parseFloat(String(i.valorTotal)).toFixed(2)}</td></tr>`).join("")}
      <tr class="total-row"><td colspan="4" style="text-align:right">Total da OS</td><td>R$ ${totalOS.toFixed(2)}</td></tr>
    </tbody>
  </table>
</div>

<!-- FINANCEIRO E ASSINATURA -->
<div class="two-col section">
  <div>
    <div class="section-title">Resumo Financeiro</div>
    <div class="fin-summary">
      <div class="fin-row"><span>Total dos Serviços</span><span>R$ ${totalOS.toFixed(2)}</span></div>
      ${lancamentos.map(l => `<div class="fin-row"><span>${FORMA_PAGAMENTO_LABELS[l.formaPagamento ?? ""] ?? l.formaPagamento}</span><span>R$ ${parseFloat(String(l.valor)).toFixed(2)}</span></div>`).join("")}
      <div class="fin-row total"><span>Total Pago</span><span>R$ ${totalPago.toFixed(2)}</span></div>
      <div class="fin-row saldo"><span>Saldo em Aberto</span><span>R$ ${saldo.toFixed(2)}</span></div>
    </div>
  </div>
  <div>
    <div class="section-title">Assinatura do Cliente</div>
    <div class="sig-box">
      ${os.assinaturaClienteUrl ? `<img src="${os.assinaturaClienteUrl}" />` : ""}
    </div>
    <p style="font-size:9.5px;color:#6b7280;margin-top:4px">Confirmo o recebimento do equipamento nas condições descritas acima.</p>
  </div>
</div>

${warrantyText ? `
<div class="section">
  <div class="section-title">Garantia</div>
  <div class="terms-box">${warrantyText}</div>
</div>` : ""}

${osTerms ? `
<div class="section">
  <div class="section-title">Termos e Condições</div>
  <div class="terms-box">${osTerms}</div>
</div>` : ""}

</div><!-- /doc-body -->

${footerText ? `<div class="doc-footer">${footerText}</div>` : ""}

<script>window.onload = () => window.print();</script>
</body></html>`;
    win.document.write(html);
    win.document.close();
    setOpen(false);
  }, [os, itens, lancamentos, saldo, companySettings, employees]);

  const printThermal = useCallback(() => {
    const win = window.open("", "_blank");
    if (!win) return;
    const pad = (s: string, n: number) => s.slice(0, n).padEnd(n);
    const center = (s: string, n = 32) => { const p = Math.max(0, Math.floor((n - s.length) / 2)); return " ".repeat(p) + s; };
    const line = "─".repeat(32);
    const lines: string[] = [
      center("ORDEM DE SERVICO"),
      center(os.numero),
      line,
      `Data: ${new Date(os.createdAt).toLocaleDateString("pt-BR")}`,
      `Status: ${(OS_STATUS_LABELS[os.status] ?? os.status).slice(0, 26)}`,
      line,
      "CLIENTE",
      (os.clienteNome ?? "").slice(0, 32),
      (os.clienteWhatsapp ?? "").slice(0, 32),
      line,
      "EQUIPAMENTO",
      `${os.equipamentoMarca ?? ""} ${os.equipamentoModelo ?? ""}`.slice(0, 32),
      os.equipamentoImei ? `Serie: ${os.equipamentoImei}`.slice(0, 32) : "",
      line,
      "PROBLEMA",
      ...(os.descricaoProblema ?? "").match(/.{1,32}/g) ?? [],
      line,
      "SERVICOS/PECAS",
      ...itens.map(i => `${pad(i.descricao.slice(0, 20), 20)} ${parseFloat(String(i.valorTotal)).toFixed(2).padStart(8)}`),
      line,
      `${"TOTAL:".padEnd(24)}${totalOS.toFixed(2).padStart(8)}`,
      `${"PAGO:".padEnd(24)}${totalPago.toFixed(2).padStart(8)}`,
      `${"SALDO:".padEnd(24)}${saldo.toFixed(2).padStart(8)}`,
      line,
      center("Obrigado pela preferencia!"),
      "",
    ].filter(l => l !== undefined);

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Comprovante</title>
<style>
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 280px; margin: 0; padding: 8px; white-space: pre; }
  @media print { body { width: 280px; } button { display: none; } }
</style></head><body>${lines.join("\n")}<script>window.onload = () => window.print();</script></body></html>`;
    win.document.write(html);
    win.document.close();
    setOpen(false);
  }, [os, itens, lancamentos, totalOS, totalPago, saldo]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Printer className="w-4 h-4" />Imprimir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Selecionar Impressora</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Button className="w-full justify-start gap-3 h-14" variant="outline" onClick={printA4}>
            <div className="w-8 h-10 border-2 border-current rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">A4</span>
            </div>
            <div className="text-left">
              <p className="font-medium">Impressora Laser / A4</p>
              <p className="text-xs text-muted-foreground">Layout completo com logo e tabelas</p>
            </div>
          </Button>
          <Button className="w-full justify-start gap-3 h-14" variant="outline" onClick={printThermal}>
            <div className="w-8 h-10 border-2 border-current rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold">58mm</span>
            </div>
            <div className="text-left">
              <p className="font-medium">Impressora Térmica 58mm</p>
              <p className="text-xs text-muted-foreground">Comprovante compacto 32 colunas</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Item Modal with stock search ─────────────────────────────────────────
function AddItemModal({ osId, open, onOpenChange }: { osId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const utils = trpc.useUtils();
  const { data: pecasEstoque = [] } = trpc.estoque.list.useQuery(undefined, { enabled: open });
  const { data: fornecedores = [] } = trpc.suppliers.list.useQuery({ isActive: true }, { enabled: open });
  const [form, setForm] = useState({ tipo: "servico" as "servico"|"peca", descricao: "", descricaoTecnica: "", quantidade: 1, valorUnitario: 0, valorCusto: 0, supplierId: undefined as number | undefined });
  const [pecaSearch, setPecaSearch] = useState("");
  const [selectedPeca, setSelectedPeca] = useState<null | { id: number; nome: string; precoCusto: number | null; quantidadeAtual: number; quantidadeReservada: number }>(null);
  const [showNoCadastro, setShowNoCadastro] = useState(false);

  const filteredPecas = pecasEstoque.filter(p =>
    p.nome.toLowerCase().includes(pecaSearch.toLowerCase()) ||
    (p.partNumber ?? "").toLowerCase().includes(pecaSearch.toLowerCase())
  ).slice(0, 8);

  const addItem = trpc.os.addItem.useMutation({
    onSuccess: () => {
      toast.success("Item adicionado!");
      onOpenChange(false);
      utils.os.itens.invalidate();
      utils.os.get.invalidate();
      setForm({ tipo: "servico", descricao: "", descricaoTecnica: "", quantidade: 1, valorUnitario: 0, valorCusto: 0, supplierId: undefined });
      setSelectedPeca(null);
      setPecaSearch("");
      setShowNoCadastro(false);
    },
    onError: e => toast.error(e.message),
  });

  const selectPeca = (p: typeof filteredPecas[0]) => {
    setSelectedPeca(p as any);
    setForm(f => ({ ...f, descricao: p.nome, valorCusto: parseFloat(String(p.precoCusto ?? 0)) }));
    setPecaSearch(p.nome);
    setShowNoCadastro(false);
  };

  const handlePecaSearchChange = (v: string) => {
    setPecaSearch(v);
    setSelectedPeca(null);
    setForm(f => ({ ...f, descricao: v }));
    if (v.length >= 2 && filteredPecas.length === 0) setShowNoCadastro(true);
    else setShowNoCadastro(false);
  };

  const disponivel = selectedPeca ? selectedPeca.quantidadeAtual - selectedPeca.quantidadeReservada : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => { setForm({...form, tipo: v as any}); setSelectedPeca(null); setPecaSearch(""); setShowNoCadastro(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="servico">Serviço</SelectItem>
                <SelectItem value="peca">Peça</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.tipo === "peca" ? (
            <div className="space-y-1">
              <Label>Buscar peça no estoque</Label>
              <Input
                value={pecaSearch}
                onChange={e => handlePecaSearchChange(e.target.value)}
                placeholder="Digite nome ou Part Number..."
              />
              {pecaSearch.length >= 1 && !selectedPeca && filteredPecas.length > 0 && (
                <div className="border rounded-lg bg-background shadow-md max-h-40 overflow-y-auto">
                  {filteredPecas.map(p => (
                    <button key={p.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between items-center"
                      onClick={() => selectPeca(p)}>
                      <span>{p.nome}</span>
                      <span className="text-xs text-muted-foreground">Disp: {p.quantidadeAtual - p.quantidadeReservada}</span>
                    </button>
                  ))}
                </div>
              )}
              {showNoCadastro && (
                <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800 font-medium">Peça não encontrada no estoque.</p>
                    <p className="text-yellow-700">O item será adicionado sem reserva de estoque. Deseja
                      <button className="underline ml-1 font-medium" onClick={() => { onOpenChange(false); window.location.href = "/estoque"; }}>cadastrá-la no estoque</button>?
                    </p>
                  </div>
                </div>
              )}
              {selectedPeca && disponivel !== null && (
                <div className={`text-xs px-2 py-1 rounded ${disponivel > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {disponivel > 0 ? `✓ ${disponivel} unidade(s) disponível(is) no estoque` : "⚠ Estoque insuficiente — será adicionado sem reserva"}
                </div>
              )}
            </div>
          ) : (
            <div><Label>Descrição *</Label><Input value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} /></div>
          )}

          <div><Label>Descrição técnica <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Textarea value={form.descricaoTecnica} onChange={e => setForm({...form, descricaoTecnica: e.target.value})} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Qtd</Label><Input type="number" min={1} value={form.quantidade} onChange={e => setForm({...form, quantidade: parseInt(e.target.value)})} /></div>
            <div><Label>Valor Unit. (R$)</Label><Input type="number" step="0.01" value={form.valorUnitario} onChange={e => setForm({...form, valorUnitario: parseFloat(e.target.value)})} /></div>
          </div>
          {form.tipo === "peca" && (
            <div><Label>Custo (R$) <span className="text-xs text-muted-foreground">(interno)</span></Label>
              <Input type="number" step="0.01" value={form.valorCusto} onChange={e => setForm({...form, valorCusto: parseFloat(e.target.value)})} />
            </div>
          )}
          <div>
            <Label>Fornecedor <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Select value={form.supplierId ? String(form.supplierId) : "none"} onValueChange={v => setForm({...form, supplierId: v === "none" ? undefined : Number(v)})}>
              <SelectTrigger><SelectValue placeholder="Selecionar fornecedor..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(fornecedores as any[]).map((f: any) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.tradeName || f.corporateName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addItem.isPending || (!form.descricao && !pecaSearch)}
            onClick={() => addItem.mutate({
              osId,
              tipo: form.tipo,
              descricao: form.tipo === "peca" ? (selectedPeca?.nome ?? pecaSearch) : form.descricao,
              descricaoTecnica: form.descricaoTecnica || undefined,
              pecaId: selectedPeca?.id,
              supplierId: form.supplierId,
              quantidade: form.quantidade,
              valorUnitario: form.valorUnitario,
              valorCusto: form.tipo === "peca" ? form.valorCusto : undefined,
            })}>
            {addItem.isPending ? "Salvando..." : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const { data: employees = [] } = trpc.employees.list.useQuery({});
  const { data: companySettings } = trpc.companySettings.get.useQuery();

  // Forms
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
  const [showSenha, setShowSenha] = useState(false);

  useEffect(() => {
    if (os) {
      setLaudoText((os as any).laudoTecnico ?? "");
      setLacreText((os as any).numeroLacre ?? "");
      setSemSolucao((os as any).semSolucaoPossivel ?? false);
      setJustificativa((os as any).justificativaSemSolucao ?? "");
    }
  }, [os?.id]);

  const addLanc = trpc.os.addLancamento.useMutation({ onSuccess: () => { toast.success("Pagamento registrado!"); setOpenLanc(false); utils.os.lancamentos.invalidate(); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const updateStatus = trpc.os.updateStatus.useMutation({ onSuccess: () => { toast.success("Status atualizado!"); setOpenStatus(false); utils.os.get.invalidate(); utils.os.history.invalidate(); }, onError: e => toast.error(e.message) });
  const removeItem = trpc.os.removeItem.useMutation({ onSuccess: () => { utils.os.itens.invalidate(); utils.os.get.invalidate(); } });
  const deletePhoto = trpc.os.deletePhoto.useMutation({ onSuccess: () => { refetchPhotos(); toast.success("Foto removida"); } });
  const saveSignature = trpc.os.saveSignature.useMutation({ onSuccess: () => { toast.success("Assinatura salva!"); setOpenSignature(false); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const updateOS = trpc.os.update.useMutation({ onSuccess: () => { toast.success("OS atualizada!"); setEditLaudo(false); utils.os.get.invalidate(); utils.os.fieldAudit.invalidate(); }, onError: e => toast.error(e.message) });
  const regenToken = trpc.os.regenerateClientToken.useMutation({ onSuccess: () => { toast.success("Link regenerado!"); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const reenviarEmail = trpc.os.reenviarEmailOrcamento.useMutation({ onSuccess: (r) => toast.success(`E-mail enviado para ${r.sentTo}`), onError: e => toast.error(e.message) });

  const clientLink = os?.clientToken ? `${window.location.origin}/cliente/os/${(os as any).clientToken}` : null;

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AppLayout>;
  if (!os) return <AppLayout><div className="text-center py-12">OS não encontrada.</div></AppLayout>;

  const curIdx = STATUS_FLOW.indexOf(os.status as any);
  const availableNext = STATUS_FLOW.slice(curIdx + 1);
  const totalOS = parseFloat(String(os.valorTotal ?? 0));
  const totalPago = parseFloat(String(os.valorPago ?? 0));
  const saldo = totalOS - totalPago;
  const totalServicos = itens.filter(i => i.tipo === "servico").reduce((s, i) => s + parseFloat(String(i.valorTotal)), 0);
  const totalPecas = itens.filter(i => i.tipo === "peca").reduce((s, i) => s + parseFloat(String(i.valorTotal)), 0);

  const photosByType = {
    entrada: photos.filter(p => p.tipo === "entrada"),
    saida: photos.filter(p => p.tipo === "saida"),
    laudo: photos.filter(p => p.tipo === "laudo"),
  };

  const checklistEF = (os as any).checklistEstadoFisico as Record<string, string> | null;
  const acessorios = (os as any).acessoriosEntregues as string[] | null;

  return (
    <AppLayout title={`OS ${os.numero}`}>
      <div className="space-y-5">

        {/* ── CABEÇALHO ── */}
        <div className="flex items-start gap-3 flex-wrap">
          <Link href="/ordens-servico">
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-mono font-bold text-lg">{os.numero}</h1>
              <Badge className={`${OS_STATUS_COLORS[os.status] ?? "bg-gray-100 text-gray-700"}`}>
                {OS_STATUS_LABELS[os.status] ?? os.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Abertura: {new Date(os.createdAt).toLocaleDateString("pt-BR")}
              </span>
              {os.prazoOrcamento && (
                <span className={`text-xs ${new Date(os.prazoOrcamento) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  Prazo: {new Date(os.prazoOrcamento).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <PrintModal os={{ ...os, clienteNome: (os as any).clienteNome, clienteWhatsapp: (os as any).clienteWhatsapp, clienteEmail: (os as any).clienteEmail, equipamentoMarca: (os as any).equipamentoMarca, equipamentoModelo: (os as any).equipamentoModelo, equipamentoImei: (os as any).equipamentoImei, equipamentoCor: (os as any).equipamentoCor, tecnicoId: (os as any).tecnicoId, attendantId: (os as any).attendantId, assinaturaClienteUrl: (os as any).assinaturaClienteUrl }} itens={itens} lancamentos={lancamentos} companySettings={companySettings} employees={employees} />
            {!["encerrado","cancelado","devolvido_sem_reparo"].includes(os.status) && (
              <Dialog open={openStatus} onOpenChange={setOpenStatus}>
                <DialogTrigger asChild>
                  <Button size="sm" style={{ background: "#C4733A" }} className="gap-1">
                    Avançar Status <ChevronDown className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Avançar Status</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Novo status</Label>
                      <Select value={nextStatus} onValueChange={setNextStatus}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {availableNext.map(s => <SelectItem key={s} value={s}>{OS_STATUS_LABELS[s]}</SelectItem>)}
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="devolvido_sem_reparo">Devolvido sem Reparo</SelectItem>
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
        </div>

        {/* ── BLOCO 1 — Cliente e Equipamento ── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Técnico e Atendente */}
          {((os as any).tecnicoId || (os as any).attendantId) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-orange-600" />Equipe Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {(os as any).tecnicoId && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Técnico:</span>
                    <span className="font-medium">{employees.find(e => e.id === (os as any).tecnicoId)?.fullName ?? `#${(os as any).tecnicoId}`}</span>
                  </div>
                )}
                {(os as any).attendantId && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Atendente:</span>
                    <span className="font-medium">{employees.find(e => e.id === (os as any).attendantId)?.fullName ?? `#${(os as any).attendantId}`}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-600" />Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="font-semibold">{(os as any).clienteNome ?? "—"}</p>
              {(os as any).clienteWhatsapp && <p className="text-muted-foreground">{(os as any).clienteWhatsapp}</p>}
              {(os as any).clienteEmail && <p className="text-muted-foreground">{(os as any).clienteEmail}</p>}
              {os.clienteId && (
                <Link href={`/clientes/${os.clienteId}`}>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600">Ver ficha completa →</Button>
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-600" />Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <p className="font-semibold">{(os as any).equipamentoMarca} {(os as any).equipamentoModelo}</p>
              {(os as any).equipamentoCor && <p className="text-muted-foreground">Cor: {(os as any).equipamentoCor}</p>}
              {(os as any).equipamentoImei && <p className="text-muted-foreground font-mono text-xs">IMEI/Série: {(os as any).equipamentoImei}</p>}
              {(os as any).numeroLacre && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Shield className="w-3 h-3" />
                  <span className="font-mono text-xs font-semibold">Lacre: {(os as any).numeroLacre}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── BLOCO 2 — Diagnóstico e Serviço ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4 text-green-600" />Diagnóstico e Serviço</CardTitle>
              {!editLaudo && <Button size="sm" variant="outline" onClick={() => setEditLaudo(true)}>Editar</Button>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editLaudo ? (
              <>
                <div><Label>Problema relatado</Label><Textarea value={(os as any).descricaoProblema ?? ""} rows={2} disabled className="mt-1 bg-muted/30" /></div>
                <div><Label>Laudo técnico</Label>
                  <Textarea value={laudoText} onChange={e => setLaudoText(e.target.value)} rows={5} placeholder="Diagnóstico técnico detalhado..." className="mt-1" />
                </div>
                <div><Label>Número do lacre físico</Label>
                  <Input value={lacreText} onChange={e => setLacreText(e.target.value)} placeholder="Ex: LC-00123" className="mt-1 font-mono" />
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-red-50">
                  <Switch checked={semSolucao} onCheckedChange={setSemSolucao} id="sem-solucao" />
                  <Label htmlFor="sem-solucao" className="text-red-700 font-medium cursor-pointer">Equipamento sem solução possível</Label>
                </div>
                {semSolucao && (
                  <div><Label>Justificativa técnica *</Label>
                    <Textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} rows={3} className="mt-1" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditLaudo(false)}>Cancelar</Button>
                  <Button style={{ background: "#1B4F8A" }} className="flex-1" disabled={updateOS.isPending || (semSolucao && !justificativa)}
                    onClick={() => updateOS.mutate({ id: osId, laudoTecnico: laudoText, numeroLacre: lacreText, semSolucaoPossivel: semSolucao, justificativaSemSolucao: semSolucao ? justificativa : undefined })}>
                    {updateOS.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm">
                {os.descricaoProblema && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Problema relatado</p>
                    <p>{os.descricaoProblema}</p>
                  </div>
                )}
                {(os as any).laudoTecnico && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Laudo técnico</p>
                    <div className="bg-muted/40 rounded-lg p-3 whitespace-pre-wrap">{(os as any).laudoTecnico}</div>
                  </div>
                )}
                {(os as any).semSolucaoPossivel && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-700 font-medium">Sem solução possível</p>
                      {(os as any).justificativaSemSolucao && <p className="text-red-600 text-xs mt-1">{(os as any).justificativaSemSolucao}</p>}
                    </div>
                  </div>
                )}
                {/* Senha de desbloqueio */}
                {os.senhaDesbloqueio && (
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Senha:</span>
                    <span className="font-mono text-xs">{showSenha ? os.senhaDesbloqueio : "••••••"}</span>
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => setShowSenha(s => !s)}>{showSenha ? "Ocultar" : "Mostrar"}</button>
                  </div>
                )}
                {/* Checklist de estado físico */}
                {checklistEF && Object.keys(checklistEF).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Estado físico na entrada</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(checklistEF).filter(([, v]) => v).map(([k, v]) => (
                        <span key={k} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHECKLIST_STATUS_COLORS[v] ?? "bg-gray-100 text-gray-600"}`}>
                          {CHECKLIST_LABELS[k] ?? k}: {CHECKLIST_STATUS_LABELS[v] ?? v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Acessórios */}
                {acessorios && acessorios.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Acessórios recebidos</p>
                    <p className="text-sm">{acessorios.join(", ")}</p>
                  </div>
                )}
                {!os.descricaoProblema && !(os as any).laudoTecnico && (
                  <p className="text-muted-foreground text-center py-3">Nenhum diagnóstico registrado. Clique em Editar.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── BLOCOS 3 e 4 — Serviços/Peças + Pagamentos ── */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Bloco 3 — Serviços e Peças */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4 text-indigo-600" />Serviços e Peças</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setOpenItem(true)}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
              </div>
            </CardHeader>
            <CardContent>
              {itens.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado.</p>
              ) : (
                <div className="space-y-0">
                  {itens.map(i => (
                    <div key={i.id} className="flex items-start justify-between py-2 border-b last:border-0 text-sm gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${i.tipo === "peca" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                            {i.tipo === "peca" ? "Peça" : "Serviço"}
                          </span>
                          <span className="font-medium truncate">{i.descricao}</span>
                          <span className="text-muted-foreground text-xs">x{i.quantidade}</span>
                        </div>
                        {(i as any).descricaoTecnica && <p className="text-xs text-muted-foreground mt-0.5 ml-0.5">{(i as any).descricaoTecnica}</p>}
                        {(i as any).supplierName && <p className="text-xs text-muted-foreground mt-0.5 ml-0.5">🏭 {(i as any).supplierName}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-semibold text-sm">R$ {parseFloat(String(i.valorTotal)).toFixed(2)}</span>
                        <button onClick={() => removeItem.mutate({ itemId: i.id })} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 space-y-1 text-sm">
                    {totalServicos > 0 && <div className="flex justify-between text-muted-foreground"><span>Serviços</span><span>R$ {totalServicos.toFixed(2)}</span></div>}
                    {totalPecas > 0 && <div className="flex justify-between text-muted-foreground"><span>Peças</span><span>R$ {totalPecas.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>R$ {totalOS.toFixed(2)}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bloco 4 — Pagamentos */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" />Pagamentos</CardTitle>
                <Dialog open={openLanc} onOpenChange={setOpenLanc}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" />Registrar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Tipo</Label>
                        <Select value={lancForm.tipo} onValueChange={v => setLancForm({...lancForm, tipo: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sinal">Sinal / Entrada</SelectItem>
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
                      <div><Label>Valor (R$)</Label><Input type="number" step="0.01" min={0.01} value={lancForm.valor} onChange={e => setLancForm({...lancForm, valor: parseFloat(e.target.value)})} /></div>
                      <div><Label>Observação</Label><Input value={lancForm.observacao} onChange={e => setLancForm({...lancForm, observacao: e.target.value})} /></div>
                      <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addLanc.isPending}
                        onClick={() => addLanc.mutate({ osId, ...lancForm })}>
                        {addLanc.isPending ? "Salvando..." : "Registrar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {lancamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhum pagamento registrado.</p>
              ) : (
                <div className="space-y-1">
                  {lancamentos.map(l => (
                    <div key={l.id} className="flex justify-between text-xs text-muted-foreground py-1 border-b last:border-0">
                      <span>{FORMA_PAGAMENTO_LABELS[l.formaPagamento ?? ""] ?? l.formaPagamento} — {l.tipo}</span>
                      <span className="font-medium text-foreground">R$ {parseFloat(String(l.valor)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1 text-sm pt-1 border-t">
                <div className="flex justify-between"><span className="text-muted-foreground">Total OS</span><span className="font-semibold">R$ {totalOS.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Pago</span><span className="text-green-600 font-semibold">R$ {totalPago.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-bold">Saldo em Aberto</span>
                  <span className={`font-bold text-base ${saldo > 0 ? "text-destructive" : "text-green-600"}`}>R$ {saldo.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AddItemModal osId={osId} open={openItem} onOpenChange={setOpenItem} />

        {/* ── BLOCO 5 — Área do Cliente ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Link2 className="w-4 h-4 text-cyan-600" />Área do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {clientLink ? (
              <div className="space-y-2">
                <div className="bg-muted rounded-lg p-2 text-xs font-mono break-all">{clientLink}</div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => { navigator.clipboard.writeText(clientLink); toast.success("Link copiado!"); }}>
                    <Copy className="w-3 h-3" />Copiar link
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(clientLink, "_blank")}>
                    <Eye className="w-3 h-3" />Visualizar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => regenToken.mutate({ osId })}>
                    Regenerar link
                  </Button>
                  {(os as any).statusOrcamento === "pendente" && (
                    <Button size="sm" variant="outline" className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" disabled={reenviarEmail.isPending}
                      onClick={() => reenviarEmail.mutate({ osId, origin: window.location.origin })}>
                      <Mail className="w-3 h-3" />
                      {reenviarEmail.isPending ? "Enviando..." : "Enviar orçamento por e-mail"}
                    </Button>
                  )}
                </div>
                {(os as any).statusOrcamento && (os as any).statusOrcamento !== "pendente" && (
                  <div className={`p-2 rounded-lg text-sm font-medium ${(os as any).statusOrcamento === "aprovado" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    Orçamento: {(os as any).statusOrcamento === "aprovado" ? "✅ Aprovado" : "❌ Reprovado"}
                    {(os as any).motivoReprovacao && <p className="text-xs mt-1 font-normal">{(os as any).motivoReprovacao}</p>}
                  </div>
                )}
                {(os as any).clientObservacoes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm">
                    <p className="font-medium text-blue-800 text-xs mb-1">Observação do cliente</p>
                    <p className="text-blue-700 text-xs">{(os as any).clientObservacoes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Link não disponível.</p>
            )}
          </CardContent>
        </Card>

        {/* ── BLOCO 6 — Assinatura, Fotos e Histórico ── */}
        <Tabs defaultValue="assinatura">
          <TabsList className="w-full">
            <TabsTrigger value="assinatura" className="flex-1"><PenLine className="w-3.5 h-3.5 mr-1" />Assinatura</TabsTrigger>
            <TabsTrigger value="fotos" className="flex-1"><Camera className="w-3.5 h-3.5 mr-1" />Fotos</TabsTrigger>
            <TabsTrigger value="historico" className="flex-1"><History className="w-3.5 h-3.5 mr-1" />Histórico</TabsTrigger>
            <TabsTrigger value="auditoria" className="flex-1"><Shield className="w-3.5 h-3.5 mr-1" />Auditoria</TabsTrigger>
          </TabsList>

          {/* Assinatura */}
          <TabsContent value="assinatura" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Assinatura Digital do Cliente</CardTitle>
                  <Dialog open={openSignature} onOpenChange={setOpenSignature}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        {(os as any).assinaturaClienteUrl ? "Reassinar" : "Coletar Assinatura"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Assinatura do Cliente</DialogTitle></DialogHeader>
                      <p className="text-sm text-muted-foreground mb-3">O cliente deve assinar confirmando o recebimento.</p>
                      <SignatureCanvas onSave={(b64) => saveSignature.mutate({ osId, base64: b64 })} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {(os as any).assinaturaClienteUrl ? (
                  <img src={(os as any).assinaturaClienteUrl} alt="Assinatura" className="max-h-24 border rounded-lg bg-white p-2" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma assinatura coletada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fotos */}
          <TabsContent value="fotos" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={openPhoto} onOpenChange={setOpenPhoto}>
                <DialogTrigger asChild>
                  <Button style={{ background: "#1B4F8A" }}><Camera className="w-4 h-4 mr-2" />Adicionar Foto</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Foto</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Tipo</Label>
                      <Select value={photoTipo} onValueChange={v => setPhotoTipo(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                          <SelectItem value="laudo">Laudo</SelectItem>
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
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{tipo === "entrada" ? "Fotos de Entrada" : tipo === "saida" ? "Fotos de Saída" : "Fotos do Laudo"}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photosByType[tipo].map(p => (
                        <div key={p.id} className="relative group">
                          <img src={p.url} alt={`Foto ${tipo}`} className="w-full h-28 object-cover rounded-lg border" />
                          <button onClick={() => deletePhoto.mutate({ photoId: p.id })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
            {photos.length === 0 && <div className="text-center py-8 text-muted-foreground"><Camera className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>Nenhuma foto.</p></div>}
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico" className="mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Histórico de Status</CardTitle></CardHeader>
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

          {/* Auditoria */}
          <TabsContent value="auditoria" className="mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Auditoria de Alterações</CardTitle></CardHeader>
              <CardContent>
                {auditLog.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sem alterações registradas.</p> :
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
                }
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
