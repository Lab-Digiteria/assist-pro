/**
 * Nexar API Integration
 * Autenticação OAuth2 client_credentials + consulta GraphQL por Part Number
 */

interface NexarToken {
  access_token: string;
  expires_at: number; // timestamp em ms
}

interface NexarPartResult {
  found: true;
  mpn: string;
  description: string;
  manufacturer: string;
  specs: Array<{ name: string; value: string }>;
}

interface NexarPartNotFound {
  found: false;
}

export type NexarLookupResult = NexarPartResult | NexarPartNotFound;

// Cache de token em memória
let cachedToken: NexarToken | null = null;

async function getNexarToken(): Promise<string> {
  const now = Date.now();

  // Retorna token cacheado se ainda válido (com margem de 60s)
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

const NEXAR_QUERY = `
  query SearchPart($q: String!) {
    supSearchMpn(q: $q, limit: 1) {
      results {
        part {
          mpn
          shortDescription
          manufacturer {
            name
          }
          specs {
            attribute {
              name
            }
            displayValue
          }
        }
      }
    }
  }
`;

export async function lookupPartNumber(partNumber: string): Promise<NexarLookupResult> {
  const token = await getNexarToken();

  const response = await fetch("https://api.nexar.com/graphql/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: NEXAR_QUERY,
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
        results?: Array<{
          part?: {
            mpn: string;
            shortDescription: string;
            manufacturer?: { name: string };
            specs?: Array<{ attribute?: { name: string }; displayValue: string }>;
          };
        }>;
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
    .filter((s) => s.attribute?.name && s.displayValue)
    .slice(0, 10)
    .map((s) => ({
      name: s.attribute!.name,
      value: s.displayValue,
    }));

  return {
    found: true,
    mpn: part.mpn,
    description: part.shortDescription || "",
    manufacturer: part.manufacturer?.name || "",
    specs,
  };
}
