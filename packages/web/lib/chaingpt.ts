/**
 * ChainGPT API client — auditor + price advisor + report generator.
 *
 * Uses raw fetch instead of @chaingpt/generalchat or @chaingpt/smartcontractauditor
 * SDKs to keep bundles edge-runtime compatible. SDK packages exist if you prefer:
 *   - @chaingpt/generalchat (Web3 LLM)
 *   - @chaingpt/smartcontractauditor (audit)
 *
 * Setup: get API key from https://app.chaingpt.org (free hackathon credits via
 * Telegram @vladnazarxyz per iExec brief).
 */

const CHAINGPT_BASE_URL = "https://api.chaingpt.org";

function getApiKey(): string {
  const key = process.env.CHAINGPT_API_KEY;
  if (!key) {
    throw new Error("CHAINGPT_API_KEY not set in environment");
  }
  return key;
}

/* -------------------------------------------------------------------------- */
/*                                  Web3 LLM                                  */
/* -------------------------------------------------------------------------- */

export interface ChatRequest {
  question: string;
  chatHistory?: "on" | "off";
  contextInjection?: {
    enabled: boolean;
    contextContent?: string;
  };
}

export interface ChatResponse {
  data: {
    bot: string;
  };
}

/** Send a question to ChainGPT Web3 LLM. Returns raw answer text. */
export async function askChainGPT(req: ChatRequest): Promise<string> {
  const res = await fetch(`${CHAINGPT_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      question: req.question,
      chatHistory: req.chatHistory ?? "off",
      ...(req.contextInjection && { contextInjection: req.contextInjection }),
    }),
  });

  if (!res.ok) {
    throw new Error(`ChainGPT chat failed: ${res.status} ${await res.text()}`);
  }

  // ChainGPT streams responses as SSE. For non-streaming consumers, accumulate.
  const text = await res.text();
  // Best-effort parse: try JSON first, fall back to raw text
  try {
    const json = JSON.parse(text) as ChatResponse;
    return json.data?.bot ?? text;
  } catch {
    return text;
  }
}

/* -------------------------------------------------------------------------- */
/*                            Smart Contract Auditor                          */
/* -------------------------------------------------------------------------- */

export interface AuditReport {
  riskLevel: "low" | "medium" | "high";
  findings: string[];
  recommendations: string[];
  raw: string;
}

/**
 * Audit a Solidity snippet via ChainGPT Smart Contract Auditor.
 * Auditor returns natural-language analysis; we extract structure heuristically.
 */
export async function auditContract(solidityCode: string): Promise<AuditReport> {
  const prompt = `Audit the following Solidity contract for security issues, gas inefficiencies, and best-practice violations. Return findings as a numbered list, then recommendations as another numbered list.\n\n${solidityCode}`;

  const raw = await askChainGPT({
    question: prompt,
    chatHistory: "off",
  });

  // Heuristic parse — auditor returns prose
  const lower = raw.toLowerCase();
  const riskLevel: AuditReport["riskLevel"] = lower.includes("critical")
    ? "high"
    : lower.includes("warning") || lower.includes("medium")
      ? "medium"
      : "low";

  const findings = extractList(raw, /finding|issue|vulnerab/i);
  const recommendations = extractList(raw, /recommend|suggest|fix/i);

  return { riskLevel, findings, recommendations, raw };
}

/* -------------------------------------------------------------------------- */
/*                              Price Sanity Check                            */
/* -------------------------------------------------------------------------- */

export interface PriceCheck {
  pair: string;
  fairPriceUsd: number;
  yourPriceUsd: number;
  deltaBps: number;
  warning?: string;
  rationale: string;
}

/**
 * Sanity-check trade pricing using ChainGPT's on-chain market awareness.
 *
 * @param pair        Asset pair, e.g. "ETH/USDC"
 * @param yourPriceUsd Your intended unit price in USD
 */
export async function checkFairPrice(
  pair: string,
  yourPriceUsd: number
): Promise<PriceCheck> {
  const question = `What is the current fair market price for ${pair}? My intended trade price is $${yourPriceUsd}. Is this reasonable? Reply ONLY with strict JSON: {"fairPriceUsd": number, "rationale": string}`;

  const raw = await askChainGPT({ question, chatHistory: "off" });

  // Try to parse JSON from response
  let fairPriceUsd = yourPriceUsd;
  let rationale = "ChainGPT response parse failed";
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        fairPriceUsd: number;
        rationale: string;
      };
      fairPriceUsd = parsed.fairPriceUsd;
      rationale = parsed.rationale;
    }
  } catch {
    // Fall through with defaults
  }

  const deltaBps = Math.round(
    ((yourPriceUsd - fairPriceUsd) / fairPriceUsd) * 10000
  );
  const warning =
    Math.abs(deltaBps) > 500
      ? `Your price is ${(deltaBps / 100).toFixed(1)}% off market — confirm intent`
      : undefined;

  return {
    pair,
    fairPriceUsd,
    yourPriceUsd,
    deltaBps,
    warning,
    rationale,
  };
}

/* -------------------------------------------------------------------------- */
/*                            Settlement Report                               */
/* -------------------------------------------------------------------------- */

export interface SettlementContext {
  txHash: string;
  pair: string;
  maker: string;
  taker: string;
  timestamp: number;
}

/**
 * Generate human-readable settlement report for auditor view.
 * Encrypted amounts stay encrypted — report describes what was on-chain only.
 */
export async function generateSettlementReport(
  ctx: SettlementContext
): Promise<string> {
  const question = `Write a 3-sentence audit-friendly report of this confidential OTC settlement:
- Transaction: ${ctx.txHash}
- Asset pair: ${ctx.pair}
- Maker: ${ctx.maker}
- Taker: ${ctx.taker}
- Time (unix): ${ctx.timestamp}

Note: amounts are encrypted on-chain via iExec Nox confidential computing.
Report should mention compliance posture (event auditable, amounts hidden, no MEV exposure).`;

  return askChainGPT({ question, chatHistory: "off" });
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function extractList(text: string, marker: RegExp): string[] {
  const lines = text.split("\n");
  const out: string[] = [];
  let inSection = false;
  for (const line of lines) {
    if (marker.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^\d+[\).]\s+/.test(line.trim())) {
      out.push(line.replace(/^\d+[\).]\s+/, "").trim());
    } else if (inSection && line.trim() === "") {
      // section break
      if (out.length > 0) inSection = false;
    }
  }
  return out;
}
