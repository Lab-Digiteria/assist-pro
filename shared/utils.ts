// ─── CPF/CNPJ Validation ─────────────────────────────────────────────────────

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const calc = (weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(cleaned[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  const d1 = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === parseInt(cleaned[12]) && d2 === parseInt(cleaned[13]);
}

export function validateIMEI(imei: string): boolean {
  const cleaned = imei.replace(/\D/g, "");
  if (cleaned.length !== 15) return false;
  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(cleaned[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// ─── OS Number Generator ─────────────────────────────────────────────────────
export function generateOsNumber(counter: number): string {
  const year = new Date().getFullYear();
  const seq = String(counter).padStart(4, "0");
  return `OS-${year}-${seq}`;
}

// ─── Slug Generator ──────────────────────────────────────────────────────────
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

// ─── Part Code Generator ─────────────────────────────────────────────────────
export function generatePartCode(counter: number): string {
  return `PÇ-${String(counter).padStart(6, "0")}`;
}

// ─── Status Labels ───────────────────────────────────────────────────────────
export const OS_STATUS_LABELS: Record<string, string> = {
  recebido: "Recebido",
  em_diagnostico: "Em Diagnóstico",
  aguardando_aprovacao: "Aguardando Aprovação",
  em_reparo: "Em Reparo",
  concluido: "Concluído",
  pronto_aguardando_retirada: "Pronto / Aguardando Retirada",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  devolvido_sem_reparo: "Devolvido sem Reparo",
};

export const CATEGORIA_LABELS: Record<string, string> = {
  smartphone: "Smartphone",
  tablet: "Tablet",
  notebook: "Notebook",
  desktop: "Desktop",
  smartwatch: "Smartwatch",
  console: "Console",
  tv: "TV",
  outro: "Outro",
};

export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_debito: "Cartão de Débito",
  cartao_credito: "Cartão de Crédito",
  faturamento_direto: "Faturamento Direto",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Ativo",
  past_due: "Pagamento Pendente",
  suspended: "Suspenso",
  canceled: "Cancelado",
  expired: "Expirado",
};

// ─── Plan Config ─────────────────────────────────────────────────────────────
// IMPORTANT: keys must match the planSlug enum in server/routers/billing.ts
export const PLANS = {
  mensal: {
    name: "Mensal",
    price: 9900, // centavos
    priceLabel: "R$ 99/mês",
    interval: "month" as const,
    trialDays: 14,
  },
  anual: {
    name: "Anual",
    price: 79900,
    priceLabel: "R$ 799/ano",
    interval: "year" as const,
    trialDays: 14,
  },
  vitalicio: {
    name: "Vitalício",
    price: 149900,
    priceLabel: "R$ 1.499 único",
    interval: null,
    trialDays: 0,
  },
} as const;

export const OS_STATUS_COLORS: Record<string, string> = {
  recebido: "bg-blue-100 text-blue-800",
  em_diagnostico: "bg-yellow-100 text-yellow-800",
  aguardando_aprovacao: "bg-orange-100 text-orange-800",
  em_reparo: "bg-purple-100 text-purple-800",
  concluido: "bg-green-100 text-green-800",
  pronto_aguardando_retirada: "bg-teal-100 text-teal-800",
  encerrado: "bg-gray-100 text-gray-700",
  cancelado: "bg-red-100 text-red-700",
  devolvido_sem_reparo: "bg-red-100 text-red-600",
};
