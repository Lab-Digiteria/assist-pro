/**
 * Nexar API Integration
 * Autenticação OAuth2 client_credentials + consulta GraphQL por Part Number
 */

interface NexarToken {
  access_token: string;
  expires_at: number; // timestamp em ms
}

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export interface NexarSellerOffer {
  seller: string;
  url: string | null;
  inStock: boolean;
  moq: number | null; // Minimum Order Quantity
  prices: Array<{ quantity: number; price: number; currency: string }>;
}

export interface NexarPartDetail {
  found: true;
  mpn: string;
  description: string;
  manufacturer: string;
  manufacturerUrl: string | null;
  category: string | null;
  subcategory: string | null;
  imageUrl: string | null;
  datasheetUrl: string | null;
  specs: Array<{ name: string; value: string }>;
  sellers: NexarSellerOffer[];
  /** Menor preço unitário entre distribuidores (qty=1) */
  referencePrice: number | null;
  referencePriceCurrency: string | null;
  /** Total de distribuidores com estoque */
  sellersWithStock: number;
}

export interface NexarPartNotFound {
  found: false;
}

export type NexarLookupResult = NexarPartDetail | NexarPartNotFound;

// ─── Cache de token em memória ────────────────────────────────────────────────
let cachedToken: NexarToken | null = null;

export async function getNexarToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expires_at > now + 60_000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.NEXAR_CLIENT_ID;
  const clientSecret = process.env.NEXAR_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("NEXAR_CLIENT_ID e NEXAR_CLIENT_SECRET não configurados");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch("https://identity.nexar.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Nexar auth failed: ${response.status} ${text}`);
  }

  const data = await response.json() as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

// ─── Query GraphQL completa ───────────────────────────────────────────────────
const NEXAR_FULL_QUERY = `
  query SearchPart($q: String!) {
    supSearchMpn(q: $q, limit: 1) {
      results {
        part {
          mpn
          shortDescription
          manufacturer {
            name
            homepageUrl
          }
          category {
            id
            name
          }
          bestImage {
            url
          }
          bestDatasheet {
            url
          }
          specs {
            attribute {
              name
            }
            displayValue
          }
          sellers(includeBrokers: false) {
            company {
              name
              homepageUrl
            }
            offers {
              clickUrl
              inventoryLevel
              moq
              prices {
                quantity
                price
                currency
              }
            }
          }
        }
      }
    }
  }
`;

// ─── Helpers internos ─────────────────────────────────────────────────────────

function extractLowestPrice(
  sellers: NexarSellerOffer[]
): { price: number; currency: string } | null {
  let lowest: { price: number; currency: string } | null = null;
  for (const seller of sellers) {
    const sorted = [...seller.prices].sort((a, b) => a.quantity - b.quantity);
    if (sorted.length === 0) continue;
    const candidate = sorted[0];
    if (candidate.price > 0 && (!lowest || candidate.price < lowest.price)) {
      lowest = { price: candidate.price, currency: candidate.currency };
    }
  }
  return lowest;
}

function parseSellers(rawSellers: any[]): NexarSellerOffer[] {
  const result: NexarSellerOffer[] = [];
  for (const s of rawSellers || []) {
    for (const offer of s.offers || []) {
      const prices = (offer.prices || [])
        .filter((p: any) => p.price > 0)
        .map((p: any) => ({
          quantity: p.quantity,
          price: p.price,
          currency: p.currency || "USD",
        }))
        .sort((a: any, b: any) => a.quantity - b.quantity);

      if (prices.length === 0) continue;

      result.push({
        seller: s.company?.name || "Distribuidor",
        url: offer.clickUrl || s.company?.homepageUrl || null,
        inStock: (offer.inventoryLevel ?? 0) > 0,
        moq: offer.moq ?? null,
        prices,
      });
    }
  }
  // Ordena: em estoque primeiro, depois por menor preço unitário
  return result.sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    const pa = a.prices[0]?.price ?? Infinity;
    const pb = b.prices[0]?.price ?? Infinity;
    return pa - pb;
  });
}

// ─── Função principal de consulta ─────────────────────────────────────────────

export async function lookupPartNumber(partNumber: string): Promise<NexarLookupResult> {
  const token = await getNexarToken();

  const response = await fetch("https://api.nexar.com/graphql/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: NEXAR_FULL_QUERY,
      variables: { q: partNumber },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Nexar GraphQL failed: ${response.status} ${text}`);
  }

  const data = await response.json() as {
    data?: {
      supSearchMpn?: {
        results?: Array<{ part?: any }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.errors && data.errors.length > 0) {
    throw new Error(`Nexar GraphQL error: ${data.errors[0].message}`);
  }

  const results = data.data?.supSearchMpn?.results;
  if (!results || results.length === 0 || !results[0].part) {
    return { found: false };
  }

  const part = results[0].part;

  const specs = (part.specs || [])
    .filter((s: any) => s.attribute?.name && s.displayValue)
    .slice(0, 20)
    .map((s: any) => ({ name: s.attribute.name, value: s.displayValue }));

  const sellers = parseSellers(part.sellers || []);
  const lowestPrice = extractLowestPrice(sellers);

  return {
    found: true,
    mpn: part.mpn,
    description: part.shortDescription || "",
    manufacturer: part.manufacturer?.name || "",
    manufacturerUrl: part.manufacturer?.homepageUrl || null,
    category: part.category?.name || null,
    subcategory: null,
    imageUrl: part.bestImage?.url || null,
    datasheetUrl: part.bestDatasheet?.url || null,
    specs,
    sellers,
    referencePrice: lowestPrice?.price ?? null,
    referencePriceCurrency: lowestPrice?.currency ?? null,
    sellersWithStock: sellers.filter((s) => s.inStock).length,
  };
}
