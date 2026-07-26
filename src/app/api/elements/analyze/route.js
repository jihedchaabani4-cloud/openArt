import { NextResponse } from "next/server";
import { ElementVisionService } from "@/features/workflows/services/ElementVisionService";

/**
 * POST /api/elements/analyze
 * Ultra-clean API Route delegating vision analysis to ElementVisionService.
 */
export async function POST(req) {
  try {
    const { projectId, workflowId, imageUrls = [] } = await req.json();

    if (!projectId || !workflowId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: projectId and workflowId are required." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");

    const result = await ElementVisionService.analyzeElement({
      projectId,
      workflowId,
      imageUrls,
      headers: {
        authorization: authHeader,
        cookie: cookieHeader,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[VISION_ANALYSIS_ROUTE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze element vision." },
      { status: 500 }
    );
  }
}
