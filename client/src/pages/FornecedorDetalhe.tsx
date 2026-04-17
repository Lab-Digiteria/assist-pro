import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Star,
  Pencil,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Briefcase,
  Package,
  CreditCard,
  FileText,
  Plus,
  Download,
  Upload,
  Loader2,
  Calendar,
  ExternalLink,
  X,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type BankAccount = {
  id: number;
  bankName?: string | null;
  bankCode?: string | null;
  accountType?: "corrente" | "poupanca" | "pagamento" | null;
  agency?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
  isDefault?: boolean | null;
};

type Document = {
  id: number;
  name: string;
  mimeType?: string | null;
  fileUrl: string;
  documentType?: string | null;
  uploadedAt?: Date | string | null;
};

const BANK_ACCOUNT_TYPES = [
  { label: "Corrente", value: "corrente" },
  { label: "Poupança", value: "poupanca" },
  { label: "Pagamento", value: "pagamento" },
];

const PIX_KEY_TYPES = [
  { label: "CPF", value: "cpf" },
  { label: "CNPJ", value: "cnpj" },
  { label: "E-mail", value: "email" },
  { label: "Celular", value: "celular" },
  { label: "Chave Aleatória", value: "aleatoria" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

// ─── Modal Conta Bancária ─────────────────────────────────────────────────────
function BankAccountModal({
  open,
  onClose,
  supplierId,
  account,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  supplierId: number;
  account?: BankAccount | null;
  onSaved: () => void;
}) {
  const isEdit = !!account;
  const [form, setForm] = useState({
    bankName: account?.bankName || "",
    bankCode: account?.bankCode || "",
    accountType: (account?.accountType || "corrente") as "corrente" | "poupanca" | "pagamento",
    agency: account?.agency || "",
    accountNumber: account?.accountNumber || "",
    accountHolder: account?.accountHolder || "",
    pixKey: account?.pixKey || "",
    pixKeyType: (account?.pixKeyType || "") as "cpf" | "cnpj" | "email" | "telefone" | "aleatoria" | "",
    isDefault: account?.isDefault || false,
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const addMutation = trpc.suppliers.addBankAccount.useMutation({
    onSuccess: () => { toast.success("Conta bancária adicionada"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.suppliers.updateBankAccount.useMutation({
    onSuccess: () => { toast.success("Conta bancária atualizada"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      supplierId,
      bankName: form.bankName,
      bankCode: form.bankCode || undefined,
      accountType: form.accountType,
      agency: form.agency,
      accountNumber: form.accountNumber,
      accountHolder: form.accountHolder,
      pixKey: form.pixKey || undefined,
      pixKeyType: form.pixKeyType || undefined,
      isDefault: form.isDefault,
    };
    if (isEdit && account) {
      updateMutation.mutate({ id: account.id, ...payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Conta Bancária" : "Nova Conta Bancária"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Nome do Banco *</Label>
              <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} required placeholder="Ex: Banco do Brasil" />
            </div>
            <div className="space-y-1">
              <Label>Código do Banco</Label>
              <Input value={form.bankCode} onChange={(e) => set("bankCode", e.target.value)} placeholder="001" />
            </div>
            <div className="space-y-1">
              <Label>Tipo de Conta *</Label>
              <Select value={form.accountType} onValueChange={(v) => set("accountType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BANK_ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Agência *</Label>
              <Input value={form.agency} onChange={(e) => set("agency", e.target.value)} required placeholder="0001" />
            </div>
            <div className="space-y-1">
              <Label>Número da Conta *</Label>
              <Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} required placeholder="12345-6" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Titular da Conta *</Label>
              <Input value={form.accountHolder} onChange={(e) => set("accountHolder", e.target.value)} required placeholder="Nome do titular" />
            </div>
            <div className="space-y-1">
              <Label>Chave PIX</Label>
              <Input value={form.pixKey} onChange={(e) => set("pixKey", e.target.value)} placeholder="Chave PIX" />
            </div>
            <div className="space-y-1">
              <Label>Tipo de Chave PIX</Label>
              <Select value={form.pixKeyType} onValueChange={(v) => set("pixKeyType", v)}>
                <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                <SelectContent>
                  {PIX_KEY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isDefault">Conta principal</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function FornecedorDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const supplierId = Number(id);

  const [bankModal, setBankModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = trpc.suppliers.getById.useQuery({ id: supplierId });

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => { toast.success("Fornecedor excluído"); navigate("/fornecedores"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteBankAccount = trpc.suppliers.deleteBankAccount.useMutation({
    onSuccess: () => { refetch(); toast.success("Conta removida"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteDocument = trpc.suppliers.deleteDocument.useMutation({
    onSuccess: () => { refetch(); toast.success("Documento removido"); },
    onError: (e) => toast.error(e.message),
  });

  const uploadDocument = trpc.suppliers.uploadDocument.useMutation({
    onSuccess: () => { refetch(); toast.success("Documento enviado"); setUploadingDoc(false); },
    onError: (e) => { toast.error(e.message); setUploadingDoc(false); },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadDocument.mutate({
        supplierId,
        name: file.name,
        fileName: file.name,
        mimeType: file.type,
        fileBase64: base64,
        fileSizeBytes: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <AppLayout title="Fornecedor">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout title="Fornecedor">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Fornecedor não encontrado.</p>
          <Button variant="link" onClick={() => navigate("/fornecedores")}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  const s = data;
  const bankAccounts = (s.bankAccounts || []) as unknown as BankAccount[];
  const documents = (s.documents || []) as unknown as Document[];

  return (
    <AppLayout title={s.tradeName || s.corporateName || "Fornecedor"}>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{s.tradeName || s.corporateName}</h1>
              {s.isPreferred && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-600 gap-1">
                  <Star className="w-3 h-3 fill-yellow-400" />Preferencial
                </Badge>
              )}
              <Badge variant={s.isActive ? "default" : "secondary"}>
                {s.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            {s.tradeName && <p className="text-sm text-muted-foreground mt-0.5">{s.corporateName}</p>}
            {s.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {s.cnpj}</p>}
            {s.rating && (
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-4 h-4 ${star <= s.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/fornecedores/${id}/editar`)}>
            <Pencil className="w-4 h-4 mr-2" />Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(`Excluir "${s.tradeName || s.corporateName}"?`)) {
                deleteMutation.mutate({ id: supplierId });
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />Excluir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados" className="gap-2">
            <Building2 className="w-4 h-4" />Dados Gerais
          </TabsTrigger>
          <TabsTrigger value="bancario" className="gap-2">
            <CreditCard className="w-4 h-4" />Dados Bancários
            {bankAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{bankAccounts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="w-4 h-4" />Documentos
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{documents.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Dados Gerais ── */}
        <TabsContent value="dados" className="space-y-6 pt-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <Section title="Identificação">
                <InfoRow label="Tipo" value={s.companyType === "juridica" ? "Pessoa Jurídica" : "Pessoa Física"} />
                <InfoRow label="Razão Social" value={s.corporateName} />
                {s.tradeName && <InfoRow label="Nome Fantasia" value={s.tradeName} />}
                <InfoRow label="CNPJ" value={s.cnpj} />
                <InfoRow label="CPF" value={s.cpf} />
                <InfoRow label="Inscrição Estadual" value={s.stateRegistration} />
                <InfoRow label="Inscrição Municipal" value={s.municipalRegistration} />
                <InfoRow label="CNAE" value={s.cnae} />
                <InfoRow label="Data de Fundação" value={s.foundingDate ? new Date(s.foundingDate).toLocaleDateString("pt-BR") : null} />
              </Section>

              <hr className="border-border" />

              <Section title="Contato">
                <InfoRow label="E-mail Principal" value={s.emailPrimary} />
                <InfoRow label="E-mail Secundário" value={s.emailSecondary} />
                <InfoRow label="Telefone Fixo" value={s.phoneLandline} />
                <InfoRow label="Celular" value={s.phoneMobile} />
                <InfoRow label="WhatsApp" value={s.phoneWhatsapp} />
                <InfoRow label="Nome do Contato" value={s.contactName} />
                <InfoRow label="Cargo" value={s.contactRole} />
                {s.website && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Website</span>
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
                      {s.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </Section>

              {(s.street || s.city) && (
                <>
                  <hr className="border-border" />
                  <Section title="Endereço">
                    <InfoRow label="CEP" value={s.zipCode} />
                    <InfoRow label="Logradouro" value={s.street} />
                    <InfoRow label="Número" value={s.number} />
                    <InfoRow label="Complemento" value={s.complement} />
                    <InfoRow label="Bairro" value={s.neighborhood} />
                    <InfoRow label="Cidade" value={s.city} />
                    <InfoRow label="Estado" value={s.state} />
                    <InfoRow label="País" value={s.country} />
                  </Section>
                </>
              )}

              {(s.paymentTerms || s.minimumOrder || s.averageDeliveryDays) && (
                <>
                  <hr className="border-border" />
                  <Section title="Dados Comerciais">
                    <InfoRow label="Prazo de Pagamento" value={s.paymentTerms} />
                    <InfoRow label="Forma de Pagamento" value={s.paymentMethodPreferred} />
                    <InfoRow label="Pedido Mínimo" value={s.minimumOrder ? `R$ ${parseFloat(s.minimumOrder).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null} />
                    <InfoRow label="Prazo Médio de Entrega" value={s.averageDeliveryDays ? `${s.averageDeliveryDays} dias` : null} />
                    <InfoRow label="Desconto" value={s.discountPercentage ? `${s.discountPercentage}%` : null} />
                    <InfoRow label="Limite de Crédito" value={s.creditLimit ? `R$ ${parseFloat(s.creditLimit).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : null} />
                  </Section>
                  {s.observationsCommercial && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Observações Comerciais</p>
                      <p className="text-sm bg-muted rounded-md p-3">{s.observationsCommercial}</p>
                    </div>
                  )}
                </>
              )}

              {(Array.isArray(s.supplierCategory) && s.supplierCategory.length > 0) || (Array.isArray(s.brandsSupplied) && s.brandsSupplied.length > 0) ? (
                <>
                  <hr className="border-border" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Produtos e Marcas</h3>
                    {Array.isArray(s.supplierCategory) && s.supplierCategory.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Categorias</p>
                        <div className="flex flex-wrap gap-1">
                          {(s.supplierCategory as string[]).map((cat) => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(s.brandsSupplied) && s.brandsSupplied.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Marcas Fornecidas</p>
                        <div className="flex flex-wrap gap-1">
                          {(s.brandsSupplied as string[]).map((brand) => (
                            <Badge key={brand} variant="outline">{brand}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(s.productLines) && s.productLines.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Linhas de Produtos</p>
                        <div className="flex flex-wrap gap-1">
                          {(s.productLines as string[]).map((pl) => (
                            <Badge key={pl} variant="outline">{pl}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.catalogUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Catálogo</p>
                        <a href={s.catalogUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 hover:underline">
                          Acessar catálogo <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {(s.rating || s.ratingNotes || s.firstPurchaseDate) && (
                <>
                  <hr className="border-border" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Avaliação</h3>
                    {s.rating && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Avaliação Geral</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-5 h-5 ${star <= s.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">{s.rating}/5</span>
                        </div>
                      </div>
                    )}
                    {s.ratingNotes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm bg-muted rounded-md p-3">{s.ratingNotes}</p>
                      </div>
                    )}
                    {s.firstPurchaseDate && (
                      <InfoRow label="Primeira Compra" value={new Date(s.firstPurchaseDate).toLocaleDateString("pt-BR")} />
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Dados Bancários ── */}
        <TabsContent value="bancario" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Contas Bancárias</h2>
            <Button size="sm" onClick={() => { setEditingAccount(null); setBankModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />Adicionar Conta
            </Button>
          </div>
          {bankAccounts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma conta bancária cadastrada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((acc) => (
                <Card key={acc.id} className={acc.isDefault ? "border-primary/50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{acc.bankName}</span>
                          {acc.bankCode && <span className="text-xs text-muted-foreground">({acc.bankCode})</span>}
                          {acc.isDefault && <Badge variant="default" className="text-xs">Principal</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {BANK_ACCOUNT_TYPES.find((t) => t.value === acc.accountType)?.label || acc.accountType} •
                          Ag: {acc.agency} • Conta: {acc.accountNumber}
                        </p>
                        <p className="text-sm">{acc.accountHolder || ""}</p>
                        {acc.pixKey && (
                          <p className="text-xs text-muted-foreground">
                            PIX ({PIX_KEY_TYPES.find((t) => t.value === acc.pixKeyType)?.label || acc.pixKeyType}): {acc.pixKey}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditingAccount(acc); setBankModal(true); }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Remover esta conta bancária?")) {
                              deleteBankAccount.mutate({ id: acc.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Documentos ── */}
        <TabsContent value="documentos" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Documentos</h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Enviar Documento
              </Button>
            </div>
          </div>
          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum documento enviado.</p>
                <p className="text-xs text-muted-foreground mt-1">Envie contratos, certificados, catálogos, etc.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          {doc.documentType && (
                            <p className="text-xs text-muted-foreground truncate">{doc.documentType}</p>
                          )}
                          {doc.uploadedAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Remover este documento?")) {
                              deleteDocument.mutate({ id: doc.id });
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Conta Bancária */}
      <BankAccountModal
        open={bankModal}
        onClose={() => setBankModal(false)}
        supplierId={supplierId}
        account={editingAccount}
        onSaved={refetch}
      />
    </div>
    </AppLayout>
  );
}
