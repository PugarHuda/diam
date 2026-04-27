/**
 * Strategy Coach Agent — daily ChainGPT-powered analyst.
 *
 * Pulls user's recent trades (decrypted via auditor key), sends to ChainGPT
 * for pattern analysis + improvement suggestions, posts via webhook.
 *
 * Hackathon scope: skeleton only. Real implementation needs:
 *   - Auditor key delegation (Nox.addViewer to agent address)
 *   - Off-chain trade history index (Subgraph or KV)
 *   - ChainGPT context-injection of trade history
 */

const DAILY_MS = 24 * 60 * 60 * 1000;

export async function startStrategyCoach() {
  console.log("[strategy-coach] started (daily cron)");
  setInterval(() => analyzeOnce().catch((e) => console.error("[strategy-coach]", e)), DAILY_MS);
}

async function analyzeOnce() {
  // TODO: pull last 30 days of Settled events for the user
  // TODO: decrypt amounts via auditor key
  // TODO: POST to ChainGPT with structured trade history
  // TODO: post analysis report to webhook
  console.log("[strategy-coach] tick — no-op (skeleton)");
}
