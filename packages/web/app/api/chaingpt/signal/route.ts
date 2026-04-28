import { NextRequest, NextResponse } from "next/server";
import { getMarketSignal } from "@/lib/chaingpt";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { pair } = (await req.json()) as { pair?: string };
    if (!pair) {
      return NextResponse.json(
        { error: "pair (e.g. 'cETH/cUSDC') required" },
        { status: 400 },
      );
    }
    const signal = await getMarketSignal(pair);
    return NextResponse.json(signal);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
