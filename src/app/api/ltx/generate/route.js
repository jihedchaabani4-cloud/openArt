/**
 * Next.js API Route — POST /api/ltx/generate
 *
 * Proxy endpoint for LTX video generation.
 * Receives the serialized PromptBar payload, submits it to LTX API,
 * then returns the job ID to the frontend for polling.
 *
 * The frontend's useGenerateMutation will call the internal backend (/video/generated).
 * If the internal backend detects an LTX model, it should forward here.
 * Alternatively, call this endpoint directly from the page's onGenerate handler.
 */

import { NextResponse } from "next/server";
import { submitLtxGeneration, isLtxModel } from "@/features/prompt-bar/providers/ltx/ltxClient";

export async function POST(req) {
  try {
    const payload = await req.json();
    const { model } = payload;

    if (!model || !isLtxModel(model)) {
      return NextResponse.json(
        { ok: false, message: `Not an LTX model: ${model}` },
        { status: 400 }
      );
    }

    if (!process.env.LTX_API_KEY) {
      return NextResponse.json(
        { ok: false, message: "LTX_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Submit async job to LTX
    const job = await submitLtxGeneration(payload);

    // Return job info — frontend can poll /api/ltx/status/:id
    return NextResponse.json({
      ok: true,
      job_id: job.id,
      created_at: job.created_at,
      provider: "ltx",
    });
  } catch (error) {
    console.error("[/api/ltx/generate]", error);
    return NextResponse.json(
      { ok: false, message: error.message || "LTX generation failed." },
      { status: 500 }
    );
  }
}
