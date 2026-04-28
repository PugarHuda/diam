import { NextRequest, NextResponse } from "next/server";
import { generateNftReceipt, type NftReceiptInput } from "@/lib/chaingpt";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<NftReceiptInput>;

    if (!body.pair || !body.intentId || !body.mode) {
      return NextResponse.json(
        { error: "pair, intentId, mode required" },
        { status: 400 },
      );
    }

    const receipt = await generateNftReceipt(body as NftReceiptInput);
    return NextResponse.json(receipt);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
