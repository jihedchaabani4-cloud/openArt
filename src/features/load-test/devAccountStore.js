const STORE_KEY = "__loadTestGoogleAccountStore";

function getStoreMap() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = new Map();
  }
  return globalThis[STORE_KEY];
}

function toPublicAccount(record) {
  if (!record) return null;
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    avatar: record.avatar,
    capturedAt: record.capturedAt,
  };
}

export function upsertDevAccount({ id, email, name = null, avatar = null, accessToken, refreshToken = null }) {
  if (!id || !accessToken) {
    throw new Error("Account id and accessToken are required");
  }
  const key = String(id);
  const record = {
    id: key,
    email: email ? String(email) : key,
    name: name ? String(name) : null,
    avatar: avatar ? String(avatar) : null,
    accessToken: String(accessToken),
    refreshToken: refreshToken ? String(refreshToken) : null,
    capturedAt: new Date().toISOString(),
  };
  getStoreMap().set(key, record);
  return toPublicAccount(record);
}

export function getDevAccount(accountId) {
  if (!accountId) return null;
  return getStoreMap().get(String(accountId)) || null;
}

export function listPublicDevAccounts() {
  return Array.from(getStoreMap().values()).map(toPublicAccount);
}

export function removeDevAccount(accountId) {
  if (!accountId) return false;
  return getStoreMap().delete(String(accountId));
}

export function clearDevAccounts() {
  getStoreMap().clear();
}

export function buildAccountCookieHeader(account) {
  if (!account?.accessToken) return "";
  const parts = [`access_token=${account.accessToken}`];
  if (account.refreshToken) {
    parts.push(`refresh_token=${account.refreshToken}`);
  }
  return parts.join("; ");
}

export function extractAuthCookiesFromSetCookie(setCookieHeaders = []) {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : typeof setCookieHeaders === "string"
      ? [setCookieHeaders]
      : [];
  const tokens = {};
  for (const raw of list) {
    if (typeof raw !== "string") continue;
    const firstPair = raw.split(";")[0]?.trim();
    if (!firstPair) continue;
    const eqIdx = firstPair.indexOf("=");
    if (eqIdx <= 0) continue;
    const name = firstPair.slice(0, eqIdx).trim();
    const value = firstPair.slice(eqIdx + 1).trim();
    if (name === "access_token" && value) tokens.accessToken = value;
    if (name === "refresh_token" && value) tokens.refreshToken = value;
  }
  return tokens;
}

export function updateDevAccountTokens(accountId, setCookieHeaders) {
  const existing = getDevAccount(accountId);
  if (!existing) return;
  const next = extractAuthCookiesFromSetCookie(setCookieHeaders);
  if (next.accessToken) existing.accessToken = next.accessToken;
  if (next.refreshToken) existing.refreshToken = next.refreshToken;
}
