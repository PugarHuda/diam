/**
 * ChainGPT API client — auditor, price advisor, compliance, market signals.
 *
 * API requires `model` field. Available models verified via API:
 *   general_assistant, smart_contract_generator, smart_contract_auditor,
 *   AI_trading_assistant, ask_crypto, NFT_generator, trading_advisor,
 *   compliance_bot, in_depth_audit, ai_signal_watchlist, generalchat,
 *   multi_agent, langchain, smt, custom, llama2, general_assistant_falcon
 *
 * Endpoint: POST https://api.chaingpt.org/chat/stream
 * Auth: Authorization: Bearer <CHAINGPT_API_KEY>
 * Free hackathon credits via Telegram @vladnazarxyz
 */

const CHAINGPT_BASE_URL = "https://api.chaingpt.org";

export type ChainGPTModel =
  | "general_assistant"
  | "smart_contract_generator"
  | "smart_contract_auditor"
  | "AI_trading_assistant"
  | "ask_crypto"
  | "trading_advisor"
  | "compliance_bot"
  | "in_depth_audit"
  | "ai_signal_watchlist";

function getApiKey(): string {
  const key = process.env.CHAINGPT_API_KEY;
  if (!key) throw new Error("CHAINGPT_API_KEY not set in environment");
  return key;
}

/* -------------------------------------------------------------------------- */
/*                              Low-level call                                */
/* -------------------------------------------------------------------------- */

export interface ChatRequest {
  model: ChainGPTModel;
  question: string;
}

/**
 * Send question to ChainGPT and return raw text response.
 * Streaming endpoint returns either plain text (auditor, advisor) or
 * JSON-fenced markdown (general_assistant). Caller handles parsing.
 */
export async function askChainGPT(req: ChatRequest): Promise<string> {
  const res = await fetch(`${CHAINGPT_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: req.model,
      question: req.question,
      chatHistory: "off",
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`ChainGPT ${res.status}: ${text.slice(0, 200)}`);
  }

  return text;
}

/* -------------------------------------------------------------------------- */
/*                            Smart Contract Auditor                          */
/* -------------------------------------------------------------------------- */

export interface AuditReport {
  riskLevel: "low" | "medium" | "high";
  raw: string;
  findings: string[];
}

/**
 * Audit a Solidity snippet. Returns markdown-formatted audit + heuristic
 * risk classification.
 */
export async function auditContract(solidityCode: string): Promise<AuditReport> {
  const raw = await askChainGPT({
    model: "smart_contract_auditor",
    question: `Audit this Solidity contract for security issues, gas inefficiencies, and best-practice violations:\n\n${solidityCode}`,
  });

  // Extract numbered findings from markdown sections like "1. **Issue**:"
  const findingMatches = raw.matchAll(/^\s*\d+\.\s+\*\*([^*]+)\*\*/gm);
  const findings = Array.from(findingMatches, (m) => m[1].trim());

  const lower = raw.toLowerCase();
  const riskLevel: AuditReport["riskLevel"] = lower.includes("critical")
    ? "high"
    : lower.includes("warning") ||
        lower.includes("vulnerab") ||
        findings.length >= 3
      ? "medium"
      : "low";

  return { riskLevel, raw, findings };
}

/* -------------------------------------------------------------------------- */
/*                              Fair Price Advisor                            */
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
 * Sanity-check trade pricing using ChainGPT's market awareness.
 *
 * Real ChainGPT response shape:
 *   ```json
 *   {"fairPriceUsd": 2300.18, "rationale": "Current market price..."}
 *   ```
 * Returned wrapped in markdown code fence — must strip.
 */
export async function checkFairPrice(
  pair: string,
  yourPriceUsd: number,
): Promise<PriceCheck> {
  const raw = await askChainGPT({
    model: "general_assistant",
    question: `What is the current fair market price (USD) for ${pair}? My intended trade price is $${yourPriceUsd}. Reply ONLY strict JSON, no markdown: {"fairPriceUsd": number, "rationale": "short explanation"}`,
  });

  let fairPriceUsd = yourPriceUsd;
  let rationale = "ChainGPT response could not be parsed";
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as {
        fairPriceUsd: number;
        rationale: string;
      };
      if (typeof parsed.fairPriceUsd === "number") {
        fairPriceUsd = parsed.fairPriceUsd;
      }
      if (parsed.rationale) rationale = parsed.rationale;
    }
  } catch {
    // Fall through with defaults
  }

  const deltaBps =
    fairPriceUsd > 0
      ? Math.round(((yourPriceUsd - fairPriceUsd) / fairPriceUsd) * 10000)
      : 0;
  const warning =
    Math.abs(deltaBps) > 500
      ? `Your price is ${(deltaBps / 100).toFixed(1)}% off market — confirm intent`
      : undefined;

  return { pair, fairPriceUsd, yourPriceUsd, deltaBps, warning, rationale };
}

/* -------------------------------------------------------------------------- */
/*                        AI Trading Insights (market signal)                 */
/* -------------------------------------------------------------------------- */

export interface MarketSignal {
  pair: string;
  bias: "bullish" | "bearish" | "neutral";
  confidence: "low" | "medium" | "high";
  rationale: string;
}

export async function getMarketSignal(pair: string): Promise<MarketSignal> {
  const raw = await askChainGPT({
    model: "general_assistant",
    question: `Provide a 24h trading bias for ${pair}. Reply ONLY strict JSON, no markdown: {"bias":"bullish|bearish|neutral","confidence":"low|medium|high","rationale":"1-sentence reason"}`,
  });

  let bias: MarketSignal["bias"] = "neutral";
  let confidence: MarketSignal["confidence"] = "low";
  let rationale = "ChainGPT response could not be parsed";

  try {
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    const match = cleaned.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as Partial<MarketSignal>;
      if (parsed.bias) bias = parsed.bias;
      if (parsed.confidence) confidence = parsed.confidence;
      if (parsed.rationale) rationale = parsed.rationale;
    }
  } catch {
    /* fallthrough */
  }

  return { pair, bias, confidence, rationale };
}

/* -------------------------------------------------------------------------- */
/*                            Compliance Check                                */
/* -------------------------------------------------------------------------- */

export interface ComplianceReport {
  flags: string[];
  raw: string;
}

export async function checkCompliance(
  pair: string,
  jurisdiction: string,
): Promise<ComplianceReport> {
  const raw = await askChainGPT({
    model: "general_assistant",
    question: `Brief compliance overview for confidential OTC trade of ${pair} in ${jurisdiction}. List any regulatory flags (KYC, AML, securities) as numbered points. 3-4 sentences max.`,
  });

  const flagMatches = raw.matchAll(/^\s*\d+\.\s+\*\*?([^*\n]+)\*?\*?/gm);
  const flags = Array.from(flagMatches, (m) => m[1].trim()).slice(0, 5);

  return { flags, raw };
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

export async function generateSettlementReport(
  ctx: SettlementContext,
): Promise<string> {
  return askChainGPT({
    model: "general_assistant",
    question: `Write a 3-sentence audit-friendly report of this confidential OTC settlement:
- Transaction: ${ctx.txHash}
- Asset pair: ${ctx.pair}
- Maker: ${ctx.maker}
- Taker: ${ctx.taker}
- Time (unix): ${ctx.timestamp}

Note: amounts are encrypted on-chain via iExec Nox confidential computing.
Mention compliance posture: event auditable, amounts hidden, no MEV exposure.`,
  });
}

/* -------------------------------------------------------------------------- */
/*                              NFT Receipt                                   */
/* -------------------------------------------------------------------------- */

export interface NftReceipt {
  /** base64-encoded JPEG data URL */
  imageDataUrl: string;
  prompt: string;
  /** Unique fingerprint baked into prompt — also used for filename / sharing */
  fingerprint: string;
}

export interface NftReceiptInput {
  pair: string;
  intentId: string;
  mode: "Direct" | "RFQ";
  // Optional unique trade context — when provided, baked into prompt so each
  // receipt has visually distinct seed
  txHash?: string;
  blockNumber?: string;
  timestamp?: number;
  makerAddress?: string;
  /** Encrypted handle for sell amount (bytes32 hex) — used as visual signature */
  sellHandle?: string;
}

/**
 * Generate an NFT receipt image for a confidential trade.
 *
 * Each call yields a visually unique image because the prompt embeds:
 *   - Trade ID + asset pair
 *   - Mode-specific visual theme (handshake vs auction)
 *   - Last 6 chars of tx hash → "signature glyph"
 *   - Block number, time, maker tag → "telemetry watermark"
 *   - Encrypted handle prefix → "cryptographic fingerprint"
 *
 * Endpoint: POST /nft/generate-image · model: velogen · 512x512 JPEG
 */
export async function generateNftReceipt(
  opts: NftReceiptInput,
): Promise<NftReceipt> {
  // Compute fingerprint — short identifier baked into prompt + filename
  const fingerprint = [
    `IX${opts.intentId.padStart(4, "0")}`,
    opts.txHash ? opts.txHash.slice(2, 8).toUpperCase() : "",
    opts.blockNumber ? `B${opts.blockNumber.slice(-6)}` : "",
  ]
    .filter(Boolean)
    .join("-");

  // Mode-specific theme directives — drives different visual outputs
  const modeTheme =
    opts.mode === "RFQ"
      ? "Multiple sealed envelopes converging into a single hexagonal vault — Vickrey auction motif. Three to five envelopes orbiting around a central glowing seal, suggesting sealed-bid second-price auction. Geometric tension between envelopes."
      : "Two interlocking handshake glyphs forming a bilateral seal — Direct OTC motif. Two abstract hexagonal sigils meeting at a central transaction point, suggesting atomic peer-to-peer settlement.";

  const handleSig = opts.sellHandle
    ? opts.sellHandle.slice(2, 10).toUpperCase()
    : "ENCRYPTED";

  const txSig = opts.txHash ? opts.txHash.slice(-6).toUpperCase() : "PENDING";

  const timeFragment = opts.timestamp
    ? new Date(opts.timestamp).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const makerTag = opts.makerAddress
    ? opts.makerAddress.slice(2, 6).toUpperCase()
    : "0000";

  const prompt = `Abstract minimalist NFT receipt for confidential on-chain trade.

Trade fingerprint: ${fingerprint}
Asset pair: ${opts.pair}
Mode: ${opts.mode === "RFQ" ? "Vickrey RFQ Auction" : "Direct OTC Bilateral"}
Maker tag: 0x${makerTag}
Encrypted handle signature: 0x${handleSig}
Tx fingerprint: ${txSig}
Settlement date: ${timeFragment}
Network: Arbitrum Sepolia · iExec Nox TEE

Visual theme: ${modeTheme}

Aesthetic style: cyberpunk institutional finance terminal, deep black void
background (#0A0A0A), single-color matrix green accent (#00FF41), glowing
neon hexagonal lock pattern, scanlines, embedded ledger glyphs, geometric
typography reading "${fingerprint}" as etched seal, cryptographic key
filaments floating in void. Premium dark-pool aesthetic — institutional,
not playful. Composition is centered with corner brackets like a digital
certificate.`;

  const res = await fetch(`${CHAINGPT_BASE_URL}/nft/generate-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      prompt,
      model: "velogen",
      width: 512,
      height: 512,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NFT generate failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    statusCode: number;
    data?: { type: "Buffer"; data: number[] };
  };

  if (!json.data?.data || !Array.isArray(json.data.data)) {
    throw new Error("NFT response missing image data");
  }

  // Convert byte array to base64 → data URL
  const bytes = new Uint8Array(json.data.data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = Buffer.from(binary, "binary").toString("base64");

  return {
    imageDataUrl: `data:image/jpeg;base64,${base64}`,
    prompt,
    fingerprint,
  };
}
