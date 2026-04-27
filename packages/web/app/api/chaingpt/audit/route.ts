import { NextRequest, NextResponse } from "next/server";
import { auditContract } from "@/lib/chaingpt";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code: string };
    const report = await auditContract(code);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
