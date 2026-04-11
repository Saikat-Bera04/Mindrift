const DEFAULT_AUDIENCE = "mindrift";
const DEFAULT_KEY_ID = "mindrift-key-1";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

let cachedPrivateKey: CryptoKey | null = null;

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlEncodeText(value: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function parsePublicJwk(): JsonWebKey {
  const raw = mustEnv("JWT_PUBLIC_KEY_JWK");
  let jwk: JsonWebKey;
  try {
    jwk = JSON.parse(raw) as JsonWebKey;
  } catch {
    throw new Error("JWT_PUBLIC_KEY_JWK must be valid JSON");
  }

  if (jwk.kty !== "RSA" || !jwk.n || !jwk.e) {
    throw new Error("JWT_PUBLIC_KEY_JWK must be an RSA public JWK with kty, n, and e");
  }

  return {
    kty: "RSA",
    n: jwk.n,
    e: jwk.e,
    use: "sig",
    alg: "RS256",
    kid: getJwtKeyId(),
  } as JsonWebKey;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, "\n").trim();
  const body = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  return base64ToBytes(body).buffer as ArrayBuffer;
}

async function importPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }

  const privateKeyPem = mustEnv("JWT_PRIVATE_KEY_PEM");
  const pkcs8 = pemToArrayBuffer(privateKeyPem);

  cachedPrivateKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return cachedPrivateKey;
}

export function getJwtIssuer(): string {
  return process.env.JWT_ISSUER ?? mustEnv("CONVEX_SITE_URL");
}

export function getJwtAudience(): string {
  return process.env.JWT_AUDIENCE ?? DEFAULT_AUDIENCE;
}

export function getJwtKeyId(): string {
  return process.env.JWT_KEY_ID ?? DEFAULT_KEY_ID;
}

export function getAccessTokenTtlSeconds(): number {
  const raw = process.env.JWT_ACCESS_TOKEN_TTL_SECONDS;
  if (!raw) return DEFAULT_TTL_SECONDS;

  const ttl = Number(raw);
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error("JWT_ACCESS_TOKEN_TTL_SECONDS must be a positive number");
  }
  return Math.floor(ttl);
}

export function getJwksDocument() {
  return { keys: [parsePublicJwk()] };
}

type TokenClaimsInput = {
  subject: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
};

export async function signUserAccessToken(
  claims: TokenClaimsInput,
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + getAccessTokenTtlSeconds();

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: getJwtKeyId(),
  };

  const payload: Record<string, string | number> = {
    iss: getJwtIssuer(),
    aud: getJwtAudience(),
    sub: claims.subject,
    iat: now,
    exp: expiresAt,
    email: claims.email,
    name: claims.displayName,
  };

  if (claims.avatarUrl) {
    payload.picture = claims.avatarUrl;
  }

  const encodedHeader = base64UrlEncodeText(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  const encodedSignature = base64UrlEncodeBytes(new Uint8Array(signature));
  return { token: `${signingInput}.${encodedSignature}`, expiresAt };
}
