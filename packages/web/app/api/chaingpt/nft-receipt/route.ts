import { NextRequest, NextResponse } from "next/server";
import { generateNftReceipt } from "@/lib/chaingpt";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const { pair, intentId, mode } = (await req.json()) as {
      pair?: string;
      intentId?: string;
      mode?: "Direct" | "RFQ";
    };
    if (!pair || !intentId || !mode) {
      return NextResponse.json(
        { error: "pair, intentId, mode required" },
        { status: 400 },
      );
    }
    const receipt = await generateNftReceipt({ pair, intentId, mode });
    return NextResponse.json(receipt);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
