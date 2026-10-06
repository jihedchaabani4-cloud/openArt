/**
 * Next.js API Route — GET /api/ltx/status/[jobId]
 *
 * Polls an LTX async job status.
 * Returns { status, video_url } when completed.
 *
 * Query params:
 *   ?endpoint=text-to-video|image-to-video  (required — which LTX endpoint the job was submitted to)
 */

import { NextResponse } from "next/server";

const LTX_API_BASE = "https://api.ltx.io/v2";

export async function GET(req, { params }) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint") || "text-to-video";

    if (!jobId) {
      return NextResponse.json({ ok: false, message: "Missing jobId" }, { status: 400 });
    }

    if (!process.env.LTX_API_KEY) {
      return NextResponse.json(
        { ok: false, message: "LTX_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const response = await fetch(`${LTX_API_BASE}/${endpoint}/${jobId}`, {
      headers: { Authorization: `Bearer ${process.env.LTX_API_KEY}` },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, message: errData?.error?.message || `LTX API ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      status: data.status,         // "pending" | "processing" | "completed" | "failed"
      video_url: data.result?.video_url ?? null,
      error: data.error ?? null,
    });
  } catch (error) {
    console.error("[/api/ltx/status]", error);
    return NextResponse.json(
      { ok: false, message: error.message || "Status check failed." },
      { status: 500 }
    );
  }
}
