import { NextRequest, NextResponse } from "next/server";
import { checkFairPrice } from "@/lib/chaingpt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { pair, yourPriceUsd } = (await req.json()) as {
      pair: string;
      yourPriceUsd: number;
    };
    const result = await checkFairPrice(pair, yourPriceUsd);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
