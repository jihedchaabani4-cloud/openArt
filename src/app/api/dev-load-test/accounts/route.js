import { NextResponse } from "next/server";
import {
  clearDevAccounts,
  extractAuthCookiesFromSetCookie,
  listPublicDevAccounts,
  removeDevAccount,
  upsertDevAccount,
} from "@/features/load-test/devAccountStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guardDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

function getApiBaseUrl() {
  return String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
}

function extractJwtSub(jwtToken) {
  try {
    const parts = String(jwtToken || "").split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload?.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const blocked = guardDevOnly();
  if (blocked) return blocked;
  return NextResponse.json({ accounts: listPublicDevAccounts() });
}

export async function POST(request) {
  const blocked = guardDevOnly();
  if (blocked) return blocked;

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_URL is not configured." }, { status: 500 });
  }

  const accessToken = request.cookies.get("access_token")?.value || "";
  const refreshToken = request.cookies.get("refresh_token")?.value || "";
  if (!accessToken && !refreshToken) {
    return NextResponse.json(
      { error: "No active Google session cookie found on localhost. Sign in with Google first." },
      { status: 401 }
    );
  }

  const cookieParts = [];
  if (accessToken) cookieParts.push(`access_token=${accessToken}`);
  if (refreshToken) cookieParts.push(`refresh_token=${refreshToken}`);

  let upstreamRes;
  try {
    upstreamRes = await fetch(`${apiBaseUrl}/auth/me`, {
      method: "GET",
      headers: { cookie: cookieParts.join("; ") },
      cache: "no-store",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot reach backend API (${apiBaseUrl}): ${err?.message || "Network error"}` },
      { status: 502 }
    );
  }

  if (!upstreamRes.ok) {
    return NextResponse.json(
      { error: `Backend rejected session (${upstreamRes.status}).` },
      { status: upstreamRes.status }
    );
  }

  const payload = await upstreamRes.json().catch(() => null);
  const user = payload?.user ?? null;
  if (!user || (!user.id && !user.email && !user.name)) {
    return NextResponse.json(
      { error: "Google session expired or invalid. Sign in with Google again." },
      { status: 401 }
    );
  }

  // Prefer refreshed cookies if /auth/me rotated tokens
  const setCookies =
    typeof upstreamRes.headers.getSetCookie === "function"
      ? upstreamRes.headers.getSetCookie()
      : [];
  const rotated = extractAuthCookiesFromSetCookie(setCookies);
  const effectiveAccess = rotated.accessToken || accessToken;
  const effectiveRefresh = rotated.refreshToken || refreshToken;

  if (!effectiveAccess) {
    return NextResponse.json(
      { error: "Missing access token for Google session." },
      { status: 401 }
    );
  }

  // Backend /auth/me returns mapSessionUser({ name, email, image }) without user.id
  const resolvedId =
    user.id ||
    extractJwtSub(effectiveAccess) ||
    (user.email ? String(user.email).trim().toLowerCase() : null) ||
    String(user.name);

  const account = upsertDevAccount({
    id: resolvedId,
    email: user.email || user.name || resolvedId,
    name: user.name || user.full_name || null,
    avatar: user.image || user.avatar_url || user.avatar || null,
    accessToken: effectiveAccess,
    refreshToken: effectiveRefresh || null,
  });

  return NextResponse.json({
    account,
    accounts: listPublicDevAccounts(),
  });
}

export async function DELETE(request) {
  const blocked = guardDevOnly();
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("all") === "1") {
    clearDevAccounts();
  } else {
    const id = searchParams.get("id");
    if (id) removeDevAccount(id);
  }

  return NextResponse.json({ accounts: listPublicDevAccounts() });
}
