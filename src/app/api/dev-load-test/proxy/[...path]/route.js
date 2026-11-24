import { NextResponse } from "next/server";
import {
  buildAccountCookieHeader,
  getDevAccount,
  updateDevAccountTokens,
} from "@/features/load-test/devAccountStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guardDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

async function handleProxy(request, context) {
  const blocked = guardDevOnly();
  if (blocked) return blocked;

  const apiBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  if (!apiBaseUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_URL is not configured." }, { status: 500 });
  }

  const accountId = request.headers.get("x-load-test-account-id");
  const account = getDevAccount(accountId);
  if (!account) {
    return NextResponse.json(
      { error: "Connected Google account session not found. Re-connect account." },
      { status: 401 }
    );
  }

  const resolvedParams = await context.params;
  const segments = resolvedParams?.path;
  if (
    !Array.isArray(segments) ||
    segments.length === 0 ||
    segments.some((s) => !s || s === "." || s === ".." || s.includes("\\"))
  ) {
    return NextResponse.json({ error: "Invalid proxy path" }, { status: 400 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${apiBaseUrl}/${segments.map((s) => encodeURIComponent(s)).join("/")}${incomingUrl.search}`;

  const headers = new Headers();
  headers.set("cookie", buildAccountCookieHeader(account));
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstreamRes;
  try {
    upstreamRes = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody && body && body.byteLength > 0 ? body : undefined,
      signal: request.signal,
      cache: "no-store",
    });
  } catch (err) {
    const isAbort = err?.name === "AbortError";
    return NextResponse.json(
      { error: isAbort ? "Request aborted" : `Upstream request failed: ${err?.message || "Network error"}` },
      { status: isAbort ? 499 : 502 }
    );
  }

  if (typeof upstreamRes.headers.getSetCookie === "function") {
    const setCookies = upstreamRes.headers.getSetCookie();
    if (setCookies.length > 0) {
      updateDevAccountTokens(account.id, setCookies);
    }
  }

  if (upstreamRes.status === 204 || upstreamRes.status === 205) {
    return new NextResponse(null, { status: upstreamRes.status });
  }

  const responseBuffer = await upstreamRes.arrayBuffer();
  const outHeaders = new Headers();
  const upstreamContentType = upstreamRes.headers.get("content-type");
  if (upstreamContentType) {
    outHeaders.set("content-type", upstreamContentType);
  }
  outHeaders.set("cache-control", "no-store");

  return new NextResponse(responseBuffer, {
    status: upstreamRes.status,
    headers: outHeaders,
  });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PATCH = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
