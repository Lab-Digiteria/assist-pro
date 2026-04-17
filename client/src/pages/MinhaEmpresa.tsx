import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Building2, Upload, Palette, Phone, MapPin, FileText, Save, AlertCircle } from "lucide-react";

function applyMask(value: string, mask: string) {
  let v = value.replace(/\D/g, "");
  let result = "";
  let vi = 0;
  for (let i = 0; i < mask.length && vi < v.length; i++) {
    if (mask[i] === "#") { result += v[vi++]; }
    else { result += mask[i]; }
  }
  return result;
}

function cnpjMask(v: string) { return applyMask(v, "##.###.###/####-##"); }
function phoneMask(v: string) {
  const d = v.replace(/\D/g, "");
  if (d.length <= 10) return applyMask(v, "(##) ####-####");
  return applyMask(v, "(##) #####-####");
}
function cepMask(v: string) { return applyMask(v, "#####-###"); }

const EMPTY_FORM = {
  companyName: "", tradeName: "", cnpj: "", stateRegistration: "", municipalRegistration: "",
  phonePrimary: "", phoneSecondary: "", whatsapp: "", emailPrimary: "", emailSecondary: "", website: "",
  zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  primaryColor: "#1B4F8A", secondaryColor: "#C4733A",
  documentHeaderText: "", documentFooterText: "", warrantyText: "", osTerms: "",
};

export default function MinhaEmpresa() {
  const { data: settings, isLoading, refetch } = trpc.companySettings.get.useQuery();
  const update = trpc.companySettings.update.useMutation({
    onSuccess: () => { toast.success("Dados da empresa salvos!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const uploadLogo = trpc.companySettings.uploadLogo.useMutation({
    onSuccess: (data) => { toast.success("Logo enviada!"); setLogoPreview(data.logoUrl); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        companyName: settings.companyName ?? "",
        tradeName: settings.tradeName ?? "",
        cnpj: settings.cnpj ?? "",
        stateRegistration: settings.stateRegistration ?? "",
        municipalRegistration: settings.municipalRegistration ?? "",
        phonePrimary: settings.phonePrimary ?? "",
        phoneSecondary: settings.phoneSecondary ?? "",
        whatsapp: settings.whatsapp ?? "",
        emailPrimary: settings.emailPrimary ?? "",
        emailSecondary: settings.emailSecondary ?? "",
        website: settings.website ?? "",
        zipCode: settings.zipCode ?? "",
        street: settings.street ?? "",
        number: settings.number ?? "",
        complement: settings.complement ?? "",
        neighborhood: settings.neighborhood ?? "",
        city: settings.city ?? "",
        state: settings.state ?? "",
        primaryColor: settings.primaryColor ?? "#1B4F8A",
        secondaryColor: settings.secondaryColor ?? "#C4733A",
        documentHeaderText: settings.documentHeaderText ?? "",
        documentFooterText: settings.documentFooterText ?? "",
        warrantyText: settings.warrantyText ?? "",
        osTerms: settings.osTerms ?? "",
      });
      if (settings.logoUrl) setLogoPreview(settings.logoUrl);
    }
  }, [settings]);

  const handleCepBlur = async () => {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro ?? f.street,
          neighborhood: data.bairro ?? f.neighborhood,
          city: data.localidade ?? f.city,
          state: data.uf ?? f.state,
        }));
      }
    } catch {}
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo deve ter no máximo 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setLogoPreview(ev.target?.result as string);
      uploadLogo.mutate({ base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    update.mutate({
      companyName: form.companyName || undefined,
      tradeName: form.tradeName || undefined,
      cnpj: form.cnpj || undefined,
      stateRegistration: form.stateRegistration || undefined,
      municipalRegistration: form.municipalRegistration || undefined,
      phonePrimary: form.phonePrimary || undefined,
      phoneSecondary: form.phoneSecondary || undefined,
      whatsapp: form.whatsapp || undefined,
      emailPrimary: form.emailPrimary || undefined,
      emailSecondary: form.emailSecondary || undefined,
      website: form.website || undefined,
      zipCode: form.zipCode || undefined,
      street: form.street || undefined,
      number: form.number || undefined,
      complement: form.complement || undefined,
      neighborhood: form.neighborhood || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      documentHeaderText: form.documentHeaderText || undefined,
      documentFooterText: form.documentFooterText || undefined,
      warrantyText: form.warrantyText || undefined,
      osTerms: form.osTerms || undefined,
    });
  };

  const isIncomplete = !form.companyName || !form.phonePrimary;

  if (isLoading) return (
    <AppLayout title="Minha Empresa">
      <div className="text-center py-12 text-muted-foreground">Carregando...</div>
    </AppLayout>
  );

  return (
    <AppLayout title="Minha Empresa">
      <div className="max-w-3xl mx-auto space-y-6">
        {isIncomplete && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">Complete o cadastro da sua empresa para personalizar seus documentos (OS, orçamentos, recibos).</p>
          </div>
        )}

        {/* Identidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4" />Identidade da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-muted/30 flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-center text-muted-foreground text-xs p-2">
                    <Upload className="w-6 h-6 mx-auto mb-1" />Logo
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Logomarca</p>
                <p className="text-xs text-muted-foreground">PNG ou JPG, máximo 2MB. Aparece no cabeçalho de todos os documentos.</p>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadLogo.isPending}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploadLogo.isPending ? "Enviando..." : "Escolher arquivo"}
                </Button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <Label>Razão Social</Label>
                <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Empresa Ltda" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Nome Fantasia <span className="text-xs text-muted-foreground">(usado nos documentos)</span></Label>
                <Input value={form.tradeName} onChange={e => setForm(f => ({ ...f, tradeName: e.target.value }))} placeholder="Nome Fantasia" />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: cnpjMask(e.target.value) }))} placeholder="00.000.000/0000-00" maxLength={18} />
              </div>
              <div>
                <Label>Inscrição Estadual</Label>
                <Input value={form.stateRegistration} onChange={e => setForm(f => ({ ...f, stateRegistration: e.target.value }))} placeholder="000.000.000.000" />
              </div>
              <div>
                <Label>Inscrição Municipal</Label>
                <Input value={form.municipalRegistration} onChange={e => setForm(f => ({ ...f, municipalRegistration: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="w-4 h-4" />Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone Principal</Label>
                <Input value={form.phonePrimary} onChange={e => setForm(f => ({ ...f, phonePrimary: phoneMask(e.target.value) }))} placeholder="(11) 99999-9999" maxLength={15} />
              </div>
              <div>
                <Label>Telefone Secundário</Label>
                <Input value={form.phoneSecondary} onChange={e => setForm(f => ({ ...f, phoneSecondary: phoneMask(e.target.value) }))} placeholder="(11) 3333-4444" maxLength={15} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: phoneMask(e.target.value) }))} placeholder="(11) 99999-9999" maxLength={15} />
              </div>
              <div>
                <Label>E-mail Principal</Label>
                <Input type="email" value={form.emailPrimary} onChange={e => setForm(f => ({ ...f, emailPrimary: e.target.value }))} placeholder="contato@empresa.com" />
              </div>
              <div>
                <Label>E-mail Secundário <span className="text-xs text-muted-foreground">(financeiro, NF)</span></Label>
                <Input type="email" value={form.emailSecondary} onChange={e => setForm(f => ({ ...f, emailSecondary: e.target.value }))} placeholder="financeiro@empresa.com" />
              </div>
              <div>
                <Label>Site</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://empresa.com" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4" />Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                <Input value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: cepMask(e.target.value) }))} onBlur={handleCepBlur} placeholder="00000-000" maxLength={9} />
              </div>
              <div className="col-span-2">
                <Label>Logradouro</Label>
                <Input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="Rua, Avenida..." />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="123" />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input value={form.complement} onChange={e => setForm(f => ({ ...f, complement: e.target.value }))} placeholder="Sala 2, Apto..." />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label>Estado (UF)</Label>
                <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="SP" maxLength={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identidade Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="w-4 h-4" />Identidade Visual para Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor Primária</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-border" />
                  <Input value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="font-mono" maxLength={7} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Usada no cabeçalho da OS e documentos</p>
              </div>
              <div>
                <Label>Cor Secundária</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-border" />
                  <Input value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="font-mono" maxLength={7} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Usada em destaques e botões dos documentos</p>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg overflow-hidden border">
              <div className="px-4 py-3 text-white text-sm font-semibold flex items-center gap-3" style={{ background: form.primaryColor }}>
                {logoPreview && <img src={logoPreview} alt="Logo" className="h-8 w-auto object-contain bg-white rounded p-0.5" />}
                <div>
                  <p className="font-bold">{form.tradeName || form.companyName || "Nome da Empresa"}</p>
                  <p className="text-xs opacity-80">{form.documentHeaderText || "Slogan ou texto do cabeçalho"}</p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
                {form.documentFooterText || "Texto do rodapé aparecerá aqui"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Textos dos Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4" />Textos dos Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Texto do Cabeçalho <span className="text-xs text-muted-foreground">(slogan, tagline)</span></Label>
              <Input value={form.documentHeaderText} onChange={e => setForm(f => ({ ...f, documentHeaderText: e.target.value }))} placeholder="Ex: Especialistas em smartphones e tablets" />
            </div>
            <div>
              <Label>Texto do Rodapé</Label>
              <Textarea value={form.documentFooterText} onChange={e => setForm(f => ({ ...f, documentFooterText: e.target.value }))} rows={2} placeholder="Ex: Obrigado pela preferência! Horário de atendimento: Seg-Sex 9h-18h" />
            </div>
            <div>
              <Label>Texto de Garantia Padrão</Label>
              <Textarea value={form.warrantyText} onChange={e => setForm(f => ({ ...f, warrantyText: e.target.value }))} rows={3} placeholder="Ex: Garantia de 90 dias para peças e serviços. A garantia cobre defeitos de fabricação e mão de obra..." />
            </div>
            <div>
              <Label>Termos e Condições da OS</Label>
              <Textarea value={form.osTerms} onChange={e => setForm(f => ({ ...f, osTerms: e.target.value }))} rows={5} placeholder="Ex: 1. O prazo de entrega é estimado e pode variar... 2. Equipamentos não retirados em 90 dias..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={update.isPending} className="px-8" style={{ background: "#1B4F8A" }}>
            <Save className="w-4 h-4 mr-2" />
            {update.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
